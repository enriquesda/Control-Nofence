import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PenTool, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';

const AccionesPendientes = ({
    acuerdosPendientes,
    facturasPendientes,
    justificacionesPendientes,
    onQuickSign
}) => {
    const navigate = useNavigate();

    const ActionList = ({ title, items, emptyMessage, renderItem }) => (
        <Card padding="p-0" className="overflow-hidden h-full">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">{title}</h3>
                <span className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-full">{items.length}</span>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                    <div className="text-sm text-slate-400 italic text-center py-8">{emptyMessage}</div>
                ) : (
                    items.map((item, idx) => renderItem(item, idx))
                )}
            </div>
        </Card>
    );

    return (
        <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <AlertCircle className="mr-2 text-orange-500" size={24} />
                Acciones Pendientes
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Acuerdos por Firmar */}
                <ActionList
                    title="Acuerdos por Firmar"
                    items={acuerdosPendientes}
                    emptyMessage="Todo firmado"
                    renderItem={(item, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate(`/clientes/${item.client.Dni}`)}
                            className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 cursor-pointer transition-colors flex justify-between items-center group"
                        >
                            <div>
                                <div className="font-bold text-sm text-slate-800">{item.client.Nombre}</div>
                                <div className="text-xs text-slate-600">Acuerdo: {item.acuerdo.Numero_Acuerdo}</div>
                                {item.daysSinceSent !== null && (
                                    <div className="text-[10px] text-orange-600 font-bold mt-1">
                                        Hace {item.daysSinceSent} días
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={(e) => onQuickSign(item.acuerdo.Id_Acuerdo, e)}
                                className="ml-2 p-2 bg-white text-green-600 border border-green-200 hover:bg-green-50 rounded-lg transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                                title="Firmar ahora"
                            >
                                <PenTool size={14} />
                            </button>
                        </div>
                    )}
                />

                {/* Facturas por Cobrar */}
                <ActionList
                    title="Facturas por Cobrar"
                    items={facturasPendientes}
                    emptyMessage="Todo cobrado"
                    renderItem={(item, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate(`/clientes/${item.client.Dni}`)}
                            className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                        >
                            <div className="font-bold text-sm text-slate-800">{item.client.Nombre}</div>
                            <div className="flex justify-between items-center mt-1">
                                <div className="text-xs text-slate-600">Factura {item.factura.Numero_Factura_Real || ''}</div>
                                <div className="font-bold text-slate-800 text-xs">{item.factura.Importe} €</div>
                            </div>
                            {item.daysOverdue !== null && (
                                <div className="text-[10px] text-red-600 font-bold mt-1">
                                    {item.daysOverdue} días pendiente
                                </div>
                            )}
                        </div>
                    )}
                />

                {/* Justificaciones Enviadas */}
                <ActionList
                    title="Justificaciones Enviadas"
                    items={justificacionesPendientes}
                    emptyMessage="Sin justificaciones pendientes"
                    renderItem={(item, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate(`/clientes/${item.client.Dni}`)}
                            className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
                        >
                            <div className="font-bold text-sm text-slate-800">{item.client.Nombre}</div>
                            <div className="text-xs text-slate-600">Acuerdo: {item.acuerdo.Numero_Acuerdo}</div>
                            <div className="text-[10px] text-blue-600 font-medium mt-1">Esperando firma del cliente</div>
                        </div>
                    )}
                />
            </div>
        </div>
    );
};

export default AccionesPendientes;
