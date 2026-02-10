from fastapi import FastAPI, HTTPException, Request, status, UploadFile, File
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os
import uuid
from datetime import datetime, timedelta

# Local imports
from database import read_csv, save_csv, CLIENTES_CSV, KIT_DIGITAL_CSV, ACUERDOS_CSV, FACTURAS_CSV
from models import (
    Cliente, ClienteUpdate, 
    KitDigital, 
    Acuerdo, AcuerdoUpdate, 
    Factura, FacturaUpdate
)
from logic import recalcular_estados
import generate_client_csv

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
    "http://localhost:5174",  # Local development (alternative port)
    "http://localhost:5175",  # Local development (alternative port)
    frontend_url,  # Production (from environment variable)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Endpoints ---

@app.get("/api/clientes")
def get_clientes():
    recalcular_estados()
    df_c = read_csv(CLIENTES_CSV)
    df_k = read_csv(KIT_DIGITAL_CSV)
    df_a = read_csv(ACUERDOS_CSV)
    df_f = read_csv(FACTURAS_CSV)
    
    # Cast Dnis
    if not df_c.empty:
        df_c['Dni'] = df_c['Dni'].astype(str)
    else:
        return []

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

@app.patch("/api/acuerdos/{id_acuerdo}")
def update_acuerdo(id_acuerdo: str, update: AcuerdoUpdate):
    df_a = read_csv(ACUERDOS_CSV)
    if df_a.empty or str(id_acuerdo) not in df_a['Id_Acuerdo'].astype(str).values:
        raise HTTPException(status_code=404, detail="Acuerdo no encontrado")
        
    idx = df_a[df_a['Id_Acuerdo'].astype(str) == str(id_acuerdo)].index[0]
    update_data = update.model_dump(exclude_unset=True)
        
    for key, value in update_data.items():
        if key not in df_a.columns:
            df_a[key] = None
        df_a.at[idx, key] = value
            
    save_csv(df_a, ACUERDOS_CSV)
    recalcular_estados()
    return {"message": "Acuerdo actualizado"}

from fastapi.responses import FileResponse, JSONResponse

@app.post("/api/automation/generate-client-csv")
def run_client_csv_generation():
    try:
        result = generate_client_csv.main()
        if result and result.get("status") == "success":
            file_path = result.get("file")
            if file_path and os.path.exists(file_path):
                # Return the file as a downloadable attachment
                return FileResponse(
                    path=file_path, 
                    filename="clientes_filtrados.csv", 
                    media_type='text/csv'
                )
            else:
                 return JSONResponse(status_code=404, content={"status": "error", "message": "File not found after generation."})
        else:
            # If main returns None (e.g. early return in script), construct a message
            # logic in generate_client_csv might return None if checks fail, 
            # let's Ensure generate_client_csv always returns a dict or handle None.
            return JSONResponse(
                status_code=200, 
                content={"status": "info", "message": "Proceso completado, pero no se generaron datos (ver logs server)."}
            )
    except Exception as e:
        print(f"Error executing automation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/automation/preview-import")
async def preview_import_endpoint(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")
    
    try:
        content = await file.read()
        import import_clients
        result = import_clients.preview_import(content)
        return result
    except Exception as e:
        print(f"Error previewing import: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/automation/confirm-import")
def confirm_import_endpoint(data: dict):
    # data expected to have "clients" list
    clients_data = data.get("clients", [])
    if not clients_data:
        raise HTTPException(status_code=400, detail="No client data provided for import.")
    
    try:
        import import_clients
        result = import_clients.execute_import(clients_data)
        return result
    except Exception as e:
        print(f"Error executing import: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
