import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import Card from '../ui/Card';

const Alertas = ({
    kitsCaducan,
    acuerdosVencen,
    justificacionesVencen
}) => {
    const navigate = useNavigate();

    const getUrgencyColor = (days) => {
        if (days === null) return 'bg-slate-50 border-slate-200 text-slate-700';
        if (days < 0) return 'bg-red-50 border-red-200 text-red-800';
        if (days < 7) return 'bg-orange-50 border-orange-200 text-orange-800';
        if (days < 15) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
        return 'bg-blue-50 border-blue-200 text-blue-800';
    };

    const AlertaList = ({ title, items, emptyMessage }) => (
        <Card padding="p-0" className="overflow-hidden h-full">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">{title}</h3>
                <span className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-full">{items.length}</span>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                    <div className="text-sm text-slate-400 italic text-center py-8">{emptyMessage}</div>
                ) : (
                    items.map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate(`/clientes/${item.client.Dni}`)}
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${getUrgencyColor(item.days)}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="font-bold text-sm truncate pr-2">{item.client.Nombre}</div>
                                <div className="text-[10px] font-bold whitespace-nowrap bg-white/50 px-1.5 py-0.5 rounded">
                                    {item.days === 0 ? 'HOY' : `${item.days} días`}
                                </div>
                            </div>
                            <div className="text-xs mt-1 opacity-80">Vence: {item.expiryDate}</div>
                            {item.acuerdo && <div className="text-[10px] mt-0.5 opacity-70">Acuerdo: {item.acuerdo.Numero_Acuerdo}</div>}
                        </div>
                    ))
                )}
            </div>
        </Card>
    );

    return (
        <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <Clock className="mr-2 text-yellow-600" size={24} />
                Próximos Vencimientos
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AlertaList
                    title="Kits - Caducidad Bono"
                    items={kitsCaducan}
                    emptyMessage="Sin caducidades próximas"
                />
                <AlertaList
                    title="Acuerdos - Fin Vigencia"
                    items={acuerdosVencen}
                    emptyMessage="Sin vencimientos próximos"
                />
                <AlertaList
                    title="Justificaciones - Límite"
                    items={justificacionesVencen}
                    emptyMessage="Sin límites próximos"
                />
            </div>
        </div>
    );
};

export default Alertas;
