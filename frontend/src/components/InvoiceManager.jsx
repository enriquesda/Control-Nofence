import React, { useState } from 'react';
import { addFactura } from '../api';
import { Plus, List, CreditCard } from 'lucide-react';

const InvoiceManager = ({ dni, facturas, onUpdate, allowAdd = true }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [newInvoice, setNewInvoice] = useState({
        Numero_Factura_Real: '',
        Concepto: '',
        Importe: 0,
        Fecha_Emision: new Date().toISOString().split('T')[0],
        Estado_Pago: 'Pendiente'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addFactura(dni, newInvoice);
        setShowAdd(false);
        onUpdate();
    };

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
                        onClick={() => setShowAdd(!showAdd)}
                        className="btn-primary flex items-center space-x-2 py-1 text-sm"
                    >
                        <Plus size={16} />
                        <span>Nueva Factura</span>
                    </button>
                )}
            </div>

            {showAdd && (
                <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nº Factura</label>
                        <input
                            type="text" required className="input-field"
                            value={newInvoice.Numero_Factura_Real}
                            onChange={e => setNewInvoice({ ...newInvoice, Numero_Factura_Real: e.target.value })}
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Importe (€)</label>
                        <input
                            type="number" required className="input-field"
                            value={newInvoice.Importe}
                            onChange={e => setNewInvoice({ ...newInvoice, Importe: e.target.value ? parseFloat(e.target.value) : 0 })}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Concepto</label>
                        <input
                            type="text" required className="input-field"
                            value={newInvoice.Concepto}
                            onChange={e => setNewInvoice({ ...newInvoice, Concepto: e.target.value })}
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fecha Emisión</label>
                        <input
                            type="date" required className="input-field"
                            value={newInvoice.Fecha_Emision}
                            onChange={e => setNewInvoice({ ...newInvoice, Fecha_Emision: e.target.value })}
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado</label>
                        <select
                            className="input-field"
                            value={newInvoice.Estado_Pago}
                            onChange={e => setNewInvoice({ ...newInvoice, Estado_Pago: e.target.value })}
                        >
                            <option>Pendiente</option>
                            <option>Pagado</option>
                        </select>
                    </div>
                    <div className="col-span-2 flex justify-end space-x-2 mt-2">
                        <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-1 text-sm">Cancelar</button>
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
