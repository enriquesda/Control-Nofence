import pandas as pd
import io
import uuid
import math
import os
from datetime import datetime, timedelta

# Import database functions
# Assuming this script is run from backend/ or imported by main.py which is in backend/
try:
    from database import read_csv, save_csv, CLIENTES_CSV, KIT_DIGITAL_CSV, ACUERDOS_CSV, FACTURAS_CSV
except ImportError:
    # Fallback if running standalone for testing (adjust paths as needed)
    pass

def parse_currency(value):
    if pd.isna(value) or value == '':
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    # Remove euro symbol, dots, replace comma with dot
    clean = str(value).replace('€', '').replace('.', '').replace(',', '.').strip()
    try:
        return float(clean)
    except:
        return 0.0

def parse_date(value):
    if pd.isna(value) or value == '' or str(value).lower() == 'nan':
        return None
    # Formats seen: D/M/Y, D-M-Y
    for fmt in ["%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d-%m-%Y"]:
        try:
            return datetime.strptime(str(value).strip(), fmt).strftime("%Y-%m-%d")
        except:
            continue
    return None

def calculate_approval_date(limit_date_str):
    if not limit_date_str:
        return None
    try:
        dt = datetime.strptime(limit_date_str, "%Y-%m-%d")
        # Subtract 6 months
        # Approximation: 180 days
        approval = dt - timedelta(days=180)
        return approval.strftime("%Y-%m-%d")
    except:
        return None

def parse_import_csv(content_bytes):
    """
    Parses the CSV content and returns a dictionary of clients to import.
    """
    try:
        # Read CSV
        df = pd.read_csv(io.BytesIO(content_bytes))
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return {}

    # Normalize columns
    df.columns = [str(c).strip() for c in df.columns]
    
    # Required columns check
    # NIF, nombre completo
    if 'NIF' not in df.columns:
        return {}

    clients_map = {}
    current_nif = None
    current_name = None
    
    for index, row in df.iterrows():
        raw_nif = row.get('NIF')
        
        # Determine if this row starts a new client or continues previous
        if pd.notna(raw_nif) and str(raw_nif).strip() != '' and str(raw_nif).lower() != 'nan':
             current_nif = str(raw_nif).strip()
             current_name = row.get('nombre completo', '')
        elif current_nif is None:
             # Skip rows before first valid NIF
             continue
        
        if current_nif not in clients_map:
            clients_map[current_nif] = {
                "Dni": current_nif,
                "Nombre": current_name if pd.notna(current_name) else "",
                "kit": None,
                "acuerdos": []
            }
            
        client = clients_map[current_nif]
        
        # Parse Kit Digital (Only if present in this row)
        # "Si viene la columna nº expediente , limite y bono"
        expediente = row.get('Nº EXPEDIENTE')
        limite = row.get('LIMITE ACUERDOS')
        bono = row.get('BONO')
        
        if pd.notna(expediente) and str(expediente).strip() != '' and pd.notna(limite):
            limit_date = parse_date(limite)
            approval_date = calculate_approval_date(limit_date)
            # Only set if not already set or this row has info (assume first row has it usually)
            if client["kit"] is None:
                client["kit"] = {
                    "Numero_Bono": str(expediente),
                    "Importe_Bono": parse_currency(bono),
                    "Fecha_Aprobacion_Bono": approval_date,
                    # "Fecha_Limite_Acuerdos": limit_date 
                }
            
        # Parse Agreement (Acuerdo)
        # "Si tambien tiene fecha , numero, modalidad e importe"
        fecha_acuerdo = parse_date(row.get('FECHA'))
        numero_acuerdo = row.get('NUMERO')
        modalidad = row.get('MODALIDAD')
        importe_acuerdo = row.get('IMPORTE')
        
        if pd.notna(numero_acuerdo) and str(numero_acuerdo).strip() != '':
            acuerdo = {
                "Numero_Acuerdo": str(numero_acuerdo),
                "Tipo": modalidad if pd.notna(modalidad) else "GA", 
                "Importe": parse_currency(importe_acuerdo),
                "Fecha_Aprobacion": fecha_acuerdo,
                "Enviado": True,
                "Firmado": True,
                "Fecha_Envio": fecha_acuerdo, 
                "Fecha_Firma": fecha_acuerdo, 
                "Estado": "Borrador", 
                "Estado_Justificacion": "Pendiente de captura",
                "factura": None
            }
            
            # Invoice Logic
            fecha_factura = parse_date(row.get('FECHA FACTURA'))
            if fecha_factura:
                num_acuerdo_str = str(numero_acuerdo)
                # Last 4 digits
                num_factura = num_acuerdo_str[-4:] if len(num_acuerdo_str) >= 4 else num_acuerdo_str
                
                factura = {
                    "Numero_Factura_Real": num_factura,
                    "Fecha_Emision": fecha_factura,
                    "Importe": parse_currency(importe_acuerdo), 
                    "Estado_Pago": "Pendiente",
                    "Fecha_Pago": None
                }
                
                # Payment Logic
                fecha_pago = parse_date(row.get('FECHA PAGO IVA'))
                if fecha_pago:
                    factura["Estado_Pago"] = "Pagado"
                    factura["Fecha_Pago"] = fecha_pago
                    
                acuerdo["factura"] = factura
                
            # Justification Logic
            limite_just = parse_date(row.get('LIMITE JUST 1'))
            if limite_just:
                acuerdo["Estado_Justificacion"] = "Justificada"
                
            client["acuerdos"].append(acuerdo)

    return clients_map

def preview_import(content_bytes):
    clients_map = parse_import_csv(content_bytes)
    
    # Load existing data to check for updates vs new
    df_existing_clients = read_csv(CLIENTES_CSV)
    existing_dnis = set(df_existing_clients['Dni'].astype(str).values) if not df_existing_clients.empty else set()
    
    preview_results = []
    
    for dni, data in clients_map.items():
        status = "Update" if dni in existing_dnis else "New"
        preview_results.append({
            "dni": dni,
            "nombre": data["Nombre"],
            "status": status,
            "acuerdos_count": len(data["acuerdos"]),
            "has_kit": data["kit"] is not None
        })
        
    return {
        "summary": preview_results, 
        "total": len(preview_results),
        "raw_data": clients_map # Pass this back to frontend to send for confirmation? Or handle differently.
        # Ideally we store temp or ask frontend to send back. 
        # For simplicity, we can return it and frontend sends it back to execute.
    }

def execute_import(clients_data):
    """
    clients_data: list of client objects (values of clients_map)
    """
    df_clientes = read_csv(CLIENTES_CSV)
    df_kit = read_csv(KIT_DIGITAL_CSV)
    df_acuerdos = read_csv(ACUERDOS_CSV)
    df_facturas = read_csv(FACTURAS_CSV)
    
    imported_count = 0
    
    for client in clients_data:
        dni = client['Dni']
        
        # 1. Update/Create Client
        if not df_clientes.empty and dni in df_clientes['Dni'].astype(str).values:
            # Update existing? User didn't specify overwrite logic, but usually we prefer existing data or overwrite?
            # User said "carga de clientes", implies creating/updating.
            # Let's update Name if missing in DB, otherwise keep DB? 
            # Or overwrite with CSV? "Carga" usually implies overwrite/upsert.
            idx = df_clientes[df_clientes['Dni'].astype(str) == dni].index[0]
            if pd.isna(df_clientes.at[idx, 'Nombre']) or df_clientes.at[idx, 'Nombre'] == '':
                 df_clientes.at[idx, 'Nombre'] = client['Nombre']
        else:
            # Create
            new_client = {
                "Dni": dni, 
                "Nombre": client['Nombre'],
                "Email": "", "Telefono": "", "Direccion": "", "Poblacion": "", "Provincia": "",
                "Estado": "Activo",
                "Fecha_Agente_Digitalizador": datetime.now().strftime("%Y-%m-%d")
            }
            df_clientes = pd.concat([df_clientes, pd.DataFrame([new_client])], ignore_index=True)
            
        # 2. Kit Digital
        if client['kit']:
            kit = client['kit']
            kit['Dni'] = dni
            # Remove existing kit for this user to overwrite?
            if not df_kit.empty:
                df_kit = df_kit[df_kit['Dni'].astype(str) != dni]
            
            df_kit = pd.concat([df_kit, pd.DataFrame([kit])], ignore_index=True)
            
        # 3. Acuerdos & Facturas
        # We should check if agreements exist by Number? Or just append?
        # Safe bet: check by Numero_Acuerdo if exists for this client.
        
        for acuerdo in client['acuerdos']:
            num_acuerdo = acuerdo['Numero_Acuerdo']
            
            # Check if exists
            exists = False
            if not df_acuerdos.empty:
                 # Check Dni and Numero_Acuerdo
                 mask = (df_acuerdos['Dni_Cliente'].astype(str) == dni) & (df_acuerdos['Numero_Acuerdo'].astype(str) == num_acuerdo)
                 if mask.any():
                     exists = True
                     # Update existing agreement?
                     idx_a = df_acuerdos[mask].index[0]
                     # Update fields
                     for col in ['Tipo', 'Importe', 'Fecha_Aprobacion', 'Enviado', 'Firmado', 'Fecha_Envio', 'Fecha_Firma', 'Estado_Justificacion']:
                         if col in acuerdo:
                             df_acuerdos.at[idx_a, col] = acuerdo[col]
                     current_id_acuerdo = df_acuerdos.at[idx_a, 'Id_Acuerdo']
                 else:
                     # Create new
                     current_id_acuerdo = str(uuid.uuid4())[:8]
                     acuerdo_row = acuerdo.copy()
                     acuerdo_row['Dni_Cliente'] = dni
                     acuerdo_row['Id_Acuerdo'] = current_id_acuerdo
                     if 'factura' in acuerdo_row: del acuerdo_row['factura']
                     
                     df_acuerdos = pd.concat([df_acuerdos, pd.DataFrame([acuerdo_row])], ignore_index=True)
            else:
                 # Create new
                 current_id_acuerdo = str(uuid.uuid4())[:8]
                 acuerdo_row = acuerdo.copy()
                 acuerdo_row['Dni_Cliente'] = dni
                 acuerdo_row['Id_Acuerdo'] = current_id_acuerdo
                 if 'factura' in acuerdo_row: del acuerdo_row['factura']
                 
                 df_acuerdos = pd.concat([df_acuerdos, pd.DataFrame([acuerdo_row])], ignore_index=True)
            
            # Invoice
            if acuerdo['factura']:
                fact = acuerdo['factura']
                # Check if invoice exists for this agreement
                fact_exists = False
                if not df_facturas.empty:
                    mask_f = (df_facturas['Id_Acuerdo'].astype(str) == current_id_acuerdo)
                    if mask_f.any():
                        # Update
                        idx_f = df_facturas[mask_f].index[0]
                        for col in ['Fecha_Emision', 'Estado_Pago', 'Fecha_Pago', 'Numero_Factura_Real']:
                             if col in fact:
                                 df_facturas.at[idx_f, col] = fact[col]
                    else:
                        # Create
                        fact_row = fact.copy()
                        fact_row['Id_Factura'] = str(uuid.uuid4())[:8]
                        fact_row['Dni_Cliente'] = dni
                        fact_row['Id_Acuerdo'] = current_id_acuerdo
                        df_facturas = pd.concat([df_facturas, pd.DataFrame([fact_row])], ignore_index=True)
                else:
                    # Create
                    fact_row = fact.copy()
                    fact_row['Id_Factura'] = str(uuid.uuid4())[:8]
                    fact_row['Dni_Cliente'] = dni
                    fact_row['Id_Acuerdo'] = current_id_acuerdo
                    df_facturas = pd.concat([df_facturas, pd.DataFrame([fact_row])], ignore_index=True)

        imported_count += 1

    # Save all
    save_csv(df_clientes, CLIENTES_CSV)
    save_csv(df_kit, KIT_DIGITAL_CSV)
    save_csv(df_acuerdos, ACUERDOS_CSV)
    save_csv(df_facturas, FACTURAS_CSV)
    
    return {"message": f"Importación completada. {imported_count} clientes procesados."}

