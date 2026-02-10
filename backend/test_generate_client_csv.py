import unittest
import pandas as pd
import os
import shutil
import json
from generate_client_csv import main
import generate_client_csv

class TestClientCSVGeneration(unittest.TestCase):
    def setUp(self):
        self.test_dir = 'test_data_temp'
        os.makedirs(self.test_dir, exist_ok=True)
        
        # Override paths in the module
        generate_client_csv.DATA_DIR = self.test_dir
        generate_client_csv.CLIENTES_CSV = os.path.join(self.test_dir, 'clientes.csv')
        generate_client_csv.ACUERDOS_CSV = os.path.join(self.test_dir, 'acuerdos.csv')
        generate_client_csv.FACTURAS_CSV = os.path.join(self.test_dir, 'facturas.csv')
        generate_client_csv.OUTPUT_FILE = os.path.join(self.test_dir, 'clientes_filtrados.csv')

    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_generation_logic(self):
        # 1. Setup Mock Data
        
        # Client 1: VALID match
        # - Agreement: Enviado, Justification: Pendiente de captura
        # - Invoice: Pagado
        # - Nofence: Coords & Collars present
        
        # Client 2: INVALID (Invoice Pending)
        
        # Client 3: INVALID (Justification 'Justificada')
        
        # Client 4: INVALID (Missing Coords)

        clientes_data = [
            {
                "Dni": "11111111A", "Nombre": "Valid Client", "Email": "val@id.com", "Numero_Explotacion": "ES001",
                "Coordenadas_X": 40.123, "Coordenadas_Y": -3.456, "Collares": '["1001", "1002"]'
            },
            {
                "Dni": "22222222B", "Nombre": "Unpaid Invoice", "Email": "un@paid.com", "Numero_Explotacion": "ES002",
                "Coordenadas_X": 40.123, "Coordenadas_Y": -3.456, "Collares": '["2001"]'
            },
            {
                "Dni": "33333333C", "Nombre": "Justified Client", "Email": "just@ified.com", "Numero_Explotacion": "ES003",
                "Coordenadas_X": 40.123, "Coordenadas_Y": -3.456, "Collares": '["3001"]'
            },
            {
                "Dni": "44444444D", "Nombre": "No Coords Client", "Email": "no@coords.com", "Numero_Explotacion": "ES004",
                "Coordenadas_X": None, "Coordenadas_Y": None, "Collares": '["4001"]'
            }
        ]
        
        acuerdos_data = [
            {"Id_Acuerdo": "AC1", "Dni_Cliente": "11111111A", "Estado": "Enviado", "Estado_Justificacion": "Pendiente de captura", "Importe": 1000},
            {"Id_Acuerdo": "AC2", "Dni_Cliente": "22222222B", "Estado": "Enviado", "Estado_Justificacion": "Pendiente de captura", "Importe": 1000},
            {"Id_Acuerdo": "AC3", "Dni_Cliente": "33333333C", "Estado": "Firmado", "Estado_Justificacion": "Justificada", "Importe": 1000},
            {"Id_Acuerdo": "AC4", "Dni_Cliente": "44444444D", "Estado": "Firmado", "Estado_Justificacion": "Pendiente de captura", "Importe": 1000},
        ]
        
        facturas_data = [
            {"Id_Factura": "F1", "Id_Acuerdo": "AC1", "Estado_Pago": "Pagado", "Importe": 1000, "Fecha_Emision": "2025-12-01", "Fecha_Pago": "2025-12-05"},
            {"Id_Factura": "F2", "Id_Acuerdo": "AC2", "Estado_Pago": "Pendiente", "Importe": 1000, "Fecha_Emision": "2025-12-01", "Fecha_Pago": None},
            {"Id_Factura": "F3", "Id_Acuerdo": "AC3", "Estado_Pago": "Pagado", "Importe": 1000, "Fecha_Emision": "2025-12-01", "Fecha_Pago": "2025-12-05"},
            {"Id_Factura": "F4", "Id_Acuerdo": "AC4", "Estado_Pago": "Pagado", "Importe": 1000, "Fecha_Emision": "2025-12-01", "Fecha_Pago": "2025-12-05"},
        ]

        pd.DataFrame(clientes_data).to_csv(generate_client_csv.CLIENTES_CSV, index=False)
        pd.DataFrame(acuerdos_data).to_csv(generate_client_csv.ACUERDOS_CSV, index=False)
        pd.DataFrame(facturas_data).to_csv(generate_client_csv.FACTURAS_CSV, index=False)

        # 2. Run Script
        main()

        # 3. Validation
        self.assertTrue(os.path.exists(generate_client_csv.OUTPUT_FILE))
        
        df_result = pd.read_csv(generate_client_csv.OUTPUT_FILE)
        print("\nResult DataFrame:")
        print(df_result)
        
        self.assertEqual(len(df_result), 1, "Should only have 1 matching client")
        self.assertEqual(df_result.iloc[0]['Nombre completo'], 'Valid Client')
        self.assertEqual(str(df_result.iloc[0]['id1']), '1001') # Check collar expansion
        # Check coordinate format (comma)
        self.assertIn(',', str(df_result.iloc[0]['x']))

if __name__ == '__main__':
    unittest.main()
