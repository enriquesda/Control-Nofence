import React, { useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Badge from '../../ui/Badge';

const GestionNofence = ({ client, setClient, onUpdate, dni }) => {
    const [newCollar, setNewCollar] = useState('');

    const collares = client.Collares ? JSON.parse(client.Collares) : [];

    const addCollar = async (e) => {
        e.preventDefault();
        if (!newCollar.trim()) return;
        const updatedCollares = [...collares, newCollar.trim()];
        await setClient({ ...client, Collares: JSON.stringify(updatedCollares) });
        // Trigger update immediately or let parent handle?
        // Ideally we update local state and call onUpdate, but setClient updates local.
        // We need to persist. 
        // For simplicity, let's assume onUpdate persists the current 'client' state or we pass the payload.
        // But 'client' state in parent might not be updated yet if we just called setClient.
        // Better:
        const payload = { Collares: JSON.stringify(updatedCollares) };
        // We need to call persistence.
        // Passing a dedicated persist function or reusing onUpdate with specific payload would be cleaner.
        // Let's assume onUpdate handles the full client object, so we need to wait for state? 
        // No, better to pass the change to generic update function if available, or just use the passed onUpdate (which saves the whole client).
        // Let's try to update client state locally then call save.

        // Actually, the parent handleUpdateClient uses 'client' state. So we must setClient BUT also trigger save.
        // React batching might be an issue if we just call onUpdate(e).
        // Let's modify the parent to accept a payloadOverride or similar.
        // Or simpler: We just call the API directly here for atomic updates?
        // For now, let's reuse the pattern: Update local state, then user clicks "Save" or we trigger a specific save.
        // User requested "Auto-save" for some fields. 
        // Let's just update local state and let user click huge "Guardar" button or auto-save?
        // Current implementation in ClientDetail has a "Guardar Cambios General" but Nofence might need its own.
        // Let's add a "Guardar" button in this tab for Nofence specific data.

        // However, for adding lists items, usually it's instant.
        // Let's force a persist here.
        // We can't easily call the parent's handleUpdateClient without the updated state.
        // So we will call setClient AND call onUpdate with the explicit new value.

        // Actually, let's clean this up. We will expose a specific "updateClientField" prop if possible.
        // If not, we'll just update local state and have a Save button for the whole tab.

        setClient(prev => ({ ...prev, Collares: JSON.stringify(updatedCollares) }));
        setNewCollar('');
    };

    const removeCollar = (idx) => {
        const updatedCollares = collares.filter((_, i) => i !== idx);
        setClient(prev => ({ ...prev, Collares: JSON.stringify(updatedCollares) }));
    };

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-lg font-bold mb-4 border-b pb-2">Estado y Pagos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado Nofence</label>
                        <select
                            className="input-field"
                            value={client.Estado_Nofence || ''}
                            onChange={e => setClient({ ...client, Estado_Nofence: e.target.value })}
                        >
                            <option value="">- Seleccionar -</option>
                            <option value="Avisar a Nofence">Avisar a Nofence</option>
                            <option value="Pago pendiente">Pago pendiente</option>
                            <option value="Pago realizado">Pago realizado</option>
                            <option value="Collares pedidos">Collares pedidos</option>
                        </select>
                    </div>
                    <Input
                        label="Importe Pago Nofence (€)"
                        type="number"
                        value={client.Importe_Nofence || ''}
                        onChange={e => setClient({ ...client, Importe_Nofence: parseFloat(e.target.value) })}
                    />
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={onUpdate}>Guardar Cambios Nofence</Button>
                </div>
            </Card>

            {/* Collares */}
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Gestión de Collares</h3>
                    <Badge variant="primary">{collares.length} Collares</Badge>
                </div>

                <div className="flex space-x-2 mb-4">
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Añadir número de collar..."
                        value={newCollar}
                        onChange={e => setNewCollar(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCollar(e)}
                    />
                    <Button onClick={addCollar}>
                        <Plus size={18} />
                    </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto">
                    {collares.map((collar, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded px-3 py-2 flex justify-between items-center text-sm font-mono">
                            <span>{collar}</span>
                            <button onClick={() => removeCollar(idx)} className="text-slate-400 hover:text-red-500">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {collares.length === 0 && <div className="col-span-full text-center text-slate-400 italic py-4">No hay collares registrados</div>}
                </div>
            </Card>

            {/* Coordenadas */}
            <Card>
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2 border-b pb-2">
                    <MapPin size={20} className="text-primary-500" />
                    <span>Coordenadas GPS</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Latitud (X)"
                        type="number"
                        value={client.Coordenadas_X || ''}
                        onChange={e => setClient({ ...client, Coordenadas_X: parseFloat(e.target.value) })}
                        onBlur={onUpdate} // Auto-save
                        step="any"
                    />
                    <Input
                        label="Longitud (Y)"
                        type="number"
                        value={client.Coordenadas_Y || ''}
                        onChange={e => setClient({ ...client, Coordenadas_Y: parseFloat(e.target.value) })}
                        onBlur={onUpdate} // Auto-save
                        step="any"
                    />
                </div>
            </Card>
        </div>
    );
};

export default GestionNofence;
