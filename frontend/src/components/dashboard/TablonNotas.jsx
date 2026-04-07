import React, { useState, useEffect } from 'react';
import { getNotasDashboard, createNotaDashboard, deleteNotaDashboard } from '../../api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { MessageSquarePlus, Trash2, User, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TablonNotas = ({ clientes }) => {
    const [notas, setNotas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    
    // Form state
    const [formulario, setFormulario] = useState({
        Creador: 'Enrique',
        Destinatario: 'Ambos',
        Dni_Cliente: '',
        Texto: ''
    });

    // Custom searchable dropdown state
    const [busqueda, setBusqueda] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const cargarNotas = async () => {
        try {
            setLoading(true);
            const res = await getNotasDashboard();
            setNotas(res.data);
        } catch (error) {
            console.error("Error al cargar notas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarNotas();
    }, []);

    const handleChange = (e) => {
        setFormulario({
            ...formulario,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formulario.Texto.trim()) return;

        try {
            await createNotaDashboard({
                Creador: formulario.Creador,
                Destinatario: formulario.Destinatario,
                Dni_Cliente: formulario.Dni_Cliente || null,
                Texto: formulario.Texto
            });
            setFormulario({ ...formulario, Texto: '', Dni_Cliente: '' }); // Reset text but keep users
            setBusqueda('');
            setShowForm(false);
            cargarNotas();
        } catch (error) {
            console.error("Error creando nota:", error);
            alert("Hubo un error al crear la nota.");
        }
    };

    const handleEliminar = async (id_nota) => {
        if (!window.confirm("¿Marcar esta nota como leída y eliminar?")) return;
        try {
            await deleteNotaDashboard(id_nota);
            cargarNotas();
        } catch (error) {
            console.error("Error elminando nota:", error);
        }
    };

    const formatearFecha = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const clientesFiltrados = clientes.filter(c => 
        (c.Nombre || '').toLowerCase().includes(busqueda.toLowerCase()) || 
        (c.Dni || '').toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center space-x-2 text-slate-800">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <MessageSquarePlus size={20} />
                    </div>
                    <span>Tablón de Tareas Compartidas</span>
                </h3>
                <Button variant="outline" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancelar' : '+ Nueva Tarea'}
                </Button>
            </div>

            {/* Nuevo Formulario */}
            {showForm && (
                <Card className="mb-6 border-l-4 border-l-indigo-500 animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-1/3">
                                <label className="block text-xs font-medium text-slate-500 mb-1">De (Creador)</label>
                                <select 
                                    name="Creador" 
                                    value={formulario.Creador} 
                                    onChange={handleChange}
                                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="Enrique">Enrique</option>
                                    <option value="Maria">María</option>
                                </select>
                            </div>
                            <div className="w-1/3">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Para (Destinatario)</label>
                                <select 
                                    name="Destinatario" 
                                    value={formulario.Destinatario} 
                                    onChange={handleChange}
                                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="Enrique">Enrique</option>
                                    <option value="Maria">María</option>
                                    <option value="Ambos">Ambos</option>
                                </select>
                            </div>
                            <div className="w-1/3 relative">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Asociar a Cliente (Opc.)</label>
                                
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por nombre o DNI..."
                                        value={busqueda}
                                        onChange={(e) => {
                                            setBusqueda(e.target.value);
                                            setShowDropdown(true);
                                            if (e.target.value === '') {
                                                setFormulario({...formulario, Dni_Cliente: ''});
                                            }
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                        className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    {formulario.Dni_Cliente && (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setFormulario({...formulario, Dni_Cliente: ''});
                                                setBusqueda('');
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 font-bold"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>

                                {showDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 shadow-lg rounded-md max-h-48 overflow-y-auto">
                                        {clientesFiltrados.length === 0 ? (
                                            <div className="p-2 text-sm text-slate-500">No hay atajos...</div>
                                        ) : (
                                            clientesFiltrados.map(c => (
                                                <div 
                                                    key={c.Dni}
                                                    className="p-2 text-sm hover:bg-slate-100 cursor-pointer"
                                                    onClick={() => {
                                                        setFormulario({...formulario, Dni_Cliente: c.Dni});
                                                        setBusqueda(c.Nombre);
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    {c.Nombre} <span className="text-slate-400 text-xs">({c.Dni})</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <textarea 
                                name="Texto"
                                required
                                rows={3}
                                value={formulario.Texto}
                                onChange={handleChange}
                                placeholder="Escribe la tarea o comentario aquí..."
                                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            ></textarea>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" variant="primary">Añadir Tarea</Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Listado de Notas */}
            {loading ? (
                <div className="text-center py-8 text-slate-400">Cargando tareas...</div>
            ) : notas.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-500">
                    No hay tareas pendientes en el tablón.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notas.map(nota => (
                        <div key={nota.Id_Nota} className="bg-[#fff9c4] rounded-xl p-5 shadow-sm border border-[#f0e68c] flex flex-col relative transition-all hover:shadow-md transform hover:-translate-y-1">
                            {/* Header del post-it */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                                        Para: {nota.Destinatario}
                                    </span>
                                    <span className="text-[10px] text-amber-700/70 flex items-center mt-1">
                                        <User size={10} className="mr-1" /> De: {nota.Creador}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => handleEliminar(nota.Id_Nota)}
                                    className="text-amber-600 hover:text-red-600 hover:bg-amber-200/50 p-1.5 rounded-full transition-colors"
                                    title="Marcar como leída y eliminar"
                                >
                                    <CheckCircle size={18} />
                                </button>
                            </div>
                            
                            {/* Cuerpo de la nota */}
                            <div className="flex-grow whitespace-pre-wrap text-sm text-slate-800 mb-4 font-medium leading-relaxed">
                                {nota.Texto}
                            </div>

                            {/* Footer del post-it */}
                            <div className="mt-auto border-t border-amber-900/10 pt-3 flex flex-col gap-1.5">
                                {nota.Dni_Cliente && (
                                    <div className="text-xs">
                                        <span className="text-amber-800 font-semibold mr-1">Cliente:</span>
                                        <Link to={`/clientes/${nota.Dni_Cliente}`} className="text-indigo-600 hover:underline hover:text-indigo-800 font-medium">
                                            {nota.Nombre_Cliente}
                                        </Link>
                                    </div>
                                )}
                                <div className="text-[10px] text-amber-700/60 flex items-center justify-end">
                                    <Clock size={10} className="mr-1" /> {formatearFecha(nota.Fecha_Creacion)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TablonNotas;
