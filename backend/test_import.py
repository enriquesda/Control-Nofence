import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

import import_clients

def test_import():
    with open('/Users/ventumidc/Documents/trabajo/Control Nofence/plantillaPasar.csv', 'rb') as f:
        content = f.read()
        
    print("Testing Preview...")
    result = import_clients.preview_import(content)
    
    print(f"Total Clients Found: {result['total']}")
    print("First 3 clients preview:")
    for client in result['summary'][:3]:
        print(client)
        
    print("\nCheck Specific Client 'Garai Michelena Ochotorena'...")
    # Find in raw data
    raw = result['raw_data']
    # iterate to find name
    found = False
    for dni, data in raw.items():
        if 'Garai' in data['Nombre']:
            print(f"Found: {data['Nombre']} (DNI: {dni})")
            print(f"Kit: {data['kit']}")
            print(f"Agreements: {len(data['acuerdos'])}")
            for a in data['acuerdos']:
                print(f"  - Acuerdo: {a['Numero_Acuerdo']}, Tipo: {a['Tipo']}, Factura: {a['factura']['Numero_Factura_Real'] if a['factura'] else 'None'}")
            found = True
            break
            
    if not found:
        print("Client 'Garai' not found!")

if __name__ == "__main__":
    test_import()
