import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useNavigate } from 'react-router-dom';

/**
 * Componente que muestra una tabla de equipos filtrada por estado.
 * Muestra los equipos ordenados por tiempo en el estado actual (descendente).
 */
const TablaEstadoEquipos = ({ titulo, equipos, estado, onStatusChange }) => {
    const navigate = useNavigate();

    // Ordenar por fecha de estado (más antiguo primero en ese estado = más tiempo esperando)
    // O si se prefiere "quien más tiempo lleve" => Fecha_Estado ascendente (más vieja fecha = más tiempo)
    const sortedEquipos = [...equipos].sort((a, b) => {
        if (!a.Fecha_Estado) return 1;
        if (!b.Fecha_Estado) return -1;
        return new Date(a.Fecha_Estado) - new Date(b.Fecha_Estado);
    });

    if (sortedEquipos.length === 0) return null;

    const getTimeInState = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Hoy';
        return `${diffDays} días`;
    };

    return (
        <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center">
                <span className="bg-slate-200 text-slate-600 py-1 px-3 rounded-full text-xs mr-3">{sortedEquipos.length}</span>
                {titulo}
            </h3>
            <Card padding="p-0" className="overflow-hidden border-t-4 border-t-primary-500">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Equipo</th>
                            <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                            <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Categoría</th>
                            <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Tiempo</th>
                            <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedEquipos.map(eq => (
                            <tr key={eq.Id_Equipo} className="hover:bg-slate-50 transition-colors">
                                <td className="px-3 py-3">
                                    <div className="font-medium text-slate-800 text-sm">{eq.Nombre}</div>
                                    {eq.Notas && <div className="text-xs text-slate-500 truncate max-w-[120px]">{eq.Notas}</div>}
                                </td>
                                <td className="px-3 py-3">
                                    <button
                                        onClick={() => navigate(`/clientes/${eq.Dni_Cliente}?tab=equipos`)}
                                        className="text-primary-600 hover:text-primary-800 text-xs font-medium hover:underline text-left block"
                                    >
                                        Ver Cliente <br />
                                        <span className="text-[10px] text-slate-400 font-mono">{eq.Dni_Cliente}</span>
                                    </button>
                                </td>
                                <td className="px-3 py-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-800">
                                        {eq.Categoria}
                                    </span>
                                </td>
                                <td className="px-3 py-3 text-xs text-slate-600">
                                    <div className="flex items-center">
                                        <Clock size={12} className="mr-1 text-slate-400" />
                                        {getTimeInState(eq.Fecha_Estado)}
                                    </div>
                                </td>
                                <td className="px-3 py-3 text-right">
                                    <select
                                        className="text-xs p-1 rounded border-slate-300 bg-white shadow-sm focus:border-primary-500 focus:ring-primary-500 w-full max-w-[110px]"
                                        value={eq.Estado}
                                        onChange={(e) => onStatusChange && onStatusChange(eq.Id_Equipo, e.target.value)}
                                    >
                                        {['espera', 'pedido', 'pagado', 'en oficina', 'enviado', 'revicido'].map(st => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default TablaEstadoEquipos;
