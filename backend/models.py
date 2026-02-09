from pydantic import BaseModel
from typing import Optional

class KitDigital(BaseModel):
    Dni: str
    Numero_Bono: Optional[str] = None
    Importe_Bono: Optional[float] = None
    Fecha_Aprobacion_Bono: Optional[str] = None

class Factura(BaseModel):
    Id_Factura: Optional[str] = None
    Dni_Cliente: Optional[str] = None
    Id_Acuerdo: Optional[str] = None
    Numero_Factura_Real: str
    Concepto: str
    Importe: float
    Fecha_Emision: str
    Estado_Pago: str # Pagado/Pendiente
    Fecha_Pago: Optional[str] = None

class FacturaUpdate(BaseModel):
    Numero_Factura_Real: Optional[str] = None
    Concepto: Optional[str] = None
    Importe: Optional[float] = None
    Fecha_Emision: Optional[str] = None
    Estado_Pago: Optional[str] = None
    Fecha_Pago: Optional[str] = None

class Acuerdo(BaseModel):
    Id_Acuerdo: Optional[str] = None
    Dni_Cliente: Optional[str] = None
    Numero_Acuerdo: Optional[str] = ""
    Tipo: str # GA / GC
    Importe: float
    Fecha_Aprobacion: Optional[str] = None
    Estado: Optional[str] = "Borrador" # Borrador, Pendiente de Capturas, Enviado, Firmado
    Enviado: Optional[bool] = False # Legacy/Helper
    Fecha_Envio: Optional[str] = None
    Firmado: Optional[bool] = False # Legacy/Helper
    Fecha_Firma: Optional[str] = None
    Estado_Justificacion: Optional[str] = None # Pendiente de captura, Enviada para firma, Justificada

class AcuerdoUpdate(BaseModel):
    Numero_Acuerdo: Optional[str] = None
    Fecha_Aprobacion: Optional[str] = None
    Estado: Optional[str] = None
    Enviado: Optional[bool] = None
    Fecha_Envio: Optional[str] = None
    Firmado: Optional[bool] = None
    Fecha_Firma: Optional[str] = None
    Estado_Justificacion: Optional[str] = None

class Cliente(BaseModel):
    Dni: str
    Nombre: str
    Telefono: str
    Email: str
    
    # Dirección
    Calle: Optional[str] = None
    Localidad: Optional[str] = None
    Provincia: Optional[str] = None
    Codigo_Postal: Optional[str] = None
    Numero_Explotacion: Optional[str] = None
    
    Estado: Optional[str] = "Kit pedido"
    Estado_Nofence: Optional[str] = None 
    Importe_Nofence: Optional[float] = None  # Payment amount for Nofence
    Collares: Optional[str] = None  # JSON array of collar numbers
    Pedido_Nofence: Optional[str] = None
    Importe_Factura_Nofence: Optional[float] = None
    Importe_Cobrado_Cliente: Optional[float] = None
    Beneficio: Optional[float] = None
    
    # Coordenadas Nofence
    Coordenadas_X: Optional[float] = None
    Coordenadas_Y: Optional[float] = None

class ClienteUpdate(BaseModel):
    Nombre: Optional[str] = None
    Telefono: Optional[str] = None
    Email: Optional[str] = None
    Calle: Optional[str] = None
    Localidad: Optional[str] = None
    Provincia: Optional[str] = None
    Codigo_Postal: Optional[str] = None
    Numero_Explotacion: Optional[str] = None
    Estado_Nofence: Optional[str] = None
    Importe_Nofence: Optional[float] = None
    Coordenadas_X: Optional[float] = None
    Coordenadas_Y: Optional[float] = None
    Collares: Optional[str] = None
    Pedido_Nofence: Optional[str] = None
    Importe_Factura_Nofence: Optional[float] = None
    Importe_Cobrado_Cliente: Optional[float] = None
    Beneficio: Optional[float] = None
