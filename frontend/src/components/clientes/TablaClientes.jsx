import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Trash2, MapPin, Clock, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const TablaClientes = ({ clientes, onDelete }) => {
    const navigate = useNavigate();

    const getStatusColor = (status) => {
        switch (status) {
            case 'Kit pedido': return 'default';
            case 'Kit aprobado': return 'primary';
            case 'Acuerdos enviados':
            case 'Acuerdos firmados':
            case 'Facturas no generadas':
            case 'Pendiente de justificar':
            case 'Justificación pendiente de firma':
                return 'warning';
            case 'Facturas no pagadas':
                return 'purple';
            case 'Justificado':
            case 'Facturas pagadas':
                return 'success';
            case 'Pendiente 2º justificacion':
                return 'danger';
            case '2º Justificacion completada':
                return 'purple';
            default: return 'default';
        }
    };

    const getVencimientoBadge = (dias) => {
        if (dias === 9999 || dias == null) return null;
        
        if (dias < 0) {
            return (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md w-fit border border-red-100">
                    <AlertCircle size={12} strokeWidth={2.5} />
                    <span>Hace {Math.abs(dias)} días</span>
                </div>
            );
        }
        if (dias <= 30) {
            return (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 bg-red-50/50 px-2.5 py-1 rounded-md w-fit border border-red-50">
                    <Clock size={12} strokeWidth={2.5} />
                    <span>En {dias} días</span>
                </div>
            );
        }
        if (dias <= 60) {
            return (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md w-fit border border-orange-100">
                    <Clock size={12} strokeWidth={2.5} />
                    <span>En {dias} días</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md w-fit border border-emerald-100">
                <Clock size={12} strokeWidth={2.5} />
                <span>En {dias} días</span>
            </div>
        );
    };

    return (
        <Card padding="p-0" className="overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Situación</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-4"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {clientes.map(c => (
                        <tr
                            key={c.Dni}
                            onClick={() => navigate(`/clientes/${c.Dni}`)}
                            className="hover:bg-slate-50 transition-colors group cursor-pointer"
                        >
                            <td className="px-6 py-4">
                                <div className="font-semibold text-slate-800">{c.Nombre}</div>
                                <div className="text-xs text-slate-500 font-mono">{c.Dni}</div>
                            </td>
                            <td className="px-6 py-4">
                                {c.Proximo_Vencimiento_Texto && c.Proximo_Vencimiento_Texto !== "-" ? (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[12px] font-semibold text-slate-700 capitalize tracking-tight leading-tight">
                                            {c.Proximo_Vencimiento_Texto}
                                        </span>
                                        {getVencimientoBadge(c.Proximo_Vencimiento_Dias)}
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-300 italic">Sin vencimiento actual</span>
                                )}
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(e, c.Dni);
                                    }}
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
                            <td colSpan="4" className="px-6 py-8 text-center text-slate-400 italic">
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
