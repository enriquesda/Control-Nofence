import React, { useState, useEffect } from 'react';
import { getClientes, deleteCliente, createCliente } from '../api';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronRight, UserPlus, Trash2, MapPin } from 'lucide-react';

const ClientList = () => {
    const [clientes, setClientes] = useState([]);
    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState('Todos');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newClient, setNewClient] = useState({ Dni: '', Nombre: '', Telefono: '', Email: '' });

    const fetchData = () => {
        getClientes().then(res => setClientes(res.data));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (e, dni) => {
        e.preventDefault(); // Prevent link navigation
        if (window.confirm('¿Estás seguro de que quieres eliminar este cliente? Se borrarán todos sus datos y facturas.')) {
            await deleteCliente(dni);
            fetchData();
        }
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        await createCliente(newClient);
        setShowAddModal(false);
        fetchData();
        setNewClient({ Dni: '', Nombre: '', Telefono: '', Email: '' });
    };

    const filtered = clientes.filter(c => {
        const matchesSearch = c.Nombre.toLowerCase().includes(search.toLowerCase()) || c.Dni.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filterEstado === 'Todos' || c.Estado === filterEstado;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Kit pedido': return 'bg-slate-100 text-slate-700';
            case 'Kit aprobado': return 'bg-blue-100 text-blue-700';
            case 'Acuerdo lanzado': return 'bg-yellow-100 text-yellow-700';
            case 'Acuerdos firmados': return 'bg-orange-100 text-orange-700';
            case 'Facturas lanzadas': return 'bg-purple-100 text-purple-700';
            case 'Facturas pagadas': return 'bg-green-100 text-green-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Listado de Clientes</h2>
                <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center space-x-2">
                    <UserPlus size={18} />
                    <span>Añadir Cliente</span>
                </button>
            </div>

            <div className="card mb-6 flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o DNI..."
                        className="input-field pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Filter size={18} className="text-slate-500" />
                    <select
                        className="input-field py-1"
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
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
            </div>

            <div className="card p-0 overflow-hidden">
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
                        {filtered.map(c => (
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
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(c.Estado)}`}>
                                        {c.Estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right flex items-center justify-end space-x-3">
                                    <Link
                                        to={`/clientes/${c.Dni}`}
                                        className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
                                    >
                                        Detalle <ChevronRight size={16} />
                                    </Link>
                                    <button
                                        onClick={(e) => handleDelete(e, c.Dni)}
                                        className="text-slate-400 hover:text-red-600 transition-colors"
                                        title="Eliminar Cliente"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <h3 className="text-xl font-bold mb-4">Nuevo Cliente</h3>
                        <form onSubmit={handleCreateClient} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">DNI / CIF</label>
                                <input required type="text" className="input-field" value={newClient.Dni} onChange={e => setNewClient({ ...newClient, Dni: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                                <input required type="text" className="input-field" value={newClient.Nombre} onChange={e => setNewClient({ ...newClient, Nombre: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                                <input type="text" className="input-field" value={newClient.Telefono} onChange={e => setNewClient({ ...newClient, Telefono: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                <input type="email" className="input-field" value={newClient.Email} onChange={e => setNewClient({ ...newClient, Email: e.target.value })} />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancelar</button>
                                <button type="submit" className="btn-primary flex-1">Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientList;
