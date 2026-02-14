import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import ModalEquipo from '../../equipos/ModalEquipo';
import { getEquipos, addEquipo, deleteEquipo, updateEquipoStatus } from '../../../api';

/**
 * Pestaña de gestión de equipos para un cliente específico.
 * Permite listar, añadir, editar y cambiar estado de los equipos.
 */
const GestionEquipos = ({ dni }) => {
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEquipo, setEditingEquipo] = useState(null);

    const fetchEquipos = async () => {
        try {
            setLoading(true);
            const res = await getEquipos({ dni_cliente: dni });
            setEquipos(res.data);
        } catch (error) {
            console.error("Error cargando equipos del cliente:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEquipos();
    }, [dni]);

    const handleSave = async (data) => {
        try {
            if (editingEquipo) {
                // Editar (Usamos updateEquipoStatus que en backend actualiza todo)
                await updateEquipoStatus(editingEquipo.Id_Equipo, data);
            } else {
                // Crear
                await addEquipo(dni, { ...data, Dni_Cliente: dni });
            }
            setShowModal(false);
            setEditingEquipo(null);
            fetchEquipos();
        } catch (error) {
            console.error("Error guardando equipo:", error);
            alert("Error al guardar el equipo.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este equipo?")) return;
        try {
            await deleteEquipo(id);
            fetchEquipos();
        } catch (error) {
            console.error("Error eliminando equipo:", error);
            alert("Error al eliminar el equipo.");
        }
    };

    const openEdit = (equipo) => {
        setEditingEquipo(equipo);
        setShowModal(true);
    };

    const openNew = () => {
        setEditingEquipo(null);
        setShowModal(true);
    };

    // Helper para badge de estado
    const getStatusVariant = (status) => {
        switch (status) {
            case 'espera': return 'default';
            case 'pedido': return 'primary';
            case 'pagado': return 'success';
            case 'en oficina': return 'warning';
            case 'enviado': return 'purple';
            case 'revicido': return 'success';
            default: return 'default';
        }
    };

    if (loading) return <div className="text-center py-8 text-slate-500">Cargando equipos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-700">Equipos del Cliente</h3>
                <Button onClick={openNew}>
                    <Plus size={18} className="mr-2" />
                    Añadir Equipo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipos.map(eq => (
                    <Card key={eq.Id_Equipo} className="relative group hover:shadow-md transition-shadow">
                        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(eq)} className="p-1 text-slate-400 hover:text-primary-600">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(eq.Id_Equipo)} className="p-1 text-slate-400 hover:text-red-600">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="mb-2 flex items-start justify-between">
                            <div>
                                <h4 className="font-bold text-slate-800">{eq.Nombre}</h4>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{eq.Categoria}</span>
                            </div>
                        </div>

                        <div className="space-y-2 mt-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Estado:</span>
                                <Badge variant={getStatusVariant(eq.Estado)}>{eq.Estado}</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Precio:</span>
                                <span className="font-mono font-medium">{eq.Precio ? `€${eq.Precio}` : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Fecha Estado:</span>
                                <span className="text-xs text-slate-600 flex items-center">
                                    <Clock size={12} className="mr-1" />
                                    {eq.Fecha_Estado ? new Date(eq.Fecha_Estado).toLocaleDateString() : '-'}
                                </span>
                            </div>
                            {eq.Notas && (
                                <div className="pt-2 text-xs text-slate-500 border-t border-slate-100 mt-2">
                                    {eq.Notas}
                                </div>
                            )}
                        </div>
                    </Card>
                ))}

                {equipos.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        Este cliente no tiene equipos asignados.
                    </div>
                )}
            </div>

            <ModalEquipo
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                initialData={editingEquipo}
            />
        </div>
    );
};

export default GestionEquipos;
