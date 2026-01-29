import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClientes, getDashboard, createCliente, deleteCliente, updateCliente, updateKit, addAcuerdo, updateAcuerdo, deleteAcuerdo } from '../api';
import { ArrowLeft, Plus, Check, AlertCircle, FileText, Send, PenTool, Trash2, User, Gift, DollarSign, Info, MapPin, Save, CheckSquare, AlertTriangle, Square, Clock } from 'lucide-react';
import InvoiceManager from './InvoiceManager';

const ClientDetail = () => {
    const { dni } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [showClosureModal, setShowClosureModal] = useState(false);
    const [showAcuerdoModal, setShowAcuerdoModal] = useState(false);
    const [newAcuerdo, setNewAcuerdo] = useState({ Numero_Acuerdo: '', Tipo: 'GA', Importe: 0, Fecha_Aprobacion: '' });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const res = await getClientes();
        const data = res.data.find(c => c.Dni === dni);
        setClient(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [dni]);

    // Calcular saldo y totales
    const totalAcuerdos = client?.acuerdos ? client.acuerdos.reduce((acc, curr) => acc + (curr.Importe || 0), 0) : 0;
    const importeBono = client?.Importe_Bono || 0;
    const saldoRestante = importeBono - totalAcuerdos;
    const isKitCompleted = importeBono > 0 && saldoRestante <= 0;

    const handleUpdateClient = async (e) => {
        e.preventDefault();
        // Helper para valores numéricos opcionales
        const parseOptionalFloat = (val) => val ? parseFloat(val) : null;

        const payload = {
            Nombre: client.Nombre,
            Telefono: client.Telefono ? String(client.Telefono) : '',
            Email: client.Email,
            Calle: client.Calle || null,
            Localidad: client.Localidad || null,
            Provincia: client.Provincia || null,
            Codigo_Postal: client.Codigo_Postal ? String(client.Codigo_Postal) : null,
            Estado_Nofence: client.Estado_Nofence || null,
            Pedido_Nofence: client.Pedido_Nofence || null,
            Importe_Factura_Nofence: parseOptionalFloat(client.Importe_Factura_Nofence),
            Importe_Cobrado_Cliente: parseOptionalFloat(client.Importe_Cobrado_Cliente),
            Beneficio: parseOptionalFloat(client.Beneficio)
        };

        try {
            await updateCliente(dni, payload);
            fetchData();
            alert('Datos guardados correctamente');
        } catch (error) {
            console.error(error);
            const detail = error.response?.data?.detail;
            alert('Error al guardar: ' + (detail ? JSON.stringify(detail) : error.message));
        }
    };

    const handleUpdateKit = async (e) => {
        e.preventDefault();
        await updateKit(dni, client);
        fetchData();
        alert('Datos del bono actualizados');
    };

    const handleAddAcuerdo = async (e) => {
        e.preventDefault();
        // Auto-set Enviado=true by default
        const todayStr = new Date().toISOString().split('T')[0];
        const acuerdoToSend = {
            ...newAcuerdo,
            Enviado: true,
            Fecha_Envio: todayStr
        };

        await addAcuerdo(dni, acuerdoToSend);
        setShowAcuerdoModal(false);
        fetchData();
        setNewAcuerdo({ Numero_Acuerdo: '', Tipo: 'GA', Importe: 0, Fecha_Aprobacion: '' });
    };

    const handleToggleAcuerdo = async (id, field, currentValue) => {
        const newValue = !currentValue;
        const payload = { [field]: newValue };

        // Auto-set date if checking true
        const today = new Date().toISOString().split('T')[0];
        if (newValue) {
            if (field === 'Enviado') payload.Fecha_Envio = today;
            if (field === 'Firmado') payload.Fecha_Firma = today;
        } else {
            if (field === 'Enviado') payload.Fecha_Envio = null;
            if (field === 'Firmado') payload.Fecha_Firma = null;
        }

        await updateAcuerdo(id, payload);
        fetchData();
    };

    if (loading) return <div className="flex justify-center items-center h-64 text-slate-400">Cargando...</div>;
    if (!client) return <div>Cliente no encontrado</div>;

    const tabs = [
        { id: 'general', label: 'Datos Generales', icon: <User size={18} /> },
        { id: 'kit', label: 'Kit Digital & Acuerdos', icon: <Gift size={18} /> },
        { id: 'historial', label: 'Historial', icon: <Clock size={18} /> },
    ];

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <button onClick={() => navigate('/clientes')} className="flex items-center space-x-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors">
                <ArrowLeft size={20} />
                <span>Volver al listado</span>
            </button>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">{client.Nombre}</h2>
                    <div className="flex items-center space-x-4 mt-1 text-slate-500 font-medium">
                        <span>DNI: {client.Dni}</span>
                        {client.Localidad && (
                            <span className="flex items-center text-sm"><MapPin size={14} className="mr-1" /> {client.Localidad} ({client.Provincia})</span>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Estado Actual</div>
                    <span className="bg-primary-50 text-primary-700 px-4 py-1.5 rounded-full font-bold text-sm border border-primary-100">
                        {client.Estado}
                    </span>
                </div>
            </div>

            <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl mb-8">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-600 hover:bg-white/50'
                            }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in duration-300">
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card space-y-6">
                            <div>
                                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2 border-b pb-2">
                                    <Info size={20} className="text-primary-500" />
                                    <span>Información de Contacto</span>
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nombre Completo</label>
                                        <input type="text" className="input-field" value={client.Nombre} onChange={e => setClient({ ...client, Nombre: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Teléfono</label>
                                        <input type="text" className="input-field" value={client.Telefono} onChange={e => setClient({ ...client, Telefono: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
                                        <input type="email" className="input-field" value={client.Email} onChange={e => setClient({ ...client, Email: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2 border-b pb-2">
                                    <MapPin size={20} className="text-primary-500" />
                                    <span>Dirección Fiscal</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Calle / Dirección</label>
                                        <input type="text" className="input-field" value={client.Calle || ''} onChange={e => setClient({ ...client, Calle: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Localidad</label>
                                        <input type="text" className="input-field" value={client.Localidad || ''} onChange={e => setClient({ ...client, Localidad: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">CP</label>
                                        <input type="text" className="input-field" value={client.Codigo_Postal || ''} onChange={e => setClient({ ...client, Codigo_Postal: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Provincia</label>
                                        <input type="text" className="input-field" value={client.Provincia || ''} onChange={e => setClient({ ...client, Provincia: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleUpdateClient} className="btn-primary w-full flex items-center justify-center space-x-2">
                                <Save size={18} />
                                <span>Guardar Cambios General</span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'kit' && (
                    <div className="space-y-8">
                        <div className={`card ${isKitCompleted ? 'bg-green-50/50 border-green-100' : 'bg-blue-50/50 border-blue-100'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className={`text-lg font-bold ${isKitCompleted ? 'text-green-800' : 'text-blue-800'}`}>1. Bono Kit Digital</h3>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-slate-400 uppercase">Saldo Restante</div>
                                    <div className={`text-xl font-bold ${saldoRestante < 0 ? 'text-red-500' : (isKitCompleted ? 'text-green-600' : 'text-blue-600')}`}>
                                        {saldoRestante.toFixed(2)} €
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateKit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold uppercase mb-1 opacity-70 flex justify-between">
                                        <span>Número Bono</span>
                                        <span className="text-[10px] bg-primary-100 text-primary-700 px-2 rounded-full font-bold ml-2">
                                            {client.Estado}
                                        </span>
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
                                    <button type="submit" className={`btn-primary py-1 px-4 text-sm ${isKitCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Actualizar Bono</button>
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
                                        : <span>Fecha Límite para firmar Acuerdos (6 meses): <span className="font-bold ml-1">{client.Fecha_Limite_Acuerdos}</span></span>
                                    }
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4 pt-6 border-t border-blue-100">
                                <h3 className="text-lg font-bold text-slate-800">2. Acuerdos Asociados</h3>
                                {(!client.acuerdos || client.acuerdos.length < 2) && (
                                    <button onClick={() => setShowAcuerdoModal(true)} className="btn-secondary flex items-center space-x-2 text-sm">
                                        <Plus size={16} />
                                        <span>Nuevo Acuerdo</span>
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {client.acuerdos && client.acuerdos.map((acuerdo, idx) => (
                                    <div key={idx} className="card border-l-4 border-l-purple-500 bg-white">
                                        <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                                            <div className="flex-1 w-full">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <h4 className="text-sm font-bold text-slate-800">
                                                                Acuerdo {acuerdo.Numero_Acuerdo || '(Sin número)'}
                                                            </h4>
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${acuerdo.Tipo === 'GA' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                                                {acuerdo.Tipo || 'GA'}
                                                            </span>
                                                            <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${acuerdo.Firmado ? 'bg-green-100 text-green-700' :
                                                                acuerdo.Enviado ? 'bg-blue-100 text-blue-700' :
                                                                    acuerdo.Fecha_Aprobacion ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                                                        'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                {acuerdo.Firmado ? 'Firmado' :
                                                                    acuerdo.Enviado ? 'Enviado' :
                                                                        acuerdo.Fecha_Aprobacion ? 'Aprobado' : 'Borrador'}
                                                            </div>
                                                            {(!acuerdo.facturas || acuerdo.facturas.length === 0) && (
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm('¿Seguro que quieres eliminar este acuerdo?')) {
                                                                            await deleteAcuerdo(acuerdo.Id_Acuerdo);
                                                                            fetchData();
                                                                        }
                                                                    }}
                                                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                                    title="Eliminar Acuerdo"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-medium">{acuerdo.Tipo === 'GA' ? 'Gestión Agronómica' : 'Gestión Cinegética'}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold text-slate-900">{acuerdo.Importe} €</div>
                                                    </div>
                                                </div>
                                                {/* Editing Fields for Number/Date */}
                                                {/* Editing Fields for Number/Date */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 bg-slate-50 p-3 rounded-md">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nº Acuerdo</label>
                                                        <div className="flex space-x-2">
                                                            <input
                                                                type="text"
                                                                className="input-field text-sm py-1"
                                                                defaultValue={acuerdo.Numero_Acuerdo || ''}
                                                                id={`num-${acuerdo.Id_Acuerdo}`}
                                                                placeholder="Pendiente..."
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Aprobación</label>
                                                        <div className="flex space-x-2">
                                                            <input
                                                                type="date"
                                                                className="input-field text-sm py-1"
                                                                defaultValue={acuerdo.Fecha_Aprobacion || ''}
                                                                id={`date-${acuerdo.Id_Acuerdo}`}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const num = document.getElementById(`num-${acuerdo.Id_Acuerdo}`).value;
                                                                    const date = document.getElementById(`date-${acuerdo.Id_Acuerdo}`).value;
                                                                    updateAcuerdo(acuerdo.Id_Acuerdo, { Numero_Acuerdo: num, Fecha_Aprobacion: date }).then(() => {
                                                                        fetchData();
                                                                        alert('Datos del acuerdo actualizados');
                                                                    });
                                                                }}
                                                                className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
                                                                title="Guardar Nº y Fecha"
                                                            >
                                                                <Save size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-4 mb-2">
                                                    <div className="flex space-x-4 mt-2">
                                                        <label className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${acuerdo.Enviado ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${acuerdo.Enviado ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                                                {acuerdo.Enviado && <Check size={12} className="text-white" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={!!acuerdo.Enviado}
                                                                onChange={() => handleToggleAcuerdo(acuerdo.Id_Acuerdo, 'Enviado', acuerdo.Enviado)}
                                                            />
                                                            <span className="text-xs font-bold uppercase select-none">Enviado</span>
                                                        </label>

                                                        <label className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${acuerdo.Firmado ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${acuerdo.Firmado ? 'bg-green-600 border-green-600' : 'border-slate-300 bg-white'}`}>
                                                                {acuerdo.Firmado && <Check size={12} className="text-white" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={!!acuerdo.Firmado}
                                                                onChange={() => handleToggleAcuerdo(acuerdo.Id_Acuerdo, 'Firmado', acuerdo.Firmado)}
                                                            />
                                                            <span className="text-xs font-bold uppercase select-none">Firmado</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right min-w-[150px]">
                                                <div className="text-xs font-bold text-slate-400 uppercase">
                                                    {acuerdo.facturas && acuerdo.facturas.length > 0 ? "Límite Justificación" : "Límite Facturación"}
                                                </div>
                                                <div className={`text-sm font-bold ${acuerdo.facturas && acuerdo.facturas.length > 0 ? 'text-purple-600' : 'text-red-600'}`}>
                                                    {acuerdo.facturas && acuerdo.facturas.length > 0
                                                        ? (acuerdo.Fecha_Limite_Justificacion || '---')
                                                        : (acuerdo.Fecha_Limite_Factura || '---')
                                                    }
                                                </div>
                                            </div>
                                        </div>


                                        {/* Justificación - Only if invoices exist */}
                                        {acuerdo.facturas && acuerdo.facturas.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado Justificación</label>
                                                        <select
                                                            className={`input-field font-bold py-1.5 text-xs ${!acuerdo.Estado_Justificacion || acuerdo.Estado_Justificacion === 'Pendiente de captura' ? 'text-orange-600 bg-orange-50 border-orange-200' :
                                                                acuerdo.Estado_Justificacion === 'Enviada para firma' ? 'text-blue-600 bg-blue-50 border-blue-200' :
                                                                    'text-green-600 bg-green-50 border-green-200'
                                                                }`}
                                                            value={acuerdo.Estado_Justificacion || 'Pendiente de captura'}
                                                            onChange={async (e) => {
                                                                await updateAcuerdo(acuerdo.Id_Acuerdo, { Estado_Justificacion: e.target.value });
                                                                fetchData();
                                                            }}
                                                        >
                                                            <option value="Pendiente de captura">Pendiente de captura</option>
                                                            <option value="Enviada para firma">Enviada para firma</option>
                                                            <option value="Justificada">Justificada</option>
                                                        </select>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-bold text-slate-400 uppercase">Estado Global</div>
                                                        <div className="text-xs font-medium text-slate-600">
                                                            {acuerdo.Estado_Justificacion || 'Pendiente'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Facturas del acuerdo */}
                                        <div className="bg-slate-50 p-4 rounded-lg">
                                            <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Facturas de este Acuerdo</h5>
                                            <InvoiceManager
                                                dni={dni}
                                                acuerdo={acuerdo}
                                                onUpdate={fetchData}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {(!client.acuerdos || client.acuerdos.length === 0) && (
                                    <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                                        No hay acuerdos registrados para este bono.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'historial' && (
                    <div className="card">
                        <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
                            <Clock size={20} className="text-primary-500" />
                            <span>Historial del Cliente</span>
                        </h3>

                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-4">
                            {/* Generator History List */}
                            {(() => {
                                const events = [];

                                if (client.Fecha_Aprobacion_Bono) events.push({ date: client.Fecha_Aprobacion_Bono, title: 'Bono Kit Digital Aprobado', type: 'kit' });

                                client.acuerdos?.forEach(a => {
                                    if (a.Fecha_Envio) events.push({ date: a.Fecha_Envio, title: `Acuerdo ${a.Numero_Acuerdo || ''} Enviado`, type: 'acuerdo_envio' });
                                    if (a.Fecha_Firma) events.push({ date: a.Fecha_Firma, title: `Acuerdo ${a.Numero_Acuerdo || ''} Firmado`, type: 'acuerdo_firma' });
                                    if (a.Fecha_Aprobacion) events.push({ date: a.Fecha_Aprobacion, title: `Acuerdo ${a.Numero_Acuerdo || ''} Aprobado`, type: 'acuerdo_aprob' });

                                    a.facturas?.forEach(f => {
                                        if (f.Fecha_Emision) events.push({ date: f.Fecha_Emision, title: `Factura ${f.Numero_Factura_Real} Emitida`, type: 'factura_emision', amount: f.Importe });
                                        if (f.Fecha_Pago) events.push({ date: f.Fecha_Pago, title: `Factura ${f.Numero_Factura_Real} Pagada`, type: 'factura_pago' });
                                    });
                                });

                                // Sort descending
                                events.sort((a, b) => new Date(b.date) - new Date(a.date));

                                if (events.length === 0) return <div className="ml-6 text-slate-400 italic">No hay registros en el historial.</div>;

                                return events.map((ev, idx) => (
                                    <div key={idx} className="relative ml-6">
                                        <div className={`absolute -left-[31px] bg-white border-2 w-4 h-4 rounded-full ${ev.type.includes('pago') ? 'border-green-500 bg-green-500' :
                                            ev.type.includes('factura') ? 'border-purple-500' :
                                                ev.type.includes('firma') ? 'border-blue-500 bg-blue-500' :
                                                    'border-slate-400'
                                            }`}></div>
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-3 rounded-lg">
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 block mb-1">{ev.date}</span>
                                                <h4 className="text-sm font-bold text-slate-800">{ev.title}</h4>
                                            </div>
                                            {ev.amount && (
                                                <div className="text-sm font-bold text-slate-900 mt-2 sm:mt-0">{ev.amount} €</div>
                                            )}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Estado Actual Calculado</h4>
                            <div className="bg-primary-50 text-primary-800 p-4 rounded-xl text-center font-bold text-lg border border-primary-100">
                                {client.Estado}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showAcuerdoModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold mb-4">Añadir Nuevo Acuerdo</h3>
                        <form onSubmit={handleAddAcuerdo} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Acuerdo</label>
                                <select className="input-field" value={newAcuerdo.Tipo} onChange={e => setNewAcuerdo({ ...newAcuerdo, Tipo: e.target.value })}>
                                    <option value="GA">Gestión del Cambio (GA)</option>
                                    <option value="GC">Gestión de Clientes (GC)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Importe (€)</label>
                                <input required type="number" step="0.01" className="input-field" value={newAcuerdo.Importe} onChange={e => setNewAcuerdo({ ...newAcuerdo, Importe: parseFloat(e.target.value) })} />
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                                <Info size={14} className="inline mr-1 mb-0.5" />
                                Podrás añadir el Nº de Acuerdo y la Fecha de Aprobación más tarde, una vez firmado.
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button type="button" onClick={() => setShowAcuerdoModal(false)} className="btn-secondary flex-1">Cancelar</button>
                                <button type="submit" className="btn-primary flex-1">Añadir</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDetail;
