import React, { useState, useEffect } from 'react';
import { getClientes } from '../api';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const NofencePage = () => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all clients to aggregate
                const res = await getClientes();
                // Filter only 'Nofence' type clients just in case, though some might have the type but no status
                // We'll group by `Estado_Nofence` specifically
                const filtered = res.data.filter(c => !c.Tipo || c.Tipo === 'Nofence');
                setClientes(filtered);
            } catch (err) {
                console.error("Error fetching Nofence clients", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Agrupar clientes por su Estado_Nofence
    const estados = {
        'Avisar a Nofence': [],
        'Pago pendiente': [],
        'Pago realizado': [],
        'Collares pedidos': [],
        'Sin estado particular': []
    };

    clientes.forEach(c => {
        if (!c.Estado_Nofence || c.Estado_Nofence === '') {
            estados['Sin estado particular'].push(c);
        } else if (estados[c.Estado_Nofence]) {
            estados[c.Estado_Nofence].push(c);
        } else {
            // Unmapped status safety net
            estados['Sin estado particular'].push(c);
        }
    });

    const StatusIcon = ({ status, className }) => {
        switch (status) {
            case 'Avisar a Nofence': return <AlertCircle className={`text-orange-500 ${className}`} />;
            case 'Pago pendiente': return <Clock className={`text-blue-500 ${className}`} />;
            case 'Pago realizado': return <CheckCircle className={`text-green-500 ${className}`} />;
            case 'Collares pedidos': return <Package className={`text-purple-500 ${className}`} />;
            default: return <FileText className={`text-slate-400 ${className}`} />;
        }
    };

    const StatusCardColor = (status) => {
        switch (status) {
            case 'Avisar a Nofence': return 'border-orange-200 bg-orange-50';
            case 'Pago pendiente': return 'border-blue-200 bg-blue-50';
            case 'Pago realizado': return 'border-green-200 bg-green-50';
            case 'Collares pedidos': return 'border-purple-200 bg-purple-50';
            default: return 'border-slate-200 bg-slate-50';
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Cargando panel Nofence...</div>;

    // Ordered states to display mapping
    const displayGroups = [
        'Avisar a Nofence',
        'Pago pendiente',
        'Pago realizado',
        'Collares pedidos'
    ];

    return (
        <div className="animate-in fade-in pb-20">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <span className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                        <MapPin size={24} />
                    </span>
                    Dashboard Nofence
                </h2>
                <p className="text-slate-500 mt-2">Visión global de clientes Nofence organizados por su estado operativo.</p>
            </div>

            {/* Sumario Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {displayGroups.map(estado => (
                    <Card key={estado} className={`shadow-sm flex flex-col items-center justify-center p-6 border-2 ${StatusCardColor(estado)}`}>
                        <div className="mb-3">
                            <StatusIcon status={estado} className="w-10 h-10" />
                        </div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-600 text-center mb-1">{estado}</h4>
                        <div className="text-4xl font-extrabold text-slate-800">{estados[estado].length}</div>
                        <div className="text-xs text-slate-500 mt-2">clientes en esta fase</div>
                    </Card>
                ))}
            </div>

            {/* Listados Detallados */}
            <div className="space-y-8">
                {displayGroups.map(estado => {
                    const list = estados[estado];
                    if (list.length === 0) return null; // Don't show empty lists to keep it clean

                    return (
                        <Card key={estado + '-list'} className="shadow-sm">
                            <div className="flex items-center gap-2 mb-6 border-b pb-4">
                                <StatusIcon status={estado} className="w-6 h-6" />
                                <h3 className="text-xl font-bold text-slate-800">{estado}</h3>
                                <Badge variant="secondary" className="ml-2">{list.length}</Badge>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Cliente</th>
                                            <th className="px-4 py-3">Contacto</th>
                                            <th className="px-4 py-3">Referencia Pago</th>
                                            <th className="px-4 py-3 rounded-tr-lg">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {list.map(c => (
                                            <tr key={c.Dni} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-slate-800">{c.Nombre}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{c.Dni}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1"><Phone size={12}/> {c.Telefono || '-'}</div>
                                                    <div className="flex items-center gap-1 text-xs"><Mail size={12}/> {c.Email || '-'}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {c.Referencia_Pago_Nofence ? (
                                                        <span className="font-mono bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                                                            {c.Referencia_Pago_Nofence}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-xs">Sin referencia</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Link 
                                                        to={`/clientes/${c.Dni}?tab=nofence`}
                                                        className="text-primary-600 hover:text-primary-800 hover:underline font-medium flex items-center gap-1 text-xs"
                                                    >
                                                        Abrir Ficha Nofence
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

// We need to import Package since we used it in StatusIcon but forgot it in imports
import { Package } from 'lucide-react';

export default NofencePage;
