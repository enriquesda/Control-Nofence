import React, { useState, useEffect } from 'react';
import { getEquipos } from '../api';
import FiltrosEquipos from './equipos/FiltrosEquipos';
import TablaEstadoEquipos from './equipos/TablaEstadoEquipos';
import { Loader } from 'lucide-react';

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

    // Filtrado local
    const filteredEquipos = equipos.filter(eq => {
        const matchSearch = (eq.Nombre || '').toLowerCase().includes(search.toLowerCase());
        const matchCat = category === 'Todas' || eq.Categoria === category;
        // Excluimos 'revicido' (recibido) de esta vista general según requisitos
        const isVisibleState = ESTADOS_VISIBLE.includes(eq.Estado);
        return matchSearch && matchCat && isVisibleState;
    });

    // Obtener categorías únicas para el filtro
    const categories = [...new Set(equipos.map(e => e.Categoria))].filter(Boolean);

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

            <div className="space-y-2">
                {ESTADOS_VISIBLE.map(estado => {
                    const equiposEnEstado = filteredEquipos.filter(e => e.Estado === estado);
                    if (equiposEnEstado.length === 0) return null;

                    return (
                        <TablaEstadoEquipos
                            key={estado}
                            titulo={`Equipos en: ${estado.charAt(0).toUpperCase() + estado.slice(1)}`}
                            estado={estado}
                            equipos={equiposEnEstado}
                        />
                    );
                })}

                {filteredEquipos.length === 0 && (
                    <div className="text-center py-12 text-slate-400 italic bg-white rounded-lg border border-slate-100">
                        No hay equipos que coincidan con los filtros.
                    </div>
                )}
            </div>
        </div>
    );
};

export default EquiposPage;
