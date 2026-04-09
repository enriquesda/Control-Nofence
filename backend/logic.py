import pandas as pd
from datetime import datetime, timedelta
from database import read_csv, save_csv, CLIENTES_CSV, KIT_DIGITAL_CSV, ACUERDOS_CSV, FACTURAS_CSV

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
        kit_row = df_k_safe[df_k_safe['Dni'].astype(str) == dni] if 'Dni' in df_k_safe.columns else pd.DataFrame()
        acuerdos_cliente = df_a_safe[df_a_safe['Dni_Cliente'].astype(str) == dni] if 'Dni_Cliente' in df_a_safe.columns else pd.DataFrame()
        facturas_cliente = df_f_safe[df_f_safe['Dni_Cliente'].astype(str) == dni] if 'Dni_Cliente' in df_f_safe.columns else pd.DataFrame()
        
        # --- LOGICA DE ESTADOS ---
        nuevo_estado = "Kit pedido"
        
        # 1. Kit Aprobado
        if not kit_row.empty:
            k = kit_row.iloc[0]
            if str(k.get('Numero_Bono')).strip() != "":
                nuevo_estado = "Kit aprobado"
                
        # 2. Acuerdos
        if not acuerdos_cliente.empty:
            enviados = acuerdos_cliente[acuerdos_cliente['Enviado'] == True]
            if not enviados.empty:
                nuevo_estado = "Acuerdos enviados"
            
            firmados = acuerdos_cliente[acuerdos_cliente['Firmado'] == True]
            if not firmados.empty:
                nuevo_estado = "Acuerdos firmados"
                
            # Acuerdos Aprobados (tienen numero y fecha)
            aprobados = acuerdos_cliente[
                (acuerdos_cliente['Numero_Acuerdo'].astype(str).str.strip() != "") & 
                (acuerdos_cliente['Fecha_Aprobacion'].astype(str).str.strip() != "")
            ]
            
            if not aprobados.empty:
                # Si llegamos aquí, los acuerdos están aprobados. 
                # Ahora la prioridad depende de las Facturas.
                if facturas_cliente.empty:
                    nuevo_estado = "Facturas no generadas"
                else:
                    # Hay facturas. ¿Están pagadas?
                    pagadas = facturas_cliente[facturas_cliente['Estado_Pago'] == 'Pagado']
                    
                    if pagadas.empty:
                        nuevo_estado = "Facturas no pagadas"
                    else:
                        if 'Estado_Justificacion' in acuerdos_cliente.columns:
                            estados_justif = acuerdos_cliente['Estado_Justificacion'].unique().tolist()
                            
                            if 'Pendiente de captura' in estados_justif:
                                nuevo_estado = "Pendiente de justificar"
                            elif 'Enviada para firma' in estados_justif:
                                nuevo_estado = "Justificación pendiente de firma"
                            elif '2º Justificacion' in estados_justif:
                                nuevo_estado = "2º Justificacion completada"
                            elif 'Justificada' in estados_justif:
                                nuevo_estado = "Justificado"
                                
                                # Check if 1 year has passed since 1st Justification
                                if 'Fecha_Justificacion' in acuerdos_cliente.columns:
                                    justif_df = acuerdos_cliente[acuerdos_cliente['Estado_Justificacion'] == 'Justificada']
                                    for _, j_row in justif_df.iterrows():
                                        fecha_j = j_row.get('Fecha_Justificacion')
                                        if pd.notna(fecha_j) and str(fecha_j).strip() != "":
                                            try:
                                                dt_justif = datetime.strptime(str(fecha_j), "%Y-%m-%d")
                                                if datetime.now() > dt_justif + timedelta(days=365):
                                                    nuevo_estado = "Pendiente 2º justificacion"
                                                    break # If at least one requires it, overall status changes
                                            except:
                                                pass
                            else:
                                nuevo_estado = "Facturas pagadas"
                        else:
                            nuevo_estado = "Facturas pagadas"

        df_c.at[index, 'Estado'] = nuevo_estado

    save_csv(df_c, CLIENTES_CSV)
