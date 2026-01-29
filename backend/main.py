from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Union
import pandas as pd
import numpy as np
import os
import uuid
from datetime import datetime, timedelta

app = FastAPI(title="CRM Control Nofence")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"ERROR: 422 Validation Error on {request.url}")
    print(f"Body: {await request.body()}")
    print(f"Details: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": str(exc.body)},
    )

# CORS configuration for production
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [
    "http://localhost:5173",  # Local development
    frontend_url,  # Production (from environment variable)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CLIENTES_CSV = os.path.join(DATA_DIR, "clientes.csv")
KIT_DIGITAL_CSV = os.path.join(DATA_DIR, "kit_digital.csv")
ACUERDOS_CSV = os.path.join(DATA_DIR, "acuerdos.csv")
FACTURAS_CSV = os.path.join(DATA_DIR, "facturas.csv")

# Modelos Pydantic
class Factura(BaseModel):
    Id_Factura: Optional[str] = None
    Dni_Cliente: Optional[str] = None
    Id_Acuerdo: Optional[str] = None
    Numero_Factura_Real: str
    Concepto: str
    Importe: float
    Fecha_Emision: str
    Estado_Pago: str # Pagado/Pendiente
    Fecha_Pago: Optional[str] = None

class Acuerdo(BaseModel):
    Id_Acuerdo: Optional[str] = None
    Dni_Cliente: Optional[str] = None
    Numero_Acuerdo: Optional[str] = ""
    Tipo: str # GA / GC
    Importe: float
    Fecha_Aprobacion: Optional[str] = None
    Estado: Optional[str] = "Borrador" # Borrador, Pendiente de Capturas, Enviado, Firmado
    Enviado: Optional[bool] = False # Legacy/Helper
    Fecha_Envio: Optional[str] = None
    Firmado: Optional[bool] = False # Legacy/Helper
    Fecha_Firma: Optional[str] = None
    Estado_Justificacion: Optional[str] = None # Pendiente de captura, Enviada para firma, Justificada

class AcuerdoUpdate(BaseModel):
    Numero_Acuerdo: Optional[str] = None
    Fecha_Aprobacion: Optional[str] = None
    Estado: Optional[str] = None
    Enviado: Optional[bool] = None
    Fecha_Envio: Optional[str] = None
    Firmado: Optional[bool] = None
    Fecha_Firma: Optional[str] = None
    Estado_Justificacion: Optional[str] = None

class FacturaUpdate(BaseModel):
    Numero_Factura_Real: Optional[str] = None
    Concepto: Optional[str] = None
    Importe: Optional[float] = None
    Fecha_Emision: Optional[str] = None
    Estado_Pago: Optional[str] = None
    Fecha_Pago: Optional[str] = None

# ... (rest of models)

# ... (rest of code)

@app.patch("/api/acuerdos/{id_acuerdo}")
def update_acuerdo(id_acuerdo: str, update: AcuerdoUpdate):
    df_a = read_csv(ACUERDOS_CSV)
    if df_a.empty or str(id_acuerdo) not in df_a['Id_Acuerdo'].astype(str).values:
        raise HTTPException(status_code=404, detail="Acuerdo no encontrado")
    
    idx = df_a[df_a['Id_Acuerdo'].astype(str) == str(id_acuerdo)].index[0]
    update_data = update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if key not in df_a.columns:
            df_a[key] = None # Or appropriate default
        df_a.at[idx, key] = value
        
    save_csv(df_a, ACUERDOS_CSV)
    recalcular_estados()
    return {"message": "Acuerdo actualizado"}

class KitDigital(BaseModel):
    Dni: str
    Numero_Bono: Optional[str] = None
    Importe_Bono: Optional[float] = None
    Fecha_Aprobacion_Bono: Optional[str] = None

class Cliente(BaseModel):
    Dni: str
    Nombre: str
    Telefono: str
    Email: str
    
    # Dirección
    Calle: Optional[str] = None
    Localidad: Optional[str] = None
    Provincia: Optional[str] = None
    Codigo_Postal: Optional[str] = None
    
    Estado: Optional[str] = "Kit pedido"
    Estado_Nofence: Optional[str] = None 
    Importe_Nofence: Optional[float] = None  # Payment amount for Nofence
    Collares: Optional[str] = None  # JSON array of collar numbers
    Pedido_Nofence: Optional[str] = None
    Importe_Factura_Nofence: Optional[float] = None
    Importe_Cobrado_Cliente: Optional[float] = None
    Beneficio: Optional[float] = None

class ClienteUpdate(BaseModel):
    Nombre: Optional[str] = None
    Telefono: Optional[str] = None
    Email: Optional[str] = None
    Calle: Optional[str] = None
    Localidad: Optional[str] = None
    Provincia: Optional[str] = None
    Codigo_Postal: Optional[str] = None
    Estado_Nofence: Optional[str] = None
    Importe_Nofence: Optional[float] = None
    Collares: Optional[str] = None
    Pedido_Nofence: Optional[str] = None
    Importe_Factura_Nofence: Optional[float] = None
    Importe_Cobrado_Cliente: Optional[float] = None
    Beneficio: Optional[float] = None

# Helpers para persistencia
def read_csv(path):
    if not os.path.exists(path):
        return pd.DataFrame()
    df = pd.read_csv(path)
    # No rellenamos con "" globalmente para no romper tipos numéricos
    return df

def save_csv(df, path):
    df.to_csv(path, index=False)

def recalcular_estados():
    df_c = read_csv(CLIENTES_CSV)
    df_k = read_csv(KIT_DIGITAL_CSV)
    df_a = read_csv(ACUERDOS_CSV)
    df_f = read_csv(FACTURAS_CSV)

    if df_c.empty:
        return
        
    # Para lógica interna, sí podemos usar fillna en copias
    df_k_safe = df_k.fillna("")
    df_a_safe = df_a.fillna("")
    df_f_safe = df_f.fillna("")

    for index, row in df_c.iterrows():
        dni = str(row['Dni'])
        
        # Datos relacionados
        kit_row = df_k_safe[df_k_safe['Dni'].astype(str) == dni]
        acuerdos_cliente = df_a_safe[df_a_safe['Dni_Cliente'].astype(str) == dni]
        facturas_cliente = df_f_safe[df_f_safe['Dni_Cliente'].astype(str) == dni]
        
        # 1. Estado Base
        nuevo_estado = "Kit pedido"
        
        # 2. Kit Aprobado
        if not kit_row.empty:
            k = kit_row.iloc[0]
            if str(k.get('Numero_Bono')).strip() != "":
                nuevo_estado = "Kit aprobado"
                
        # 3. Acuerdos
        if not acuerdos_cliente.empty:
            # Si hay al menos un acuerdo enviado
            enviados = acuerdos_cliente[acuerdos_cliente['Enviado'] == True]
            if not enviados.empty:
                nuevo_estado = "Acuerdos enviados"
            
            # Si hay al menos un acuerdo firmado (prevalece sobre enviado)
            firmados = acuerdos_cliente[acuerdos_cliente['Firmado'] == True]
            if not firmados.empty:
                nuevo_estado = "Acuerdos firmados"
                
            # Si hay al menos un acuerdo con numero y fecha aprobacion (prevalece sobre firmado)
            aprobados = acuerdos_cliente[
                (acuerdos_cliente['Numero_Acuerdo'].astype(str).str.strip() != "") & 
                (acuerdos_cliente['Fecha_Aprobacion'].astype(str).str.strip() != "")
            ]
            if not aprobados.empty:
                nuevo_estado = "Acuerdos aprobados"
                
        # 4. Facturas
        if not facturas_cliente.empty:
            nuevo_estado = "Factura enviada"
            
            # Si TODAS las facturas están pagadas? O al menos una? 
            # El requisito dice "si se marca o rellena la opcion de pagada sera factura pagada"
            # Asumiremos que si hay alguna factura pagada es suficiente o si la ultima lo esta.
            # Logica conservadora: Si hay facturas y alguna esta pagada -> Factura pagada
            pagadas = facturas_cliente[facturas_cliente['Estado_Pago'] == 'Pagado']
            if not pagadas.empty:
                nuevo_estado = "Factura pagada"

        # 5. Justificación (Prevalece sobre todo si existe)
        if not acuerdos_cliente.empty and 'Estado_Justificacion' in acuerdos_cliente.columns:
            # Buscamos el estado de justificación más avanzado (o más 'bloqueante')
            # Pendiente de captura -> Pendiente de justificar
            # Enviada para firma -> Justificación pendiente de firma
            # Justificada -> Justificado
            
            # Prioridad de estados de justificación (de menor a mayor avance global, pero mas específico)
            # Logica de visualización: Si tengo una pendiente y una justificada, ¿en que estado estoy?
            # Probablemente en el que requiera acción: Pendiente.
            
            estados_justif = acuerdos_cliente['Estado_Justificacion'].unique().tolist()
            
            # Mapeo de valores DB a texto Cliente
            # 'Pendiente de captura', 'Enviada para firma', 'Justificada'
            
            if 'Pendiente de captura' in estados_justif:
                nuevo_estado = "Pendiente de justificar"
            elif 'Enviada para firma' in estados_justif:
                nuevo_estado = "Justificación pendiente de firma"
            elif 'Justificada' in estados_justif:
                # Solo si TODOS están justificados o AL MENOS uno? 
                # Si llegamos aqui, no hay pendientes ni enviadas. 
                # Significa que las que tengan algo, tienen 'Justificada'.
                # Pero cuidado con los NULL/None.
                
                # Chequear si todos los acuerdos 'facturados' estan justificados
                # Simplificación: Si hay al menos un 'Justificada' y no hay pendientes anteriores -> Justificado
                nuevo_estado = "Justificado"

        df_c.at[index, 'Estado'] = nuevo_estado

    save_csv(df_c, CLIENTES_CSV)

# --- Endpoints ---

@app.get("/api/clientes")
def get_clientes():
    recalcular_estados()
    df_c = read_csv(CLIENTES_CSV)
    df_k = read_csv(KIT_DIGITAL_CSV)
    df_a = read_csv(ACUERDOS_CSV)
    df_f = read_csv(FACTURAS_CSV)
    
    # Cast Dnis
    df_c['Dni'] = df_c['Dni'].astype(str)
    if not df_k.empty:
        df_k['Dni'] = df_k['Dni'].astype(str)
        df_combined = pd.merge(df_c, df_k, on="Dni", how="left")
    else:
        df_combined = df_c.copy()
        
    # Reemplazar NaN por None para JSON válido
    df_combined = df_combined.replace({np.nan: None})

    clientes_list = df_combined.to_dict(orient="records")
    
    for client in clientes_list:
        dni = str(client['Dni'])
        
        # Acuerdos
        if not df_a.empty:
            client_acuerdos = df_a[df_a['Dni_Cliente'].astype(str) == dni].replace({np.nan: None}).to_dict(orient="records")
        else:
            client_acuerdos = []
            
        # Fechas límite Acuerdos
        fecha_bono = client.get('Fecha_Aprobacion_Bono')
        limite_acuerdos = None
        if fecha_bono:
            try:
                dt_bono = datetime.strptime(str(fecha_bono), "%Y-%m-%d")
                limite_acuerdos = (dt_bono + timedelta(days=180)).strftime("%Y-%m-%d")
            except:
                pass
        client['Fecha_Limite_Acuerdos'] = limite_acuerdos
        
        # Facturas por Acuerdo
        for acuerdo in client_acuerdos:
            id_acuerdo = str(acuerdo['Id_Acuerdo'])
            if not df_f.empty:
                acuerdo_facturas = df_f[df_f['Id_Acuerdo'].astype(str) == id_acuerdo].replace({np.nan: None}).to_dict(orient="records")
            else:
                acuerdo_facturas = []
            acuerdo['facturas'] = acuerdo_facturas
            
            # Limite Factura
            fecha_aprob = acuerdo.get('Fecha_Aprobacion')
            limite_factura = None
            if fecha_aprob:
                try:
                    dt_aprob = datetime.strptime(str(fecha_aprob), "%Y-%m-%d")
                    limite_factura = (dt_aprob + timedelta(days=90)).strftime("%Y-%m-%d")
                except:
                    pass
            acuerdo['Fecha_Limite_Factura'] = limite_factura

            # Limite Justificacion (calculado si hay factura)
            limite_justificacion = None
            if acuerdo_facturas:
                # Tomamos la fecha de emisión de la primera factura
                factura = acuerdo_facturas[0]
                fecha_emision = factura.get('Fecha_Emision')
                if fecha_emision:
                    try:
                        dt_emision = datetime.strptime(str(fecha_emision), "%Y-%m-%d")
                        # Asumimos 3 meses (90 días) para justificación tras factura
                        limite_justificacion = (dt_emision + timedelta(days=90)).strftime("%Y-%m-%d")
                    except:
                        pass
            acuerdo['Fecha_Limite_Justificacion'] = limite_justificacion

        client['acuerdos'] = client_acuerdos
        
        # Facturas Flat
        if not df_f.empty:
            all_facturas = df_f[df_f['Dni_Cliente'].astype(str) == dni].copy()
            client['facturas_flat'] = all_facturas.replace({np.nan: None}).to_dict(orient="records")
            
            all_facturas['Importe'] = pd.to_numeric(all_facturas['Importe'], errors='coerce').fillna(0)
            client['total_facturado'] = float(all_facturas['Importe'].sum())
        else:
            client['facturas_flat'] = []
            client['total_facturado'] = 0.0

    return clientes_list

@app.delete("/api/clientes/{dni}")
def delete_cliente(dni: str):
    print(f"DEBUG: Deleting client {dni}")
    # Eliminar de todos los CSVs
    files = [CLIENTES_CSV, KIT_DIGITAL_CSV, ACUERDOS_CSV, FACTURAS_CSV]
    dni_col_map = {
        CLIENTES_CSV: 'Dni',
        KIT_DIGITAL_CSV: 'Dni',
        ACUERDOS_CSV: 'Dni_Cliente',
        FACTURAS_CSV: 'Dni_Cliente'
    }
    
    for path in files:
        try:
            df = read_csv(path)
            col = dni_col_map[path]
            if not df.empty and col in df.columns:
                initial_len = len(df)
                df = df[df[col].astype(str) != str(dni)]
                print(f"DEBUG: Deleted {initial_len - len(df)} rows from {os.path.basename(path)}")
                save_csv(df, path)
        except Exception as e:
            print(f"ERROR deleting from {path}: {e}")
            
    return {"message": "Cliente eliminado correctamente"}

@app.post("/api/clientes")
def create_cliente(cliente: Cliente):
    df_c = read_csv(CLIENTES_CSV)
    if not df_c.empty and str(cliente.Dni) in df_c['Dni'].astype(str).values:
        # Update
        df_c = df_c[df_c['Dni'].astype(str) != str(cliente.Dni)]
    
    new_row = pd.DataFrame([cliente.model_dump()])
    df_c = pd.concat([df_c, new_row], ignore_index=True)
    save_csv(df_c, CLIENTES_CSV)
    
    # Ensure kit entry exists
    df_k = read_csv(KIT_DIGITAL_CSV)
    if df_k.empty or str(cliente.Dni) not in df_k['Dni'].astype(str).values:
        kit_entry = {"Dni": cliente.Dni}
        df_k = pd.concat([df_k, pd.DataFrame([kit_entry])], ignore_index=True)
        save_csv(df_k, KIT_DIGITAL_CSV)
        
    return {"message": "Cliente creado/actualizado"}

@app.put("/api/clientes/{dni}/kit")
def update_kit(dni: str, kit: KitDigital):
    df_k = read_csv(KIT_DIGITAL_CSV)
    if not df_k.empty and str(dni) in df_k['Dni'].astype(str).values:
        df_k = df_k[df_k['Dni'].astype(str) != str(dni)]
    
    new_row = pd.DataFrame([kit.model_dump()])
    df_k = pd.concat([df_k, new_row], ignore_index=True)
    save_csv(df_k, KIT_DIGITAL_CSV)
    recalcular_estados()
    return {"message": "Datos de Bono actualizados"}

@app.post("/api/clientes/{dni}/acuerdos")
def add_acuerdo(dni: str, acuerdo: Acuerdo):
    df_a = read_csv(ACUERDOS_CSV)
    acuerdo.Dni_Cliente = dni
    acuerdo.Id_Acuerdo = str(uuid.uuid4())[:8]
    
    new_row = pd.DataFrame([acuerdo.model_dump()])
    df_a = pd.concat([df_a, new_row], ignore_index=True)
    save_csv(df_a, ACUERDOS_CSV)
    recalcular_estados()
    return {"message": "Acuerdo añadido"}

@app.delete("/api/acuerdos/{id_acuerdo}")
def delete_acuerdo(id_acuerdo: str):
    df_a = read_csv(ACUERDOS_CSV)
    if not df_a.empty and str(id_acuerdo) in df_a['Id_Acuerdo'].astype(str).values:
        initial_len = len(df_a)
        df_a = df_a[df_a['Id_Acuerdo'].astype(str) != str(id_acuerdo)]
        if len(df_a) < initial_len:
            save_csv(df_a, ACUERDOS_CSV)
            recalcular_estados()
            return {"message": "Acuerdo eliminado"}
    raise HTTPException(status_code=404, detail="Acuerdo no encontrado")

@app.post("/api/clientes/{dni}/factura")
def add_factura(dni: str, factura: Factura):
    df_f = read_csv(FACTURAS_CSV)
    factura.Dni_Cliente = dni
    factura.Id_Factura = str(uuid.uuid4())[:8]
    
    new_row = pd.DataFrame([factura.model_dump()])
    df_f = pd.concat([df_f, new_row], ignore_index=True)
    save_csv(df_f, FACTURAS_CSV)
    recalcular_estados()
    return {"message": "Factura añadida"}

@app.patch("/api/facturas/{id_factura}")
def update_factura(id_factura: str, update: FacturaUpdate):
    df_f = read_csv(FACTURAS_CSV)
    if df_f.empty or str(id_factura) not in df_f['Id_Factura'].astype(str).values:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    idx = df_f[df_f['Id_Factura'].astype(str) == str(id_factura)].index[0]
    update_data = update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        df_f.at[idx, key] = value
        
    save_csv(df_f, FACTURAS_CSV)
    recalcular_estados()
    return {"message": "Factura actualizada"}

@app.patch("/api/clientes/{dni}")
def update_cliente(dni: str, update: ClienteUpdate):
    print(f"DEBUG: Updating client {dni} with data: {update.model_dump(exclude_unset=True)}")
    df_c = read_csv(CLIENTES_CSV)
    if df_c.empty or str(dni) not in df_c['Dni'].astype(str).values:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    idx = df_c[df_c['Dni'].astype(str) == str(dni)].index[0]
    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        # Ensure column exists
        if key not in df_c.columns:
            print(f"DEBUG: Creating new column {key}")
            df_c[key] = None
        print(f"DEBUG: Setting {key} = {value}")
        df_c.at[idx, key] = value
        
    save_csv(df_c, CLIENTES_CSV)
    print(f"DEBUG: Saved CSV. Client {dni} now has Collares: {df_c.at[idx, 'Collares'] if 'Collares' in df_c.columns else 'N/A'}")
    return {"message": "Cliente actualizado"}

@app.get("/api/dashboard")
def get_dashboard():
    df_c = read_csv(CLIENTES_CSV)
    df_f = read_csv(FACTURAS_CSV)
    
    total_clientes = len(df_c) if not df_c.empty else 0
    total_facturado = df_f['Importe'].sum() if not df_f.empty else 0
    
    # Alertas placeholder
    alertas = 0
        
    return {
        "total_clientes": total_clientes,
        "total_facturado": total_facturado,
        "alertas": alertas
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
