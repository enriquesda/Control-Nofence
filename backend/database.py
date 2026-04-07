import pandas as pd
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CLIENTES_CSV = os.path.join(DATA_DIR, "clientes.csv")
KIT_DIGITAL_CSV = os.path.join(DATA_DIR, "kit_digital.csv")
ACUERDOS_CSV = os.path.join(DATA_DIR, "acuerdos.csv")
FACTURAS_CSV = os.path.join(DATA_DIR, "facturas.csv")
EQUIPOS_CSV = os.path.join(DATA_DIR, "equipos.csv")
HISTORIAL_EQUIPOS_CSV = os.path.join(DATA_DIR, "historial_equipos.csv")
NOTAS_DASHBOARD_CSV = os.path.join(DATA_DIR, "notas_dashboard.csv")

def read_csv(path):
    if not os.path.exists(path):
        return pd.DataFrame()
    return pd.read_csv(path)

def save_csv(df, path):
    df.to_csv(path, index=False)

def init_db():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    
    headers = {
        CLIENTES_CSV: ["Dni", "Nombre", "Telefono", "Email", "Calle", "Localidad", "Provincia", "Codigo_Postal", "Numero_Explotacion", "Tipo", "Estado", "Estado_Nofence", "Importe_Nofence", "Referencia_Pago_Nofence", "Collares", "Pedido_Nofence", "Importe_Factura_Nofence", "Importe_Cobrado_Cliente", "Beneficio", "Coordenadas_X", "Coordenadas_Y", "Notas"],
        KIT_DIGITAL_CSV: ["Dni", "Numero_Bono", "Importe_Bono", "Fecha_Aprobacion_Bono"],
        ACUERDOS_CSV: ["Id_Acuerdo", "Dni_Cliente", "Numero_Acuerdo", "Tipo", "Importe", "Fecha_Aprobacion", "Estado", "Enviado", "Fecha_Envio", "Firmado", "Fecha_Firma", "Estado_Justificacion"],
        FACTURAS_CSV: ["Id_Factura", "Dni_Cliente", "Id_Acuerdo", "Numero_Factura_Real", "Concepto", "Importe", "Fecha_Emision", "Estado_Pago", "Fecha_Pago"],
        EQUIPOS_CSV: ["Id_Equipo", "Dni_Cliente", "Nombre", "Categoria", "Estado", "Notas", "Precio", "Fecha_Estado"],
        HISTORIAL_EQUIPOS_CSV: ["Id_History", "Id_Equipo", "Estado_Anterior", "Estado_Nuevo", "Fecha_Cambio"],
        NOTAS_DASHBOARD_CSV: ["Id_Nota", "Creador", "Destinatario", "Dni_Cliente", "Texto", "Fecha_Creacion"]
    }
    
    for path, columns in headers.items():
        if not os.path.exists(path) or os.path.getsize(path) == 0:
            pd.DataFrame(columns=columns).to_csv(path, index=False)
