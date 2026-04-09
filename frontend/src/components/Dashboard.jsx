import React, { useState, useEffect } from 'react';
import { getClientes, updateAcuerdo } from '../api';
import Estadisticas from './dashboard/Estadisticas';
import AccionesPendientes from './dashboard/AccionesPendientes';
import Alertas from './dashboard/Alertas';
import TablonNotas from './dashboard/TablonNotas';
import { useClientFilter } from '../context/ClientFilterContext';

const Dashboard = () => {
    const [clientes, setClientes] = useState([]);
    const [stats, setStats] = useState({
        total_clientes: 0,
        total_facturado: 0,
        acuerdos_pendientes: 0,
        facturas_pendientes: 0,
        justificaciones_pendientes: 0
    });

    const { filterMode } = useClientFilter();

    useEffect(() => {
        loadData();
    }, [filterMode]); // Reload/Recalculate when filter changes. Ideally we fetch once and filter locally, but loadData calls API.

    const loadData = async () => {
        const res = await getClientes();
        let clientsData = res.data;

        // Apply Filter
        if (filterMode === 'nofence') {
            clientsData = clientsData.filter(c => !c.Tipo || c.Tipo === 'Nofence');
        } else if (filterMode === 'normal') {
            clientsData = clientsData.filter(c => c.Tipo === 'Normal');
        }

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
        return clientes
            .filter(c => c.Proximo_Vencimiento_Texto === "Vencimiento del bono" && c.Proximo_Vencimiento_Dias !== 9999)
            .map(client => ({
                client,
                days: client.Proximo_Vencimiento_Dias,
                expiryDate: client.Proximo_Vencimiento_Fecha
            }))
            .sort((a, b) => a.days - b.days);
    };

    const getAcuerdosVencen = () => {
        return clientes
            .filter(c => c.Proximo_Vencimiento_Texto === "Vencimiento acuerdos" && c.Proximo_Vencimiento_Dias !== 9999)
            .map(client => ({
                client,
                days: client.Proximo_Vencimiento_Dias,
                expiryDate: client.Proximo_Vencimiento_Fecha
            }))
            .sort((a, b) => a.days - b.days);
    };

    const getJustificacionesVencen = () => {
        return clientes
            .filter(c => c.Proximo_Vencimiento_Texto === "Vencimiento justificación" && c.Proximo_Vencimiento_Dias !== 9999)
            .map(client => ({
                client,
                days: client.Proximo_Vencimiento_Dias,
                expiryDate: client.Proximo_Vencimiento_Fecha
            }))
            .sort((a, b) => a.days - b.days);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h2>

            <Estadisticas stats={stats} />

            <TablonNotas clientes={clientes} />

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
