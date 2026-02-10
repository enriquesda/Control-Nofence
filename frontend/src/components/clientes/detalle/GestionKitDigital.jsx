import React, { useState } from 'react';
import { Gift, CheckSquare, Square, AlertTriangle, Send, PenTool, Plus, Save } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Badge from '../../ui/Badge';
import Modal from '../../ui/Modal';
import GestorFacturas from '../../GestorFacturas';

const GestionKitDigital = ({
    client,
    setClient,
    onUpdateKit,
    onAddAcuerdo,
    onToggleAcuerdo,
    onUpdateAcuerdo,
    fetchData,
    dni
}) => {
    const [showAcuerdoModal, setShowAcuerdoModal] = useState(false);
    const [newAcuerdo, setNewAcuerdo] = useState({
        Numero_Acuerdo: '',
        Tipo: 'GA',
        Importe: 0,
        Fecha_Aprobacion: '',
        Enviado: true,
        Fecha_Envio: new Date().toISOString().split('T')[0]
    });

    // Local state for inline editing of agreements
    const [editingAcuerdo, setEditingAcuerdo] = useState(null);

    // Calculations
    const totalAcuerdos = client?.acuerdos ? client.acuerdos.reduce((acc, curr) => acc + (curr.Importe || 0), 0) : 0;
    const importeBono = client?.Importe_Bono || 0;
    const saldoRestante = importeBono - totalAcuerdos;
    const isKitCompleted = importeBono > 0 && saldoRestante <= 0;

    const handleCreateAcuerdo = (e) => {
        e.preventDefault();
        onAddAcuerdo(newAcuerdo);
        setShowAcuerdoModal(false);
        setNewAcuerdo({
            Numero_Acuerdo: '',
            Tipo: 'GA',
            Importe: 0,
            Fecha_Aprobacion: '',
            Enviado: true,
            Fecha_Envio: new Date().toISOString().split('T')[0]
        });
    };

    const handleUpdateAcuerdoDetails = async (idAcuerdo, details) => {
        await onUpdateAcuerdo(idAcuerdo, details);
        setEditingAcuerdo(null);
        fetchData();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return dateStr;
        const parts = dateStr.split('-');
        return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
    };

    return (
        <div className="space-y-8">
            {/* --- KIT DIGITAL SECTION --- */}
            <Card className={`${isKitCompleted ? 'bg-green-50/50 border-green-100' : 'bg-blue-50/50 border-blue-100'}`}>
                <div className="flex justify-between items-start mb-4">
                    <h3 className={`text-lg font-bold ${isKitCompleted ? 'text-green-800' : 'text-blue-800'}`}>1. Bono Kit Digital</h3>
                    <div className="text-right">
                        <div className="text-xs font-bold text-slate-400 uppercase">Saldo Restante</div>
                        <div className={`text-xl font-bold ${saldoRestante < 0 ? 'text-red-500' : (isKitCompleted ? 'text-green-600' : 'text-blue-600')}`}>
                            {saldoRestante.toFixed(2)} €
                        </div>
                    </div>
                </div>

                <form onSubmit={onUpdateKit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-semibold uppercase mb-1 opacity-70 flex justify-between">
                            <span>Número Bono</span>
                            <Badge>{client.Estado}</Badge>
                        </label>
                        <input type="text" className="input-field bg-white/50" value={client.Numero_Bono || ''} onChange={e => setClient({ ...client, Numero_Bono: e.target.value })} placeholder="Ej: 2025/C022/..." />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase mb-1 opacity-70">Importe Bono (€)</label>
                        <input type="number" step="0.01" className="input-field bg-white/50" value={client.Importe_Bono || ''} onChange={e => setClient({ ...client, Importe_Bono: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase mb-1 opacity-70">Fecha Aprobación</label>
                        <input type="date" className="input-field bg-white/50" value={client.Fecha_Aprobacion_Bono || ''} onChange={e => setClient({ ...client, Fecha_Aprobacion_Bono: e.target.value })} />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                        <Button type="submit" variant="primary" className={isKitCompleted ? '!bg-green-600' : '!bg-blue-600'}>
                            Actualizar Bono
                        </Button>
                    </div>
                </form>

                {client.Fecha_Limite_Acuerdos && (
                    <div className={`mt-4 flex items-center text-sm p-2 rounded-lg border w-fit font-medium 
                        ${isKitCompleted
                            ? 'text-green-700 bg-green-100 border-green-200'
                            : 'text-orange-600 bg-orange-50 border-orange-100'}`}>

                        {isKitCompleted ? <CheckSquare size={16} className="mr-2" /> : <AlertTriangle size={16} className="mr-2" />}

                        {isKitCompleted
                            ? <span>Kit Digital Completado (Saldo Usado)</span>
                            : <span>Fecha Límite para firmar Acuerdos (6 meses): <span className="font-bold ml-1">{formatDate(client.Fecha_Limite_Acuerdos)}</span></span>
                        }
                    </div>
                )}
            </Card>

            {/* --- ACUERDOS SECTION --- */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                        2. Acuerdos y Justificaciones
                    </h3>
                    <Button onClick={() => setShowAcuerdoModal(true)}>
                        <Plus size={18} />
                        <span>Añadir Acuerdo</span>
                    </Button>
                </div>

                <div className="space-y-4">
                    {client.acuerdos && client.acuerdos.map((acuerdo, idx) => (
                        <Card key={idx} className="relative group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h4 className="font-bold text-lg text-slate-800">
                                            {acuerdo.Numero_Acuerdo || `Acuerdo #${idx + 1}`}
                                        </h4>
                                        <Badge variant={acuerdo.Tipo === 'GA' ? 'info' : 'purple'}>{acuerdo.Tipo}</Badge>
                                        <button
                                            onClick={() => setEditingAcuerdo(editingAcuerdo === acuerdo.Id_Acuerdo ? null : acuerdo.Id_Acuerdo)}
                                            className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                                            title="Editar datos del acuerdo"
                                        >
                                            <PenTool size={14} />
                                        </button>
                                    </div>
                                    <div className="text-slate-500 text-xs">Fecha Aprobación: <span className="font-medium text-slate-700">{formatDate(acuerdo.Fecha_Aprobacion) || '-'}</span></div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-xl text-slate-800">{acuerdo.Importe} €</div>
                                </div>
                            </div>

                            {/* Inline Editing for Number/Date */}
                            {editingAcuerdo === acuerdo.Id_Acuerdo && (
                                <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-blue-100 animate-in fade-in slide-in-from-top-2">
                                    <h5 className="text-xs font-bold text-blue-800 uppercase mb-3">Editar Datos Acuerdo</h5>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.target);
                                            handleUpdateAcuerdoDetails(acuerdo.Id_Acuerdo, {
                                                Numero_Acuerdo: formData.get('Numero_Acuerdo'),
                                                Fecha_Aprobacion: formData.get('Fecha_Aprobacion')
                                            });
                                        }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                    >
                                        <Input name="Numero_Acuerdo" label="Nº Acuerdo" defaultValue={acuerdo.Numero_Acuerdo} />
                                        <div className="flex items-end gap-2">
                                            <Input name="Fecha_Aprobacion" label="Fecha Aprobación" type="date" defaultValue={acuerdo.Fecha_Aprobacion} />
                                            <Button type="submit" className="mb-[2px]"><Save size={16} /></Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Status Bar */}
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-3 rounded-lg text-sm">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase mb-1">1. Enviar</span>
                                    <div className={`font-bold ${acuerdo.Enviado ? 'text-green-600' : 'text-slate-400'}`}>
                                        {acuerdo.Enviado ? (
                                            <button onClick={() => onToggleAcuerdo(acuerdo.Id_Acuerdo, 'Enviado', false)} className="flex items-center hover:text-red-500 transition-colors" title="Desmarcar"><CheckSquare size={14} className="mr-1" /> Enviado</button>
                                        ) : (
                                            <button onClick={() => onToggleAcuerdo(acuerdo.Id_Acuerdo, 'Enviado', true)} className="flex items-center hover:text-blue-600 transition-colors" title="Marcar Enviado"><Square size={14} className="mr-1" /> Enviado</button>
                                        )}
                                    </div>
                                    {acuerdo.Fecha_Envio && <span className="text-[10px] text-slate-500">{formatDate(acuerdo.Fecha_Envio)}</span>}
                                </div>

                                <div className="flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase mb-1">2. Firma</span>
                                    <div className={`font-bold ${acuerdo.Firmado ? 'text-green-600' : 'text-slate-400'}`}>
                                        {acuerdo.Firmado ? (
                                            <button onClick={() => onToggleAcuerdo(acuerdo.Id_Acuerdo, 'Firmado', false)} className="flex items-center hover:text-red-500 transition-colors" title="Desmarcar"><CheckSquare size={14} className="mr-1" /> Firmado</button>
                                        ) : (
                                            <button onClick={() => onToggleAcuerdo(acuerdo.Id_Acuerdo, 'Firmado', true)} className="flex items-center hover:text-blue-600 transition-colors" title="Marcar Firmado"><Square size={14} className="mr-1" /> Firmado</button>
                                        )}
                                    </div>
                                    {acuerdo.Fecha_Firma && <span className="text-[10px] text-slate-500">{formatDate(acuerdo.Fecha_Firma)}</span>}
                                </div>

                                <div className="flex flex-col items-center justify-center text-center border-l border-slate-200 pl-4 md:col-span-2 lg:col-span-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase mb-1">3. Estado Justificación</span>
                                    <select
                                        className={`text-xs font-bold border rounded px-2 py-1 outline-none transition-colors
                                            ${!acuerdo.Estado_Justificacion || acuerdo.Estado_Justificacion === 'Pendiente de captura' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                                acuerdo.Estado_Justificacion === 'Enviada para firma' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                                    'bg-green-50 border-green-200 text-green-700'}`}
                                        value={acuerdo.Estado_Justificacion || 'Pendiente de captura'}
                                        onChange={(e) => {
                                            onUpdateAcuerdo(acuerdo.Id_Acuerdo, { Estado_Justificacion: e.target.value });
                                            fetchData();
                                        }}
                                    >
                                        <option value="Pendiente de captura">Pendiente</option>
                                        <option value="Enviada para firma">Enviada</option>
                                        <option value="Justificada">Justificada</option>
                                    </select>
                                </div>
                            </div>

                            {/* Invoices */}
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <h5 className="text-xs font-bold text-slate-400 uppercase mb-3">Facturación asociada</h5>
                                <GestorFacturas
                                    dni={dni}
                                    facturas={acuerdo.facturas}
                                    acuerdo={acuerdo}
                                    onUpdate={fetchData}
                                />
                            </div>
                        </Card>
                    ))}
                    {(!client.acuerdos || client.acuerdos.length === 0) && (
                        <div className="text-center py-10 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            No hay acuerdos creados para este cliente
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Nuevo Acuerdo */}
            <Modal isOpen={showAcuerdoModal} onClose={() => setShowAcuerdoModal(false)} title="Nuevo Acuerdo">
                <form onSubmit={handleCreateAcuerdo} className="space-y-4">
                    <Input
                        label="Número Acuerdo"
                        value={newAcuerdo.Numero_Acuerdo}
                        onChange={e => setNewAcuerdo({ ...newAcuerdo, Numero_Acuerdo: e.target.value })}
                        required
                    />
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                        <select
                            className="input-field"
                            value={newAcuerdo.Tipo}
                            onChange={e => setNewAcuerdo({ ...newAcuerdo, Tipo: e.target.value })}
                        >
                            <option value="GA">GA - Gestión Administrativa</option>
                            <option value="GC">GC - Gestión Campo / Hardware</option>
                        </select>
                    </div>
                    <Input
                        label="Importe (€)"
                        type="number"
                        value={newAcuerdo.Importe}
                        onChange={e => setNewAcuerdo({ ...newAcuerdo, Importe: parseFloat(e.target.value) })}
                        required
                    />
                    <Input
                        label="Fecha Aprobación"
                        type="date"
                        value={newAcuerdo.Fecha_Aprobacion}
                        onChange={e => setNewAcuerdo({ ...newAcuerdo, Fecha_Aprobacion: e.target.value })}
                        required
                    />

                    <div className="flex space-x-3 pt-4">
                        <Button variant="secondary" onClick={() => setShowAcuerdoModal(false)} className="flex-1">Cancelar</Button>
                        <Button type="submit" className="flex-1">Añadir</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GestionKitDigital;
