import pandas as pd
import json
import os
import datetime

# Setup paths (adjust if running from different directory)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
OUTPUT_FILE = os.path.join(DATA_DIR, 'clientes_filtrados.csv')

# File paths
CLIENTES_CSV = os.path.join(DATA_DIR, 'clientes.csv')
ACUERDOS_CSV = os.path.join(DATA_DIR, 'acuerdos.csv')
FACTURAS_CSV = os.path.join(DATA_DIR, 'facturas.csv')

def format_coordinate(coord):
    """Formats coordinate to use comma as decimal separator."""
    if pd.isna(coord):
        return ""
    return str(coord).replace('.', ',')

def main():
    print("Starting client CSV generation...")

    # Load data
    try:
        df_clientes = pd.read_csv(CLIENTES_CSV)
        df_acuerdos = pd.read_csv(ACUERDOS_CSV)
        df_facturas = pd.read_csv(FACTURAS_CSV)
    except FileNotFoundError as e:
        print(f"Error loading CSVs: {e}")
        return

    # 1. Filter Agreements
    # Requirements: Agreement launched (Enviado/Firmado) AND Justification Pending (Pendiente de captura)
    # Note: 'Estado' could be 'Firmado' or 'Enviado' based on user description "acuerdos lanzados"
    # and 'Estado_Justificacion' must be 'Pendiente de captura' (or similar, checking data)
    
    # Based on previous file reads:
    # Estado: Firmado, Borrador, Enviado
    # Estado_Justificacion: Justificada, Pendiente de captura (assuming based on user requirements)
    
    # Let's align with user request:
    # 1. Acuerdos lanzados (We'll take 'Firmado' and 'Enviado')
    # 3. Estado justificacion pendiente (We'll look for 'Pendiente' or similar if exact string matches, 
    #    otherwise we can adjust. User said "Estado justificacion pendiente".)
    
    # Ensure Estado_Justificacion is treated as string to avoid ".str accessor" error on non-string columns
    df_acuerdos['Estado_Justificacion'] = df_acuerdos['Estado_Justificacion'].fillna('').astype(str)

    # Filter Logic Update:
    # 1. Agreement Launched: Either 'Estado' is Enviado/Firmado OR boolean flags Enviado/Firmado are True
    # 2. Justification Pending: 'Estado_Justificacion' contains 'Pendiente' OR is empty/null (treating empty as pending based on user feedback)
    
    mask_launched = (
        (df_acuerdos['Estado'].isin(['Enviado', 'Firmado'])) | 
        (df_acuerdos['Enviado'] == True) | 
        (df_acuerdos['Firmado'] == True)
    )
    
    mask_pending = (
        (df_acuerdos['Estado_Justificacion'].str.contains('Pendiente', case=False)) |
        (df_acuerdos['Estado_Justificacion'] == '') |
        (df_acuerdos['Estado_Justificacion'] == 'nan')
    )

    target_acuerdos = df_acuerdos[mask_launched & mask_pending].copy()
    
    if target_acuerdos.empty:
        print("No agreements found matching criteria.")
        return

    # 2. Filter Invoices
    # Requirements: Facturas lanzadas y pagadas
    target_facturas = df_facturas[
        df_facturas['Estado_Pago'] == 'Pagado'
    ].copy()

    # Join Agreements and Invoices on Id_Acuerdo
    # We need agreements that have a PAID invoice.
    acuerdos_facturados = pd.merge(
        target_acuerdos,
        target_facturas,
        on='Id_Acuerdo',
        how='inner',
        suffixes=('_acuerdo', '_factura')
    )

    if acuerdos_facturados.empty:
        print("No paid invoices found for selected agreements.")
        return

    # 3. Join with Clients
    # We need client details. Join on Dni_Cliente.
    # Note: df_facturas has Dni_Cliente, df_acuerdos has Dni_Cliente. 
    # Use the one from agreement for consistency.
    
    final_data = pd.merge(
        acuerdos_facturados,
        df_clientes,
        left_on='Dni_Cliente_acuerdo',
        right_on='Dni',
        how='inner'
    )

    # 4. Filter Nofence Data
    # Requirements: Ambas coordenadas y collares
    # Coordenadas_X, Coordenadas_Y not null/empty
    # Collares not null/empty
    
    final_data = final_data[
        (final_data['Coordenadas_X'].notna()) &
        (final_data['Coordenadas_Y'].notna()) &
        (final_data['Collares'].notna()) &
        (final_data['Collares'] != '[]') # Check empty JSON array string just in case
    ]

    if final_data.empty:
        print("No clients found matching Nofence data requirements.")
        return

    # Process per client
    # User says: "only one row per client... sum total of both amounts"
    
    results = []
    
    # Group by Client DNI to handle multiple agreements
    grouped = final_data.groupby('Dni')
    
    for dni, group in grouped:
        client_row = group.iloc[0] # Take base data from first record
        
        # Calculate totals
        total_importe = group['Importe_factura'].sum() # Sum invoice amounts
        
        # Parse collares
        try:
            collares_list = json.loads(client_row['Collares'])
            if not isinstance(collares_list, list):
                collares_list = []
        except:
            collares_list = []
            
        # Format Date
        # User wants "fecha en la que se elaboro la factura". 
        # If multiple, we'll take the first one or latest? User didn't specify for multiple.
        # "siempre los acuerdos se lanzan el mismo dia", so any is fine.
        fecha_factura = client_row['Fecha_Emision']
        try:
            # Convert YYYY-MM-DD to DD-MM-YYYY if needed, or keep as is?
            # User example: 01-12-2025. Standard is often YYYY-MM-DD in DB.
            # Let's try to convert to DD-MM-YYYY matching template.
            date_obj = pd.to_datetime(fecha_factura)
            fecha_fmt = date_obj.strftime('%d-%m-%Y')
        except:
            fecha_fmt = fecha_factura
            
        # Format Pago Date
        fecha_pago = client_row['Fecha_Pago']
        try:
            date_pago_obj = pd.to_datetime(fecha_pago)
            fecha_pago_fmt = date_pago_obj.strftime('%d-%m-%Y')
        except:
            fecha_pago_fmt = fecha_pago

        # Build Row Dict
        row_data = {
            'Nombre completo': client_row['Nombre'],
            'correo': client_row['Email'],
            'x': format_coordinate(client_row['Coordenadas_X']),
            'y': format_coordinate(client_row['Coordenadas_Y']),
            'fecha': fecha_fmt,
            'explotacion': client_row['Numero_Explotacion'],
            'IMPORTE': total_importe,
            'fecha Pago': fecha_pago_fmt
        }
        
        # Add dynamic collars
        # Template has id1, id2...
        for i, collar in enumerate(collares_list):
            row_data[f'id{i+1}'] = collar
            
        results.append(row_data)

    # Convert to DataFrame
    df_result = pd.DataFrame(results)
    
    # Reorder columns to match template roughly, handling dynamic collar columns
    # Template: Nombre completo,correo,id1,id2...,x,y,fecha,explotacion,IMPORTE,fecha Pago
    
    base_cols_start = ['Nombre completo', 'correo']
    base_cols_end = ['x', 'y', 'fecha', 'explotacion', 'IMPORTE', 'fecha Pago']
    
    # identify collar columns
    collar_cols = [c for c in df_result.columns if c.startswith('id')]
    # sort collar cols id1, id2, id10... alphanumeric sort might fail 1, 10, 2. 
    # But usually fine for small counts. Let's do a lambda sort to be safe.
    collar_cols.sort(key=lambda x: int(x[2:]))
    
    final_cols = base_cols_start + collar_cols + base_cols_end
    
    # Ensure all columns exist (some might be missing if no data for them, but we built dicts)
    # Actually if a client has id5 and another only id1, the row for the second will match.
    # Pandas DataFrame(results) handles missing keys as NaN.
    
    df_result = df_result.reindex(columns=final_cols)
    
    # Save
    df_result.to_csv(OUTPUT_FILE, index=False)
    print(f"Generated CSV at: {OUTPUT_FILE}")
    print(df_result.head())
    
    return {
        "status": "success",
        "message": f"Archivo generado con {len(df_result)} clientes.",
        "count": len(df_result),
        "file": OUTPUT_FILE
    }

if __name__ == "__main__":
    main()
