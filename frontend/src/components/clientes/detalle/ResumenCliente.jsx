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
            <div className="space-y-6">
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

                {/* Tarjeta de Resumen de Equipos */}
                <EquipoResumenCard dni={client.Dni} />
            </div>
        </div>
    );
};

import { getEquipos, updateEquipoStatus } from '../../../api';

/**
 * Componente interno para mostrar y modificar equipos rápidamente desde el resumen.
 */
const EquipoResumenCard = ({ dni }) => {
    const [equipos, setEquipos] = React.useState([]);

    React.useEffect(() => {
        if (dni) fetchEquipos();
    }, [dni]);

    const fetchEquipos = async () => {
        try {
            const res = await getEquipos({ dni_cliente: dni });
            setEquipos(res.data);
        } catch (error) {
            console.error("Error fetching equipos summary", error);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateEquipoStatus(id, { Estado: newStatus });
            fetchEquipos(); // Refresh to see changes (though local state update would be faster)
        } catch (error) {
            console.error("Error updating status", error);
            alert("Error al actualizar estado");
        }
    };

    if (equipos.length === 0) return null;

    return (
        <Card>
            <h3 className="text-lg font-bold mb-4 flex items-center space-x-2 border-b pb-2">
                <div className="w-5 h-5 bg-primary-100 text-primary-600 rounded flex items-center justify-center font-bold text-xs">E</div>
                <span>Equipos ({equipos.length})</span>
            </h3>
            <div className="space-y-3">
                {equipos.map(eq => (
                    <div key={eq.Id_Equipo} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                        <div className="flex flex-col">
                            <span className="font-medium text-sm text-slate-700">{eq.Nombre}</span>
                            <span className="text-xs text-slate-500">{eq.Categoria}</span>
                        </div>
                        <select
                            className="text-xs p-1 rounded border-slate-300 bg-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            value={eq.Estado}
                            onChange={(e) => handleStatusChange(eq.Id_Equipo, e.target.value)}
                        >
                            {['espera', 'pedido', 'pagado', 'en oficina', 'enviado', 'revicido'].map(st => (
                                <option key={st} value={st}>{st}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        </Card>
    );
};


export default ResumenCliente;
