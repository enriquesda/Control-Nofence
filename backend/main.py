from fastapi import FastAPI, HTTPException, Request, status, UploadFile, File
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
import pandas as pd
import numpy as np
import os
import uuid
from datetime import datetime, timedelta

# Local imports
from database import read_csv, save_csv, init_db, CLIENTES_CSV, KIT_DIGITAL_CSV, ACUERDOS_CSV, FACTURAS_CSV, EQUIPOS_CSV, HISTORIAL_EQUIPOS_CSV, NOTAS_DASHBOARD_CSV
from models import (
    Cliente, ClienteUpdate, 
    KitDigital, 
    Acuerdo, AcuerdoUpdate, 
    Factura, FacturaUpdate,
    Equipo, EquipoUpdate, HistorialEquipo, NotaDashboard
)
from logic import recalcular_estados
import generate_client_csv

app = FastAPI(title="CRM Control Nofence")
@app.middleware("http")
async def block_direct_access(request: Request, call_next):
    host = request.headers.get("host", "")
    if "fly.dev" in host:
        return JSONResponse(status_code=403, content={"detail": "Acceso no permitido"})
    return await call_next(request)
# Initialize database (create CSVs if they don't exist)
init_db()

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
    
    if df_c.empty:
        return []

    df_c['Dni'] = df_c['Dni'].astype(str)

    # Merge with Kit Digital
    if not df_k.empty:
        df_k['Dni'] = df_k['Dni'].astype(str)
        df_combined = pd.merge(df_c, df_k, on="Dni", how="left")
    else:
        df_combined = df_c.copy()

    # Ensure Tipo column
    if 'Tipo' not in df_combined.columns:
        df_combined['Tipo'] = 'Nofence'
    else:
        df_combined['Tipo'] = df_combined['Tipo'].fillna('Nofence')

    df_combined = df_combined.replace({np.nan: None})
    clientes_list = df_combined.to_dict(orient="records")

    # --- Vectorized Acuerdos + Facturas ---
    # Build acuerdos map: {dni -> [acuerdos]}
    acuerdos_by_dni = {}
    if not df_a.empty:
        df_a['Dni_Cliente'] = df_a['Dni_Cliente'].astype(str)
        df_a_clean = df_a.replace({np.nan: None})
        
        # Build facturas map: {id_acuerdo -> [facturas]}
        facturas_by_acuerdo = {}
        facturas_by_dni = {}
        if not df_f.empty:
            df_f['Id_Acuerdo'] = df_f['Id_Acuerdo'].astype(str)
            df_f['Dni_Cliente'] = df_f['Dni_Cliente'].astype(str)
            df_f_clean = df_f.replace({np.nan: None})
            for row in df_f_clean.to_dict(orient="records"):
                facturas_by_acuerdo.setdefault(str(row['Id_Acuerdo']), []).append(row)
                facturas_by_dni.setdefault(str(row['Dni_Cliente']), []).append(row)

        for acuerdo in df_a_clean.to_dict(orient="records"):
            id_acuerdo = str(acuerdo['Id_Acuerdo'])
            acuerdo_facturas = facturas_by_acuerdo.get(id_acuerdo, [])
            acuerdo['facturas'] = acuerdo_facturas

            # Compute date limits
            fecha_aprob = acuerdo.get('Fecha_Aprobacion')
            limite_factura = None
            if fecha_aprob:
                try:
                    dt_aprob = datetime.strptime(str(fecha_aprob), "%Y-%m-%d")
                    limite_factura = (dt_aprob + timedelta(days=90)).strftime("%Y-%m-%d")
                except:
                    pass
            acuerdo['Fecha_Limite_Factura'] = limite_factura

            limite_justificacion = None
            if acuerdo_facturas:
                fecha_emision = acuerdo_facturas[0].get('Fecha_Emision')
                if fecha_emision:
                    try:
                        dt_emision = datetime.strptime(str(fecha_emision), "%Y-%m-%d")
                        limite_justificacion = (dt_emision + timedelta(days=90)).strftime("%Y-%m-%d")
                    except:
                        pass
            acuerdo['Fecha_Limite_Justificacion'] = limite_justificacion

            dni_key = str(acuerdo['Dni_Cliente'])
            acuerdos_by_dni.setdefault(dni_key, []).append(acuerdo)
    else:
        facturas_by_dni = {}

    # Attach to each client
    for client in clientes_list:
        dni = str(client['Dni'])
        client_acuerdos = acuerdos_by_dni.get(dni, [])
        client['acuerdos'] = client_acuerdos

        # Fecha límite acuerdos desde bono
        fecha_bono = client.get('Fecha_Aprobacion_Bono')
        limite_acuerdos = None
        if fecha_bono:
            try:
                dt_bono = datetime.strptime(str(fecha_bono), "%Y-%m-%d")
                limite_acuerdos = (dt_bono + timedelta(days=180)).strftime("%Y-%m-%d")
            except:
                pass
        client['Fecha_Limite_Acuerdos'] = limite_acuerdos

        # Facturas flat
        flat = facturas_by_dni.get(dni, [])
        client['facturas_flat'] = flat
        client['total_facturado'] = sum(float(f.get('Importe') or 0) for f in flat)

    return clientes_list


@app.get("/api/clientes/{dni}")
def get_cliente(dni: str):
    """Endpoint optimizado para cargar UN solo cliente. Mucho más rápido para la vista de detalle."""
    recalcular_estados()
    df_c = read_csv(CLIENTES_CSV)
    if df_c.empty:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    df_c['Dni'] = df_c['Dni'].astype(str)
    df_c_row = df_c[df_c['Dni'] == str(dni)]
    if df_c_row.empty:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    df_k = read_csv(KIT_DIGITAL_CSV)
    if not df_k.empty:
        df_k['Dni'] = df_k['Dni'].astype(str)
        df_k_row = df_k[df_k['Dni'] == str(dni)]
        if not df_k_row.empty:
            df_combined = pd.merge(df_c_row, df_k_row, on="Dni", how="left")
        else:
            df_combined = df_c_row.copy()
    else:
        df_combined = df_c_row.copy()

    if 'Tipo' not in df_combined.columns:
        df_combined['Tipo'] = 'Nofence'
    else:
        df_combined['Tipo'] = df_combined['Tipo'].fillna('Nofence')

    df_combined = df_combined.replace({np.nan: None})
    client = df_combined.to_dict(orient="records")[0]

    df_a = read_csv(ACUERDOS_CSV)
    df_f = read_csv(FACTURAS_CSV)

    client_acuerdos = []
    if not df_a.empty:
        df_a['Dni_Cliente'] = df_a['Dni_Cliente'].astype(str)
        client_acuerdos_df = df_a[df_a['Dni_Cliente'] == str(dni)].replace({np.nan: None})
        client_acuerdos = client_acuerdos_df.to_dict(orient="records")

        facturas_by_acuerdo = {}
        if not df_f.empty:
            df_f['Id_Acuerdo'] = df_f['Id_Acuerdo'].astype(str)
            df_f_row = df_f[df_f['Dni_Cliente'].astype(str) == str(dni)].replace({np.nan: None})
            for row in df_f_row.to_dict(orient="records"):
                facturas_by_acuerdo.setdefault(str(row['Id_Acuerdo']), []).append(row)
        
        for acuerdo in client_acuerdos:
            id_acuerdo = str(acuerdo['Id_Acuerdo'])
            acuerdo_facturas = facturas_by_acuerdo.get(id_acuerdo, [])
            acuerdo['facturas'] = acuerdo_facturas

            fecha_aprob = acuerdo.get('Fecha_Aprobacion')
            limite_factura = None
            if fecha_aprob:
                try:
                    dt_aprob = datetime.strptime(str(fecha_aprob), "%Y-%m-%d")
                    limite_factura = (dt_aprob + timedelta(days=90)).strftime("%Y-%m-%d")
                except:
                    pass
            acuerdo['Fecha_Limite_Factura'] = limite_factura

            limite_justificacion = None
            if acuerdo_facturas:
                fecha_emision = acuerdo_facturas[0].get('Fecha_Emision')
                if fecha_emision:
                    try:
                        dt_emision = datetime.strptime(str(fecha_emision), "%Y-%m-%d")
                        limite_justificacion = (dt_emision + timedelta(days=90)).strftime("%Y-%m-%d")
                    except:
                        pass
            acuerdo['Fecha_Limite_Justificacion'] = limite_justificacion

    client['acuerdos'] = client_acuerdos

    fecha_bono = client.get('Fecha_Aprobacion_Bono')
    limite_acuerdos = None
    if fecha_bono:
        try:
            dt_bono = datetime.strptime(str(fecha_bono), "%Y-%m-%d")
            limite_acuerdos = (dt_bono + timedelta(days=180)).strftime("%Y-%m-%d")
        except:
            pass
    client['Fecha_Limite_Acuerdos'] = limite_acuerdos

    flat = []
    if not df_f.empty:
        flat_df = df_f[df_f['Dni_Cliente'].astype(str) == str(dni)].replace({np.nan: None})
        flat = flat_df.to_dict(orient="records")
    client['facturas_flat'] = flat
    client['total_facturado'] = sum(float(f.get('Importe') or 0) for f in flat)

    return client

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

# --- EQUIPOS ENDPOINTS ---

@app.get("/api/equipos")
def get_equipos(estado: str = None, dni_cliente: str = None):
    df_e = read_csv(EQUIPOS_CSV)
    
    if df_e.empty:
        return []
        
    if estado:
        df_e = df_e[df_e['Estado'] == estado]
        
    if dni_cliente:
        df_e = df_e[df_e['Dni_Cliente'].astype(str) == str(dni_cliente)]
    
    # Enrich with Client Type
    df_c = read_csv(CLIENTES_CSV)
    if not df_c.empty and not df_e.empty:
        # Create a mapping dictionary for Dni -> Tipo
        # Handle case where Tipo might not exist in old CSVs yet
        if 'Tipo' not in df_c.columns:
            df_c['Tipo'] = 'Nofence'
            
        # Ensure Dni is string for matching
        df_c['Dni'] = df_c['Dni'].astype(str)
        df_e['Dni_Cliente'] = df_e['Dni_Cliente'].astype(str)
        
        # Merge or map
        tipo_map = dict(zip(df_c['Dni'], df_c['Tipo']))
        df_e['Cliente_Tipo'] = df_e['Dni_Cliente'].map(tipo_map).fillna('Nofence')
    else:
        df_e['Cliente_Tipo'] = 'Nofence'
        
    return df_e.replace({np.nan: None}).to_dict(orient="records")

@app.post("/api/clientes/{dni}/equipos")
def add_equipo(dni: str, equipo: Equipo):
    df_e = read_csv(EQUIPOS_CSV)
    
    equipo.Dni_Cliente = dni
    equipo.Id_Equipo = str(uuid.uuid4())[:8]
    equipo.Fecha_Estado = datetime.now().isoformat()
    
    new_row = pd.DataFrame([equipo.model_dump()])
    df_e = pd.concat([df_e, new_row], ignore_index=True)
    save_csv(df_e, EQUIPOS_CSV)
    
    return {"message": "Equipo añadido", "Id_Equipo": equipo.Id_Equipo}

@app.delete("/api/equipos/{id_equipo}")
def delete_equipo(id_equipo: str):
    df_e = read_csv(EQUIPOS_CSV)
    if not df_e.empty and str(id_equipo) in df_e['Id_Equipo'].astype(str).values:
        initial_len = len(df_e)
        df_e = df_e[df_e['Id_Equipo'].astype(str) != str(id_equipo)]
        if len(df_e) < initial_len:
            save_csv(df_e, EQUIPOS_CSV)
            return {"message": "Equipo eliminado"}
    raise HTTPException(status_code=404, detail="Equipo no encontrado")

@app.patch("/api/equipos/{id_equipo}/estado")
def update_equipo_estado(id_equipo: str, update: EquipoUpdate):
    df_e = read_csv(EQUIPOS_CSV)
    
    if df_e.empty or str(id_equipo) not in df_e['Id_Equipo'].astype(str).values:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
        
    idx = df_e[df_e['Id_Equipo'].astype(str) == str(id_equipo)].index[0]
    current_estado = df_e.at[idx, 'Estado']
    new_estado = update.Estado
    
    # Record history if status changes
    if new_estado and new_estado != current_estado:
        df_h = read_csv(HISTORIAL_EQUIPOS_CSV)
        historial = HistorialEquipo(
            Id_History=str(uuid.uuid4())[:8],
            Id_Equipo=id_equipo,
            Estado_Anterior=current_estado,
            Estado_Nuevo=new_estado,
            Fecha_Cambio=datetime.now().isoformat()
        )
        new_h_row = pd.DataFrame([historial.model_dump()])
        df_h = pd.concat([df_h, new_h_row], ignore_index=True)
        save_csv(df_h, HISTORIAL_EQUIPOS_CSV)
        
        # Update timestamp only on status change
        df_e.at[idx, 'Fecha_Estado'] = datetime.now().isoformat()
        df_e.at[idx, 'Estado'] = new_estado

    # Update other fields if present
    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key != 'Estado': # Already handled status
             df_e.at[idx, key] = value
             
    save_csv(df_e, EQUIPOS_CSV)
    return {"message": "Equipo actualizado"}

@app.get("/api/equipos/historial")
def get_historial_equipos(id_equipo: str = None):
    df_h = read_csv(HISTORIAL_EQUIPOS_CSV)
    
    if df_h.empty:
        return []
        
    if id_equipo:
        df_h = df_h[df_h['Id_Equipo'].astype(str) == str(id_equipo)]
        
    # Sort by date desc
    if not df_h.empty and 'Fecha_Cambio' in df_h.columns:
        df_h['Fecha_Cambio'] = pd.to_datetime(df_h['Fecha_Cambio'])
        df_h = df_h.sort_values(by='Fecha_Cambio', ascending=False)
        # Convert back to ISO string for JSON serialization if needed, 
        # but to_dict usually handles timestamps. Let's ensure string format.
        df_h['Fecha_Cambio'] = df_h['Fecha_Cambio'].dt.strftime('%Y-%m-%dT%H:%M:%S')

    return df_h.replace({np.nan: None}).to_dict(orient="records")


# --- NOTAS DASHBOARD ENDPOINTS ---

@app.get("/api/notas_dashboard")
def get_notas_dashboard():
    df_n = read_csv(NOTAS_DASHBOARD_CSV)
    if df_n.empty:
        return []
        
    df_c = read_csv(CLIENTES_CSV)
    
    # Resolving client names for UI convenience
    notas = df_n.replace({np.nan: None}).to_dict(orient="records")
    if not df_c.empty:
        client_names = {str(row['Dni']): row['Nombre'] for row in df_c.to_dict(orient="records")}
        for nota in notas:
            if nota.get('Dni_Cliente'):
                nota['Nombre_Cliente'] = client_names.get(str(nota['Dni_Cliente']), "Desconocido")
                
    # Sort by date desc
    notas.sort(key=lambda x: x.get('Fecha_Creacion') or '', reverse=True)
    return notas

@app.post("/api/notas_dashboard")
def create_nota_dashboard(nota: NotaDashboard):
    df_n = read_csv(NOTAS_DASHBOARD_CSV)
    
    nota.Id_Nota = str(uuid.uuid4())[:8]
    nota.Fecha_Creacion = datetime.now().isoformat()
    
    new_row = pd.DataFrame([nota.model_dump()])
    df_n = pd.concat([df_n, new_row], ignore_index=True)
    save_csv(df_n, NOTAS_DASHBOARD_CSV)
    return {"message": "Nota añadida", "Id_Nota": nota.Id_Nota}

@app.delete("/api/notas_dashboard/{id_nota}")
def delete_nota_dashboard(id_nota: str):
    df_n = read_csv(NOTAS_DASHBOARD_CSV)
    if not df_n.empty and str(id_nota) in df_n['Id_Nota'].astype(str).values:
        initial_len = len(df_n)
        df_n = df_n[df_n['Id_Nota'].astype(str) != str(id_nota)]
        if len(df_n) < initial_len:
            save_csv(df_n, NOTAS_DASHBOARD_CSV)
            return {"message": "Nota eliminada"}
    raise HTTPException(status_code=404, detail="Nota no encontrada")


# --- React App Serving (SPA) ---

# Sirve los activos estáticos (JS, CSS, imágenes)
if os.path.exists("dist"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

    # Cualquier ruta que no coincida con /api/* devuelve el index.html de React
    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        # Evitar capturar accidentalmente rutas de la API que no existen
        if full_path.startswith("api/"):
             raise HTTPException(status_code=404, detail="API route not found")
             
        index_path = os.path.join("dist", "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return JSONResponse(status_code=404, content={"detail": "Frontend build not found"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
