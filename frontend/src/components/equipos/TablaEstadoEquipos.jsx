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
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Equipo</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Categoría</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Tiempo en Estado</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedEquipos.map(eq => (
                            <tr key={eq.Id_Equipo} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-800">{eq.Nombre}</div>
                                    {eq.Notas && <div className="text-xs text-slate-500 truncate max-w-xs">{eq.Notas}</div>}
                                </td>
                                <td className="px-6 py-4">
                                    {/* Debido a que la API devuelve Dni_Cliente, idealmente deberíamos cruzar datos o traer el nombre.
                                        Por ahora mostraremos el DNI o un link al cliente. */}
                                    <button
                                        onClick={() => navigate(`/clientes/${eq.Dni_Cliente}`)}
                                        className="text-primary-600 hover:text-primary-800 text-sm font-medium hover:underline"
                                    >
                                        {eq.Dni_Cliente}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                        {eq.Categoria}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 flex items-center">
                                    <Clock size={14} className="mr-1.5 text-slate-400" />
                                    {getTimeInState(eq.Fecha_Estado)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {/* Aquí podríamos poner botones rápidos para avanzar estado */}
                                    <div className="text-xs text-slate-400">Ver ficha cliente</div>
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
