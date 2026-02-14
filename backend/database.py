import pandas as pd
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CLIENTES_CSV = os.path.join(DATA_DIR, "clientes.csv")
KIT_DIGITAL_CSV = os.path.join(DATA_DIR, "kit_digital.csv")
ACUERDOS_CSV = os.path.join(DATA_DIR, "acuerdos.csv")
FACTURAS_CSV = os.path.join(DATA_DIR, "facturas.csv")
EQUIPOS_CSV = os.path.join(DATA_DIR, "equipos.csv")
HISTORIAL_EQUIPOS_CSV = os.path.join(DATA_DIR, "historial_equipos.csv")

def read_csv(path):
    if not os.path.exists(path):
        return pd.DataFrame()
    df = pd.read_csv(path)
    # No rellenamos con "" globalmente para no romper tipos numéricos
    return df

def save_csv(df, path):
    df.to_csv(path, index=False)
