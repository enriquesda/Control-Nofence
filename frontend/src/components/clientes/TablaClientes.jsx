import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Trash2, MapPin } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const TablaClientes = ({ clientes, onDelete }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Kit pedido': return 'default';
            case 'Kit aprobado': return 'primary';
            case 'Acuerdo lanzado': return 'warning';
            case 'Acuerdos firmados': return 'warning'; // Orange mapping in Badge is 'warning'
            case 'Facturas lanzadas': return 'purple';
            case 'Facturas pagadas': return 'success';
            default: return 'default';
        }
    };

    return (
        <Card padding="p-0" className="overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ubicación</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-4"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {clientes.map(c => (
                        <tr key={c.Dni} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="font-semibold text-slate-800">{c.Nombre}</div>
                                <div className="text-xs text-slate-500 font-mono">{c.Dni}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-slate-700">{c.Telefono}</div>
                                <div className="text-xs text-slate-500">{c.Email}</div>
                            </td>
                            <td className="px-6 py-4">
                                {c.Localidad ? (
                                    <div className="flex items-center text-sm text-slate-600">
                                        <MapPin size={14} className="mr-1 text-slate-400" />
                                        {c.Localidad} ({c.Provincia})
                                    </div>
                                ) : <span className="text-xs text-slate-400">-</span>}
                            </td>
                            <td className="px-6 py-4">
                                <Badge variant={getStatusColor(c.Estado)}>
                                    {c.Estado}
                                </Badge>
                            </td>
                            <td className="px-6 py-4 text-right flex items-center justify-end space-x-3">
                                <Link
                                    to={`/clientes/${c.Dni}`}
                                    className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
                                >
                                    Detalle <ChevronRight size={16} />
                                </Link>
                                <button
                                    onClick={(e) => onDelete(e, c.Dni)}
                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                    title="Eliminar Cliente"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {clientes.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-slate-400 italic">
                                No se encontraron clientes
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </Card>
    );
};

export default TablaClientes;
