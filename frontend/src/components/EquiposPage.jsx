import React, { useState, useEffect } from 'react';
import { getEquipos } from '../api';
import FiltrosEquipos from './equipos/FiltrosEquipos';
import TablaEstadoEquipos from './equipos/TablaEstadoEquipos';
import { Loader } from 'lucide-react';
import { useClientFilter } from '../context/ClientFilterContext';

const ESTADOS_VISIBLE = ['espera', 'pedido', 'pagado', 'en oficina', 'enviado'];

const EquiposPage = () => {
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Todas');

    useEffect(() => {
        fetchEquipos();
    }, []);

    const fetchEquipos = async () => {
        try {
            setLoading(true);
            const res = await getEquipos();
            setEquipos(res.data);
        } catch (error) {
            console.error("Error cargando equipos:", error);
        } finally {
            setLoading(false);
        }
    };

    const { filterMode } = useClientFilter();

    // Filtrado local
    const filteredEquipos = equipos.filter(eq => {
        const matchSearch = (eq.Nombre || '').toLowerCase().includes(search.toLowerCase());
        const matchCat = category === 'Todas' || eq.Categoria === category;
        const isVisibleState = ESTADOS_VISIBLE.includes(eq.Estado);

        // Filter by Client Type
        let matchesType = true;
        if (filterMode === 'nofence') {
            matchesType = !eq.Cliente_Tipo || eq.Cliente_Tipo === 'Nofence';
        } else if (filterMode === 'normal') {
            matchesType = eq.Cliente_Tipo === 'Normal';
        }

        return matchSearch && matchCat && isVisibleState && matchesType;
    });

    // Obtener categorías únicas para el filtro
    const categories = [...new Set(equipos.map(e => e.Categoria))].filter(Boolean);

    const handleStatusChange = async (id, newStatus) => {
        try {
            // Optimistic update locally
            const localUpdate = equipos.map(e => e.Id_Equipo === id ? { ...e, Estado: newStatus } : e);
            setEquipos(localUpdate);

            // Dynamic import to avoid circular dependency issues if any, or just standard import
            const { updateEquipoStatus } = await import('../api');
            await updateEquipoStatus(id, { Estado: newStatus });

            // Refresh to ensure sync
            fetchEquipos();
        } catch (error) {
            console.error("Error updating status:", error);
            fetchEquipos(); // Revert on error
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-12">
                <Loader className="animate-spin text-primary-500" size={32} />
            </div>
        );
    }

    return (
        <div className="pb-20">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Equipos</h1>
                <p className="text-slate-500 mt-1">
                    Vista general de equipos en proceso. Los equipos recibidos no se muestran aquí.
                </p>
            </div>

            <FiltrosEquipos
                search={search}
                onSearchChange={setSearch}
                category={category}
                onCategoryChange={setCategory}
                categories={categories}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {ESTADOS_VISIBLE.map(estado => {
                    const equiposEnEstado = filteredEquipos.filter(e => e.Estado === estado);
                    if (equiposEnEstado.length === 0) return null;

                    return (
                        <TablaEstadoEquipos
                            key={estado}
                            titulo={`Equipos en: ${estado.charAt(0).toUpperCase() + estado.slice(1)}`}
                            estado={estado}
                            equipos={equiposEnEstado}
                            onStatusChange={handleStatusChange}
                        />
                    );
                })}
            </div>

            {filteredEquipos.length === 0 && (
                <div className="text-center py-12 text-slate-400 italic bg-white rounded-lg border border-slate-100">
                    No hay equipos que coincidan con los filtros.
                </div>
            )}
        </div>
    );
};

export default EquiposPage;
