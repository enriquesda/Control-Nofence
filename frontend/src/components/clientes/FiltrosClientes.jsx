import React from 'react';
import { Search, Filter, UserPlus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

const FiltrosClientes = ({
    search,
    onSearchChange,
    filterEstado,
    onFilterChange,
    onAddClient
}) => {
    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Listado de Clientes</h2>
                <Button onClick={onAddClient}>
                    <UserPlus size={18} />
                    <span>Añadir Cliente</span>
                </Button>
            </div>

            <Card className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4" padding="p-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o DNI..."
                        className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2 pl-10 pr-3 border outline-none transition-all"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Filter size={18} className="text-slate-500" />
                    <select
                        className="rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2 px-3 border outline-none transition-all"
                        value={filterEstado}
                        onChange={(e) => onFilterChange(e.target.value)}
                    >
                        <option>Todos</option>
                        <option>Kit pedido</option>
                        <option>Kit aprobado</option>
                        <option>Acuerdo lanzado</option>
                        <option>Acuerdos firmados</option>
                        <option>Facturas lanzadas</option>
                        <option>Facturas pagadas</option>
                    </select>
                </div>
            </Card>
        </div>
    );
};

export default FiltrosClientes;
