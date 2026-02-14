import React from 'react';
import Input from '../ui/Input';

/**
 * Componente para filtrar la lista de equipos.
 * Permite buscar por texto (nombre) y filtrar por categoría.
 */
const FiltrosEquipos = ({ search, onSearchChange, category, onCategoryChange, categories }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
                <Input
                    label="Buscar Equipo"
                    placeholder="Nombre del equipo..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            <div className="w-full md:w-64">
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                <select
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                    value={category}
                    onChange={(e) => onCategoryChange(e.target.value)}
                >
                    <option value="Todas">Todas las categorías</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default FiltrosEquipos;
