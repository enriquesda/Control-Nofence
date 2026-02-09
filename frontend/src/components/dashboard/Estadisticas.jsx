import React from 'react';
import { Users, CreditCard, FileText, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';

const Estadisticas = ({ stats }) => {
    const cards = [
        { title: 'Total Clientes', value: stats.total_clientes, icon: <Users className="text-blue-500" />, color: 'bg-blue-50' },
        { title: 'Total Facturado', value: `${stats.total_facturado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`, icon: <CreditCard className="text-green-500" />, color: 'bg-green-50' },
        { title: 'Acuerdos Pendientes', value: stats.acuerdos_pendientes, icon: <FileText className="text-orange-500" />, color: 'bg-orange-50' },
        { title: 'Facturas Pendientes', value: stats.facturas_pendientes, icon: <AlertTriangle className="text-red-500" />, color: 'bg-red-50' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, i) => (
                <Card key={i} className="flex items-center space-x-4" padding="p-4">
                    <div className={`p-4 rounded-xl ${card.color}`}>
                        {card.icon}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">{card.title}</p>
                        <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default Estadisticas;
