import React from 'react';
import { MapPin, Info, Save } from 'lucide-react';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

const ResumenCliente = ({ client, setClient, onSave }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="space-y-6">
                <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center space-x-2 border-b pb-2">
                        <Info size={20} className="text-primary-500" />
                        <span>Información de Contacto</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <Input
                            label="Nombre Completo"
                            value={client.Nombre}
                            onChange={e => setClient({ ...client, Nombre: e.target.value })}
                        />
                        <Input
                            label="Teléfono"
                            value={client.Telefono}
                            onChange={e => setClient({ ...client, Telefono: e.target.value })}
                        />
                        <Input
                            label="Email"
                            value={client.Email}
                            onChange={e => setClient({ ...client, Email: e.target.value })}
                            type="email"
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center space-x-2 border-b pb-2">
                        <MapPin size={20} className="text-primary-500" />
                        <span>Dirección Fiscal</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Input
                                label="Calle / Dirección"
                                value={client.Calle || ''}
                                onChange={e => setClient({ ...client, Calle: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Localidad"
                            value={client.Localidad || ''}
                            onChange={e => setClient({ ...client, Localidad: e.target.value })}
                        />
                        <Input
                            label="CP"
                            value={client.Codigo_Postal || ''}
                            onChange={e => setClient({ ...client, Codigo_Postal: e.target.value })}
                        />
                        <div className="col-span-2">
                            <Input
                                label="Provincia"
                                value={client.Provincia || ''}
                                onChange={e => setClient({ ...client, Provincia: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <Input
                                label="Nº Explotación"
                                value={client.Numero_Explotacion || ''}
                                onChange={e => setClient({ ...client, Numero_Explotacion: e.target.value })}
                                onBlur={onSave} // Auto-save on blur
                                placeholder="ES..."
                            />
                        </div>
                    </div>
                </div>

                <Button onClick={onSave} className="w-full">
                    <Save size={18} />
                    <span>Guardar Cambios General</span>
                </Button>
            </Card>

            {/* Resumen de Estado */}
            <Card className="space-y-6">
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2 border-b pb-2">
                    <Info size={20} className="text-primary-500" />
                    <span>Resumen de Estado</span>
                </h3>

                <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Estado Actual</div>
                    <div className="text-2xl font-bold text-primary-700">{client.Estado}</div>
                </div>

                {/* Simplified Nofence Status for Overview */}
                {client.Estado_Nofence && (
                    <div className={`p-4 rounded-lg border-2 ${client.Estado_Nofence === 'Avisar a Nofence' ? 'bg-orange-50 border-orange-200' :
                        client.Estado_Nofence === 'Pago pendiente' ? 'bg-blue-50 border-blue-200' :
                            client.Estado_Nofence === 'Pago realizado' ? 'bg-green-50 border-green-200' :
                                'bg-purple-50 border-purple-200'
                        }`}>
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Estado Nofence</div>
                        <div className={`text-lg font-bold ${client.Estado_Nofence === 'Avisar a Nofence' ? 'text-orange-700' :
                            client.Estado_Nofence === 'Pago pendiente' ? 'text-blue-700' :
                                client.Estado_Nofence === 'Pago realizado' ? 'text-green-700' :
                                    'text-purple-700'
                            }`}>
                            {client.Estado_Nofence}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ResumenCliente;
