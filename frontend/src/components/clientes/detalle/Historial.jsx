import React from 'react';
import { Clock } from 'lucide-react';
import Card from '../../ui/Card';

const Historial = ({ client }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return dateStr;
        const parts = dateStr.split('-');
        return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
    };

    const events = [];

    if (client.Fecha_Aprobacion_Bono) events.push({ date: client.Fecha_Aprobacion_Bono, title: 'Bono Kit Digital Aprobado', type: 'kit' });

    client.acuerdos?.forEach(a => {
        if (a.Fecha_Envio) events.push({ date: a.Fecha_Envio, title: `Acuerdo ${a.Numero_Acuerdo || ''} Enviado`, type: 'acuerdo_envio' });
        if (a.Fecha_Firma) events.push({ date: a.Fecha_Firma, title: `Acuerdo ${a.Numero_Acuerdo || ''} Firmado`, type: 'acuerdo_firma' });
        if (a.Fecha_Aprobacion) events.push({ date: a.Fecha_Aprobacion, title: `Acuerdo ${a.Numero_Acuerdo || ''} Aprobado`, type: 'acuerdo_aprob' });

        a.facturas?.forEach(f => {
            if (f.Fecha_Emision) events.push({ date: f.Fecha_Emision, title: `Factura ${f.Numero_Factura_Real} Emitida`, type: 'factura_emision', amount: f.Importe });
            if (f.Fecha_Pago) events.push({ date: f.Fecha_Pago, title: `Factura ${f.Numero_Factura_Real} Pagada`, type: 'factura_pago' });
        });
    });

    // Sort descending
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <Card>
            <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
                <Clock size={20} className="text-primary-500" />
                <span>Historial del Cliente</span>
            </h3>

            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-4">
                {events.length === 0 ? (
                    <div className="ml-6 text-slate-400 italic">No hay registros en el historial.</div>
                ) : (
                    events.map((ev, idx) => (
                        <div key={idx} className="relative ml-6">
                            <div className={`absolute -left-[31px] bg-white border-2 w-4 h-4 rounded-full ${ev.type.includes('pago') ? 'border-green-500 bg-green-500' :
                                    ev.type.includes('factura') ? 'border-purple-500' :
                                        ev.type.includes('firma') ? 'border-blue-500 bg-blue-500' :
                                            'border-slate-400'
                                }`}></div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 block mb-1">{formatDate(ev.date)}</span>
                                    <h4 className="text-sm font-bold text-slate-800">{ev.title}</h4>
                                </div>
                                {ev.amount && (
                                    <div className="text-sm font-bold text-slate-900 mt-2 sm:mt-0">{ev.amount.toLocaleString()} €</div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Estado Actual Calculado</h4>
                <div className="bg-primary-50 text-primary-800 p-4 rounded-xl text-center font-bold text-lg border border-primary-100">
                    {client.Estado}
                </div>
            </div>
        </Card>
    );
};

export default Historial;
