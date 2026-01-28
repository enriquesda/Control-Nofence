import React, { useState, useEffect } from 'react';
import { getDashboard } from '../api';
import { Users, CreditCard, AlertTriangle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({ total_clientes: 0, total_facturado: 0, alertas: 0 });

    useEffect(() => {
        getDashboard().then(res => setStats(res.data));
    }, []);

    const cards = [
        { title: 'Total Clientes', value: stats.total_clientes, icon: <Users className="text-blue-500" />, color: 'bg-blue-50' },
        { title: 'Total Facturado', value: `${stats.total_facturado.toLocaleString()} €`, icon: <CreditCard className="text-green-500" />, color: 'bg-green-50' },
        { title: 'Alertas Vencimiento', value: stats.alertas, icon: <AlertTriangle className="text-orange-500" />, color: 'bg-orange-50' },
        { title: 'Crecimiento', value: '+12%', icon: <TrendingUp className="text-purple-500" />, color: 'bg-purple-50' },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="card flex items-center space-x-4">
                        <div className={`p-4 rounded-xl ${card.color}`}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{card.title}</p>
                            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-white shadow-lg">
                <h3 className="text-xl font-semibold mb-2">Bienvenido de nuevo al CRM Nofence</h3>
                <p className="text-primary-100 max-w-lg">
                    Gestiona tus clientes, los bonos del Kit Digital y la facturación desde un solo lugar.
                    Los archivos se guardan localmente en formato CSV para tu comodidad.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
