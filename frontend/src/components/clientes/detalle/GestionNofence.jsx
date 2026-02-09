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
        const jsonCollares = JSON.stringify(updatedCollares);

        setClient(prev => ({ ...prev, Collares: jsonCollares }));
        onUpdate(null, { Collares: jsonCollares }); // Explicit save
        setNewCollar('');
    };

    const removeCollar = (idx) => {
        const updatedCollares = collares.filter((_, i) => i !== idx);
        const jsonCollares = JSON.stringify(updatedCollares);

        setClient(prev => ({ ...prev, Collares: jsonCollares }));
        onUpdate(null, { Collares: jsonCollares }); // Explicit save
    };

    const handleAutoSave = (field, value) => {
        onUpdate(null, { [field]: value });
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
                            onChange={e => {
                                const val = e.target.value;
                                setClient({ ...client, Estado_Nofence: val });
                                handleAutoSave('Estado_Nofence', val);
                            }}
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
                        onBlur={(e) => handleAutoSave('Importe_Nofence', parseFloat(e.target.value))}
                    />
                </div>
                {/* Save button kept for manual reassurance, but auto-save is active */}
                <div className="mt-4 flex justify-end">
                    <Button onClick={(e) => onUpdate(e, null)}>Guardar Cambios Nofence</Button>
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
                        onBlur={(e) => handleAutoSave('Coordenadas_X', parseFloat(e.target.value))}
                        step="any"
                    />
                    <Input
                        label="Longitud (Y)"
                        type="number"
                        value={client.Coordenadas_Y || ''}
                        onChange={e => setClient({ ...client, Coordenadas_Y: parseFloat(e.target.value) })}
                        onBlur={(e) => handleAutoSave('Coordenadas_Y', parseFloat(e.target.value))}
                        step="any"
                    />
                </div>
            </Card>
        </div>
    );
};

export default GestionNofence;
