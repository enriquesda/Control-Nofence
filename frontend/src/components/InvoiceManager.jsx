import React, { useState, useEffect } from 'react';
import { addFactura, updateFactura } from '../api';
import { Plus, List, CheckSquare, Square, FileText, Edit2 } from 'lucide-react';

const InvoiceManager = ({ dni, facturas = [], acuerdo, onUpdate, allowAdd = true }) => {
    // Mode determination
    const isSingleMode = !!acuerdo;

    // --- Single Mode State ---
    const agreementInvoice = isSingleMode && acuerdo.facturas && acuerdo.facturas.length > 0 ? acuerdo.facturas[0] : null;
    const [showCreate, setShowCreate] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // --- List Mode State ---
    const [showAddList, setShowAddList] = useState(false);

    // Shared State for New/Edit Invoice Form
    const [invoiceForm, setInvoiceForm] = useState({
        Numero_Factura_Real: '',
        Concepto: '',
        Importe: 0,
        Fecha_Emision: new Date().toISOString().split('T')[0],
        Estado_Pago: 'Pendiente',
        Fecha_Pago: ''
    });

    // Reset/Pre-fill form for Creation
    useEffect(() => {
        if (isSingleMode && showCreate && acuerdo) {
            setInvoiceForm({
                Numero_Factura_Real: '',
                Concepto: acuerdo.Numero_Acuerdo ? String(acuerdo.Numero_Acuerdo) : 'Acuerdo sin número',
                Importe: acuerdo.Importe ? parseFloat(acuerdo.Importe) : 0,
                Fecha_Emision: new Date().toISOString().split('T')[0],
                Estado_Pago: 'Pendiente',
                Fecha_Pago: ''
            });
        }
    }, [isSingleMode, showCreate, acuerdo]);

    // Reset/Pre-fill form for Editing
    useEffect(() => {
        if (isEditing && agreementInvoice) {
            setInvoiceForm({
                Numero_Factura_Real: agreementInvoice.Numero_Factura_Real,
                Concepto: agreementInvoice.Concepto,
                Importe: parseFloat(agreementInvoice.Importe),
                Fecha_Emision: agreementInvoice.Fecha_Emision,
                Estado_Pago: agreementInvoice.Estado_Pago,
                Fecha_Pago: agreementInvoice.Fecha_Pago || ''
            });
        }
    }, [isEditing, agreementInvoice]);


    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Construct clean payload
            const payload = {
                Numero_Factura_Real: String(invoiceForm.Numero_Factura_Real),
                Concepto: String(invoiceForm.Concepto),
                Importe: parseFloat(invoiceForm.Importe) || 0,
                Fecha_Emision: invoiceForm.Fecha_Emision,
                Estado_Pago: invoiceForm.Estado_Pago,
            };

            // Handle Payment Date logic
            if (invoiceForm.Estado_Pago === 'Pagado') {
                payload.Fecha_Pago = invoiceForm.Fecha_Pago || new Date().toISOString().split('T')[0];
            } else {
                payload.Fecha_Pago = null;
            }

            if (isEditing && agreementInvoice) {
                // Update existing invoice
                await updateFactura(agreementInvoice.Id_Factura, payload);
                setIsEditing(false);
            } else {
                // Create new invoice
                if (isSingleMode) {
                    payload.Id_Acuerdo = acuerdo.Id_Acuerdo;
                }
                await addFactura(dni, payload);

                // Auto-update Nofence status to "Avisar a Nofence" when first invoice is created
                try {
                    const { updateCliente } = await import('../api');
                    const { getClientes } = await import('../api');
                    const clientsRes = await getClientes();
                    const currentClient = clientsRes.data.find(c => c.Dni === dni);

                    if (currentClient && !currentClient.Estado_Nofence) {
                        await updateCliente(dni, { Estado_Nofence: 'Avisar a Nofence' });
                    }
                } catch (err) {
                    console.log('Could not auto-update Nofence status:', err);
                }

                setShowCreate(false);
                setShowAddList(false);
            }

            // Clean form state
            setInvoiceForm({
                Numero_Factura_Real: '',
                Concepto: '',
                Importe: 0,
                Fecha_Emision: new Date().toISOString().split('T')[0],
                Estado_Pago: 'Pendiente',
                Fecha_Pago: ''
            });

            onUpdate();
        } catch (error) {
            console.error("Error saving invoice:", error);
            if (error.response && error.response.data) {
                alert(`Error: ${JSON.stringify(error.response.data)}`);
            } else {
                alert("Error al guardar la factura");
            }
        }
    };

    // --- RENDER: Single Invoice Mode (Agreement Context) ---
    if (isSingleMode) {
        if (agreementInvoice && !isEditing) {
            // View Existing Invoice (Read Only)
            return (
                <div className="bg-white border rounded-lg p-3 flex justify-between items-center shadow-sm relative group">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${agreementInvoice.Estado_Pago === 'Pagado' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            <FileText size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 text-sm">Factura {agreementInvoice.Numero_Factura_Real}</div>
                            <div className="text-xs text-slate-500">{agreementInvoice.Fecha_Emision} • {agreementInvoice.Concepto}</div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <div className="font-bold text-slate-900">{agreementInvoice.Importe.toLocaleString()} €</div>
                            <div className={`text-xs font-bold uppercase ${agreementInvoice.Estado_Pago === 'Pagado' ? 'text-green-600' : 'text-orange-600'}`}>
                                {agreementInvoice.Estado_Pago}
                            </div>
                            {agreementInvoice.Estado_Pago === 'Pagado' && agreementInvoice.Fecha_Pago && (
                                <div className="text-[10px] text-green-700 font-medium">
                                    Pagado el: {agreementInvoice.Fecha_Pago}
                                </div>
                            )}
                        </div>

                        {/* Edit Button - Now inline */}
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors shadow-sm"
                            title="Editar Factura"
                        >
                            <Edit2 size={16} />
                        </button>
                    </div>
                </div>
            );
        }

        if (showCreate || isEditing) {
            // Create / Edit Invoice Form
            return (
                <form onSubmit={handleSubmit} className="bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in fade-in">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
                        {isEditing ? <Edit2 size={14} className="mr-1" /> : <Plus size={14} className="mr-1" />}
                        {isEditing ? "Editar Factura" : "Generar Factura para Acuerdo"}
                    </h4>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Concepto (Auto)</label>
                            <input type="text" disabled className="input-field bg-slate-100 text-slate-500" value={invoiceForm.Concepto} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Importe (Auto)</label>
                            <div className="input-field bg-slate-100 text-slate-500">{invoiceForm.Importe} €</div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nº Factura</label>
                            <input
                                required
                                type="text"
                                className="input-field"
                                value={invoiceForm.Numero_Factura_Real}
                                onChange={e => setInvoiceForm({ ...invoiceForm, Numero_Factura_Real: e.target.value })}
                                placeholder="Ej: F-2025-01"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha Emisión</label>
                            <input
                                required
                                type="date"
                                className="input-field"
                                value={invoiceForm.Fecha_Emision}
                                onChange={e => setInvoiceForm({ ...invoiceForm, Fecha_Emision: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado Pago</label>
                            <select
                                className="input-field"
                                value={invoiceForm.Estado_Pago}
                                onChange={e => setInvoiceForm({ ...invoiceForm, Estado_Pago: e.target.value })}
                            >
                                <option>Pendiente</option>
                                <option>Pagado</option>
                            </select>
                        </div>

                        {invoiceForm.Estado_Pago === 'Pagado' && (
                            <div className="col-span-2 animate-in slide-in-from-top-1 fade-in">
                                <label className="block text-[10px] font-bold text-green-600 uppercase mb-1">Fecha de Pago</label>
                                <input
                                    type="date"
                                    className="input-field border-green-200 focus:border-green-500 focus:ring-green-500"
                                    value={invoiceForm.Fecha_Pago}
                                    onChange={e => setInvoiceForm({ ...invoiceForm, Fecha_Pago: e.target.value })}
                                />
                                <div className="text-[10px] text-slate-400 mt-1 italic">Si se deja vacío, se usará la fecha de hoy.</div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => { setShowCreate(false); setIsEditing(false); }} className="px-3 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded">Cancelar</button>
                        <button type="submit" className="px-3 py-1 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded shadow-sm">
                            {isEditing ? "Actualizar" : "Guardar Factura"}
                        </button>
                    </div>
                </form>
            );
        }

        // Empty State - Show "Create" Button (ONLY if Approved)
        const isApproved = acuerdo && acuerdo.Fecha_Aprobacion;

        if (!isApproved) {
            return (
                <div className="flex justify-start items-center space-x-2 text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                    <span className="font-medium italic">Pendiente de aprobación para facturar</span>
                </div>
            );
        }

        return (
            <div className="flex justify-start">
                <button onClick={() => setShowCreate(true)} className="btn-primary py-1.5 px-3 text-xs flex items-center space-x-1 shadow-sm">
                    <Plus size={14} />
                    <span>Generar Factura</span>
                </button>
            </div>
        );
    }

    // --- RENDER: List Mode (Legacy / Global) ---
    const total = facturas.reduce((acc, f) => acc + f.Importe, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-slate-800 font-semibold">
                    <List size={20} />
                    <span>Historial de Facturas</span>
                </div>
                {allowAdd && (
                    <button
                        onClick={() => setShowAddList(!showAddList)}
                        className="btn-primary flex items-center space-x-2 py-1 text-sm"
                    >
                        <Plus size={16} />
                        <span>Nueva Factura</span>
                    </button>
                )}
            </div>

            {showAddList && (
                <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nº Factura</label>
                        <input
                            type="text" required className="input-field"
                            value={invoiceForm.Numero_Factura_Real}
                            onChange={e => setInvoiceForm({ ...invoiceForm, Numero_Factura_Real: e.target.value })}
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Importe (€)</label>
                        <input
                            type="number" required className="input-field"
                            value={invoiceForm.Importe}
                            onChange={e => setInvoiceForm({ ...invoiceForm, Importe: e.target.value ? parseFloat(e.target.value) : 0 })}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Concepto</label>
                        <input
                            type="text" required className="input-field"
                            value={invoiceForm.Concepto}
                            onChange={e => setInvoiceForm({ ...invoiceForm, Concepto: e.target.value })}
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fecha Emisión</label>
                        <input
                            type="date" required className="input-field"
                            value={invoiceForm.Fecha_Emision}
                            onChange={e => setInvoiceForm({ ...invoiceForm, Fecha_Emision: e.target.value })}
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado</label>
                        <select
                            className="input-field"
                            value={invoiceForm.Estado_Pago}
                            onChange={e => setInvoiceForm({ ...invoiceForm, Estado_Pago: e.target.value })}
                        >
                            <option>Pendiente</option>
                            <option>Pagado</option>
                        </select>
                    </div>
                    <div className="col-span-2 flex justify-end space-x-2 mt-2">
                        <button type="button" onClick={() => setShowAddList(false)} className="btn-secondary py-1 text-sm">Cancelar</button>
                        <button type="submit" className="btn-primary py-1 text-sm">Guardar Factura</button>
                    </div>
                </form>
            )}

            <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nº</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Concepto</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Importe</th>
                            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {facturas.map(f => (
                            <tr key={f.Id_Factura} className="text-sm">
                                <td className="px-4 py-3 text-slate-600">{f.Fecha_Emision}</td>
                                <td className="px-4 py-3 font-medium text-slate-800">{f.Numero_Factura_Real}</td>
                                <td className="px-4 py-3 text-slate-600">{f.Concepto}</td>
                                <td className="px-4 py-3 font-semibold text-slate-800">{f.Importe.toLocaleString()} €</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${f.Estado_Pago === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {f.Estado_Pago}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {facturas.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-slate-400 italic">No hay facturas registradas</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                        <tr>
                            <td colSpan="3" className="px-4 py-3 text-right text-slate-500 uppercase text-xs">Total Facturado:</td>
                            <td className="px-4 py-3 text-primary-600 text-lg">{total.toLocaleString()} €</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default InvoiceManager;
