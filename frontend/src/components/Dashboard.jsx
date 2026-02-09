import React, { useState, useEffect } from 'react';
import { getClientes, updateAcuerdo } from '../api';
import Estadisticas from './dashboard/Estadisticas';
import AccionesPendientes from './dashboard/AccionesPendientes';
import Alertas from './dashboard/Alertas';

const Dashboard = () => {
    const [clientes, setClientes] = useState([]);
    const [stats, setStats] = useState({
        total_clientes: 0,
        total_facturado: 0,
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

        // Calcular estadísticas
        const totalFacturado = clientsData.reduce((sum, c) => sum + (c.total_facturado || 0), 0);
        let acuerdosPendientes = 0;
        let facturasPendientes = 0;
        let justificacionesPendientes = 0;

        clientsData.forEach(client => {
            client.acuerdos?.forEach(acuerdo => {
                if (acuerdo.Enviado && !acuerdo.Firmado) acuerdosPendientes++;
                if (acuerdo.Estado_Justificacion === 'Enviada para firma') justificacionesPendientes++;
                acuerdo.facturas?.forEach(factura => {
                    if (factura.Estado_Pago === 'Pendiente') facturasPendientes++;
                });
            });
        });

        setStats({
            total_clientes: clientsData.length,
            total_facturado: totalFacturado,
            acuerdos_pendientes: acuerdosPendientes,
            facturas_pendientes: facturasPendientes,
            justificaciones_pendientes: justificacionesPendientes
        });
    };

    const handleQuickSign = async (idAcuerdo, e) => {
        e.stopPropagation();
        if (window.confirm('¿Marcar este acuerdo como FIRMADO con fecha de hoy?')) {
            const today = new Date().toISOString().split('T')[0];
            await updateAcuerdo(idAcuerdo, { Firmado: true, Fecha_Firma: today });
            loadData();
        }
    };

    // --- Helpers de Fecha y Cálculo ---
    const daysUntil = (dateString) => {
        if (!dateString) return null;
        const targetDate = new Date(dateString);
        const today = new Date();
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // --- Data Getters for Subcomponents ---

    const getAcuerdosPendientes = () => {
        const results = [];
        clientes.forEach(client => {
            client.acuerdos?.forEach(acuerdo => {
                if (acuerdo.Enviado && !acuerdo.Firmado) {
                    const daysSinceSent = acuerdo.Fecha_Envio ? -daysUntil(acuerdo.Fecha_Envio) : null;
                    results.push({ client, acuerdo, daysSinceSent, sortKey: daysSinceSent || 0 });
                }
            });
        });
        return results.sort((a, b) => b.sortKey - a.sortKey);
    };

    const getFacturasPendientes = () => {
        const results = [];
        clientes.forEach(client => {
            client.acuerdos?.forEach(acuerdo => {
                acuerdo.facturas?.forEach(factura => {
                    if (factura.Estado_Pago === 'Pendiente') {
                        const daysOverdue = factura.Fecha_Emision ? -daysUntil(factura.Fecha_Emision) : null;
                        results.push({ client, factura, acuerdo, daysOverdue, sortKey: daysOverdue || 0 });
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
                if (acuerdo.Estado_Justificacion === 'Enviada para firma') {
                    results.push({ client, acuerdo });
                }
            });
        });
        return results;
    };

    const getKitsCaducan = () => {
        const results = [];
        clientes.forEach(client => {
            const totalAcuerdos = client.acuerdos ? client.acuerdos.reduce((acc, curr) => acc + (curr.Importe || 0), 0) : 0;
            const saldoRestante = (client.Importe_Bono || 0) - totalAcuerdos;

            if (client.Fecha_Aprobacion_Bono && saldoRestante > 0) {
                const expiryDate = new Date(client.Fecha_Aprobacion_Bono);
                expiryDate.setDate(expiryDate.getDate() + 180); // 6 meses
                const days = daysUntil(expiryDate.toISOString().split('T')[0]);
                if (days !== null && days >= 0) {
                    results.push({ client, days, expiryDate: expiryDate.toISOString().split('T')[0] });
                }
            }
        });
        return results.sort((a, b) => a.days - b.days);
    };

    const getAcuerdosVencen = () => {
        const results = [];
        clientes.forEach(client => {
            client.acuerdos?.forEach(acuerdo => {
                const hasInvoices = acuerdo.facturas && acuerdo.facturas.length > 0;
                if (!hasInvoices && acuerdo.Fecha_Aprobacion) {
                    const expiryDate = new Date(acuerdo.Fecha_Aprobacion);
                    expiryDate.setDate(expiryDate.getDate() + 90); // 3 meses para facturar
                    const days = daysUntil(expiryDate.toISOString().split('T')[0]);
                    if (days !== null && days >= 0) {
                        results.push({ client, acuerdo, days, expiryDate: expiryDate.toISOString().split('T')[0] });
                    }
                }
            });
        });
        return results.sort((a, b) => a.days - b.days);
    };

    const getJustificacionesVencen = () => {
        const results = [];
        clientes.forEach(client => {
            client.acuerdos?.forEach(acuerdo => {
                if (acuerdo.Estado_Justificacion !== 'Justificada' && acuerdo.facturas && acuerdo.facturas.length > 0) {
                    const firstInvoice = acuerdo.facturas[0];
                    if (firstInvoice.Fecha_Emision) {
                        const expiryDate = new Date(firstInvoice.Fecha_Emision);
                        expiryDate.setDate(expiryDate.getDate() + 90); // 3 meses para justificar
                        const days = daysUntil(expiryDate.toISOString().split('T')[0]);
                        if (days !== null && days >= 0) {
                            results.push({ client, acuerdo, days, expiryDate: expiryDate.toISOString().split('T')[0] });
                        }
                    }
                }
            });
        });
        return results.sort((a, b) => a.days - b.days);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h2>

            <Estadisticas stats={stats} />

            <AccionesPendientes
                acuerdosPendientes={getAcuerdosPendientes()}
                facturasPendientes={getFacturasPendientes()}
                justificacionesPendientes={getJustificacionesPendientes()}
                onQuickSign={handleQuickSign}
            />

            <Alertas
                kitsCaducan={getKitsCaducan()}
                acuerdosVencen={getAcuerdosVencen()}
                justificacionesVencen={getJustificacionesVencen()}
            />
        </div>
    );
};

export default Dashboard;
