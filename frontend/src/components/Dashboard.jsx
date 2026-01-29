import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientes } from '../api';
import { Users, CreditCard, AlertTriangle, TrendingUp, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState([]);
    const [stats, setStats] = useState({
        total_clientes: 0,
        total_facturado: 0,
        alertas: 0,
        acuerdos_pendientes: 0,
        facturas_pendientes: 0,
        justificaciones_pendientes: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const res = await getClientes();
        const clientsData = res.data;
        setClientes(clientsData);

        // Calculate stats
        const totalFacturado = clientsData.reduce((sum, c) => sum + (c.total_facturado || 0), 0);

        let acuerdosPendientes = 0;
        let facturasPendientes = 0;
        let justificacionesPendientes = 0;

        clientsData.forEach(client => {
            client.acuerdos?.forEach(acuerdo => {
                if (acuerdo.Enviado && !acuerdo.Firmado) acuerdosPendientes++;
                if (acuerdo.Estado_Justificacion === 'Enviada') justificacionesPendientes++;
                acuerdo.facturas?.forEach(factura => {
                    if (factura.Estado_Pago === 'Pendiente') facturasPendientes++;
                });
            });
        });

        setStats({
            total_clientes: clientsData.length,
            total_facturado: totalFacturado,
            alertas: 0, // Will calculate later
            acuerdos_pendientes: acuerdosPendientes,
            facturas_pendientes: facturasPendientes,
            justificaciones_pendientes: justificacionesPendientes
        });
    };

    // Utility: Calculate days until a date
    const daysUntil = (dateString) => {
        if (!dateString) return null;
        const targetDate = new Date(dateString);
        const today = new Date();
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Get urgency color based on days remaining
    const getUrgencyColor = (days) => {
        if (days === null) return 'bg-slate-50 border-slate-200 text-slate-700';
        if (days < 0) return 'bg-red-100 border-red-300 text-red-800';
        if (days < 7) return 'bg-red-50 border-red-200 text-red-700';
        if (days < 15) return 'bg-orange-50 border-orange-200 text-orange-700';
        if (days < 30) return 'bg-yellow-50 border-yellow-200 text-yellow-700';
        return 'bg-slate-50 border-slate-200 text-slate-700';
    };

    // Filter functions
    const getAcuerdosPendientesFirma = () => {
        const results = [];
        clientes.forEach(client => {
            client.acuerdos?.forEach(acuerdo => {
                if (acuerdo.Enviado && !acuerdo.Firmado) {
                    const daysSinceSent = acuerdo.Fecha_Envio ? -daysUntil(acuerdo.Fecha_Envio) : null;
                    results.push({
                        client,
                        acuerdo,
                        daysSinceSent,
                        sortKey: daysSinceSent || 0
                    });
                }
            });
        });
        return results.sort((a, b) => b.sortKey - a.sortKey);
    };

    const getFacturasPendientesPago = () => {
        const results = [];
        clientes.forEach(client => {
            client.acuerdos?.forEach(acuerdo => {
                acuerdo.facturas?.forEach(factura => {
                    if (factura.Estado_Pago === 'Pendiente') {
                        const daysOverdue = factura.Fecha_Emision ? -daysUntil(factura.Fecha_Emision) : null;
                        results.push({
                            client,
                            factura,
                            daysOverdue,
                            sortKey: daysOverdue || 0
                        });
                    }
                });
            });
        });
        return results.sort((a, b) => b.sortKey - a.sortKey);
    };

    const getJustificacionesPendientes = () => {
        const results = [];
        clientes.forEach(client => {
            client.acuerdos?.forEach(acuerdo => {
                if (acuerdo.Estado_Justificacion === 'Enviada') {
                    results.push({ client, acuerdo });
                }
            });
        });
        return results;
    };

    const getKitsProximosCaducar = () => {
        const results = [];
        clientes.forEach(client => {
            // Only show kits with remaining balance (not fully consumed)
            const hasBalance = client.Saldo && client.Saldo > 0;
            if (client.Fecha_Aprobacion_Bono && hasBalance) {
                const expiryDate = new Date(client.Fecha_Aprobacion_Bono);
                expiryDate.setDate(expiryDate.getDate() + 180);
                const days = daysUntil(expiryDate.toISOString().split('T')[0]);
                if (days !== null && days >= 0) {
                    results.push({ client, days, expiryDate: expiryDate.toISOString().split('T')[0] });
                }
            }
        });
        return results.sort((a, b) => a.days - b.days);
    };

    const getAcuerdosProximosVencer = () => {
        const results = [];
        clientes.forEach(client => {
            client.acuerdos?.forEach(acuerdo => {
                const hasInvoices = acuerdo.facturas && acuerdo.facturas.length > 0;
                if (!hasInvoices && acuerdo.Fecha_Aprobacion) {
                    const expiryDate = new Date(acuerdo.Fecha_Aprobacion);
                    expiryDate.setDate(expiryDate.getDate() + 90);
                    const days = daysUntil(expiryDate.toISOString().split('T')[0]);
                    if (days !== null && days >= 0) {
                        results.push({
                            client,
                            acuerdo,
                            days,
                            expiryDate: expiryDate.toISOString().split('T')[0]
                        });
                    }
                }
            });
        });
        return results.sort((a, b) => a.days - b.days);
    };

    const getJustificacionesProximasVencer = () => {
        const results = [];
        clientes.forEach(client => {
            client.acuerdos?.forEach(acuerdo => {
                if (acuerdo.Estado_Justificacion !== 'Justificada' && acuerdo.facturas && acuerdo.facturas.length > 0) {
                    const firstInvoice = acuerdo.facturas[0];
                    if (firstInvoice.Fecha_Emision) {
                        const expiryDate = new Date(firstInvoice.Fecha_Emision);
                        expiryDate.setDate(expiryDate.getDate() + 90);
                        const days = daysUntil(expiryDate.toISOString().split('T')[0]);
                        if (days !== null && days >= 0) {
                            results.push({
                                client,
                                acuerdo,
                                days,
                                expiryDate: expiryDate.toISOString().split('T')[0]
                            });
                        }
                    }
                }
            });
        });
        return results.sort((a, b) => a.days - b.days);
    };

    const cards = [
        { title: 'Total Clientes', value: stats.total_clientes, icon: <Users className="text-blue-500" />, color: 'bg-blue-50' },
        { title: 'Total Facturado', value: `${stats.total_facturado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`, icon: <CreditCard className="text-green-500" />, color: 'bg-green-50' },
        { title: 'Acuerdos Pendientes', value: stats.acuerdos_pendientes, icon: <FileText className="text-orange-500" />, color: 'bg-orange-50' },
        { title: 'Facturas Pendientes', value: stats.facturas_pendientes, icon: <AlertTriangle className="text-red-500" />, color: 'bg-red-50' },
    ];

    const ActionCard = ({ title, items, emptyMessage, renderItem }) => (
        <div className="card">
            <h3 className="text-lg font-bold mb-4 flex items-center justify-between border-b pb-2">
                <span>{title}</span>
                <span className="text-sm bg-primary-100 text-primary-700 px-2 py-1 rounded-full">{items.length}</span>
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                    <div className="text-sm text-slate-400 italic text-center py-4">{emptyMessage}</div>
                ) : (
                    items.slice(0, 10).map((item, idx) => renderItem(item, idx))
                )}
            </div>
        </div>
    );

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

            {/* Action Lists */}
            <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                    <AlertCircle className="mr-2 text-orange-500" size={24} />
                    Acciones Pendientes
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Acuerdos sin firmar */}
                    <ActionCard
                        title="Acuerdos por Firmar"
                        items={getAcuerdosPendientesFirma()}
                        emptyMessage="No hay acuerdos pendientes de firma"
                        renderItem={(item, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(`/clientes/${item.client.Dni}`)}
                                className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 cursor-pointer transition-colors"
                            >
                                <div className="font-bold text-sm text-slate-800">{item.client.Nombre}</div>
                                <div className="text-xs text-slate-600">Acuerdo: {item.acuerdo.Numero_Acuerdo}</div>
                                {item.daysSinceSent !== null && (
                                    <div className="text-xs text-orange-600 font-bold mt-1">
                                        Hace {item.daysSinceSent} días
                                    </div>
                                )}
                            </div>
                        )}
                    />

                    {/* Facturas sin pagar */}
                    <ActionCard
                        title="Facturas por Cobrar"
                        items={getFacturasPendientesPago()}
                        emptyMessage="No hay facturas pendientes de pago"
                        renderItem={(item, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(`/clientes/${item.client.Dni}`)}
                                className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                            >
                                <div className="font-bold text-sm text-slate-800">{item.client.Nombre}</div>
                                <div className="text-xs text-slate-600">
                                    Factura: {item.factura.Numero_Factura_Real || 'N/A'} - {item.factura.Importe} €
                                </div>
                                {item.daysOverdue !== null && (
                                    <div className="text-xs text-red-600 font-bold mt-1">
                                        {item.daysOverdue} días pendiente
                                    </div>
                                )}
                            </div>
                        )}
                    />

                    {/* Justificaciones pendientes */}
                    <ActionCard
                        title="Justificaciones Enviadas"
                        items={getJustificacionesPendientes()}
                        emptyMessage="No hay justificaciones pendientes"
                        renderItem={(item, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(`/clientes/${item.client.Dni}`)}
                                className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
                            >
                                <div className="font-bold text-sm text-slate-800">{item.client.Nombre}</div>
                                <div className="text-xs text-slate-600">Acuerdo: {item.acuerdo.Numero_Acuerdo}</div>
                                <div className="text-xs text-blue-600 font-bold mt-1">
                                    Estado: {item.acuerdo.Estado_Justificacion}
                                </div>
                            </div>
                        )}
                    />
                </div>
            </div>

            {/* Expiration Alerts */}
            <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                    <Clock className="mr-2 text-yellow-600" size={24} />
                    Próximos Vencimientos
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Kits próximos a caducar */}
                    <ActionCard
                        title="Kits Próximos a Caducar"
                        items={getKitsProximosCaducar()}
                        emptyMessage="No hay kits próximos a caducar"
                        renderItem={(item, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(`/clientes/${item.client.Dni}`)}
                                className={`p-3 border rounded-lg hover:opacity-80 cursor-pointer transition-colors ${getUrgencyColor(item.days)}`}
                            >
                                <div className="font-bold text-sm">{item.client.Nombre}</div>
                                <div className="text-xs mt-1">Vence: {item.expiryDate}</div>
                                <div className="text-xs font-bold mt-1">
                                    {item.days === 0 ? '¡Hoy!' : `${item.days} días`}
                                </div>
                            </div>
                        )}
                    />

                    {/* Acuerdos próximos a vencer */}
                    <ActionCard
                        title="Acuerdos a Vencer"
                        items={getAcuerdosProximosVencer()}
                        emptyMessage="No hay acuerdos próximos a vencer"
                        renderItem={(item, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(`/clientes/${item.client.Dni}`)}
                                className={`p-3 border rounded-lg hover:opacity-80 cursor-pointer transition-colors ${getUrgencyColor(item.days)}`}
                            >
                                <div className="font-bold text-sm">{item.client.Nombre}</div>
                                <div className="text-xs">Acuerdo: {item.acuerdo.Numero_Acuerdo}</div>
                                <div className="text-xs mt-1">Vence: {item.expiryDate}</div>
                                <div className="text-xs font-bold mt-1">
                                    {item.days === 0 ? '¡Hoy!' : `${item.days} días`}
                                </div>
                            </div>
                        )}
                    />

                    {/* Justificaciones próximas a vencer */}
                    <ActionCard
                        title="Justificaciones a Vencer"
                        items={getJustificacionesProximasVencer()}
                        emptyMessage="No hay justificaciones próximas a vencer"
                        renderItem={(item, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(`/clientes/${item.client.Dni}`)}
                                className={`p-3 border rounded-lg hover:opacity-80 cursor-pointer transition-colors ${getUrgencyColor(item.days)}`}
                            >
                                <div className="font-bold text-sm">{item.client.Nombre}</div>
                                <div className="text-xs">Acuerdo: {item.acuerdo.Numero_Acuerdo}</div>
                                <div className="text-xs mt-1">Vence: {item.expiryDate}</div>
                                <div className="text-xs font-bold mt-1">
                                    {item.days === 0 ? '¡Hoy!' : `${item.days} días`}
                                </div>
                            </div>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
