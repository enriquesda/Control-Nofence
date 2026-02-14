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

            <HistorialEquiposCliente equipos={equipos} />
        </div>
    );
};

const HistorialEquiposCliente = ({ equipos }) => {
    const [groupedHistory, setGroupedHistory] = useState({});

    useEffect(() => {
        const fetchAllHistory = async () => {
            if (!equipos || equipos.length === 0) return;

            try {
                const { getHistorialEquipos } = await import('../../../api');

                let allHistory = [];
                const promises = equipos.map(eq => getHistorialEquipos({ id_equipo: eq.Id_Equipo }));
                const results = await Promise.all(promises);

                results.forEach(res => {
                    if (res.data) allHistory = [...allHistory, ...res.data];
                });

                // Group by equipment
                const grouped = {};
                equipos.forEach(eq => {
                    const eqHistory = allHistory.filter(h => h.Id_Equipo === eq.Id_Equipo);
                    // Sort descending by date
                    eqHistory.sort((a, b) => new Date(b.Fecha_Cambio) - new Date(a.Fecha_Cambio));
                    if (eqHistory.length > 0) {
                        grouped[eq.Id_Equipo] = {
                            nombre: eq.Nombre,
                            historial: eqHistory
                        };
                    }
                });

                setGroupedHistory(grouped);
            } catch (err) {
                console.error("Error fetching history", err);
            }
        };

        fetchAllHistory();
    }, [equipos]);

    if (Object.keys(groupedHistory).length === 0) return null;

    return (
        <Card className="mt-8">
            <h4 className="font-bold text-slate-700 mb-6 border-b pb-2">Historial de Cambios (Equipos)</h4>
            <div className="space-y-6">
                {Object.values(groupedHistory).map((item, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                        <h5 className="font-bold text-slate-800 mb-3">{item.nombre}</h5>
                        <div className="relative">
                            <div className="absolute top-3 left-0 w-full h-0.5 bg-slate-200 -z-0"></div>
                            <div className="flex space-x-8 overflow-x-auto pb-4 pt-1 px-1 relative z-10">
                                {item.historial.map((h, hIdx) => (
                                    <div key={hIdx} className="flex-shrink-0 flex flex-col items-center">
                                        <div className="w-4 h-4 rounded-full bg-primary-500 border-2 border-white shadow-sm mb-2"></div>
                                        <div className="bg-white p-2 rounded shadow-sm border border-slate-100 min-w-[140px] text-center">
                                            <div className="text-xs font-bold text-slate-700 mb-1">
                                                {new Date(h.Fecha_Cambio).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mb-1">
                                                {new Date(h.Fecha_Cambio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="flex items-center justify-center space-x-1 text-xs">
                                                <span className="text-slate-500 line-through text-[10px]">{h.Estado_Anterior}</span>
                                                <span className="text-primary-500">➜</span>
                                                <span className="font-medium text-slate-800">{h.Estado_Nuevo}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

export default GestionEquipos;

