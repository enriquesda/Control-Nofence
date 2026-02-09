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
