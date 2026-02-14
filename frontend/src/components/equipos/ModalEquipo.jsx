import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

const CATEGORIAS = [
    'camara', 'lector', 'pastor', 'puerta', 'silo', 'tolva', 'deposito', 'otros'
];

const ESTADOS = [
    'espera', 'pedido', 'pagado', 'en oficina', 'enviado', 'revicido'
];

/**
 * Modal para crear o editar un equipo.
 */
const ModalEquipo = ({ isOpen, onClose, onSave, initialData = null }) => {
    const [formData, setFormData] = useState({
        Nombre: '',
        Categoria: 'otros',
        Estado: 'espera',
        Notas: '',
        Precio: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                Nombre: initialData.Nombre || '',
                Categoria: initialData.Categoria || 'otros',
                Estado: initialData.Estado || 'espera',
                Notas: initialData.Notas || '',
                Precio: initialData.Precio || '',
            });
        } else {
            setFormData({
                Nombre: '',
                Categoria: 'otros',
                Estado: 'espera',
                Notas: '',
                Precio: '',
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            Precio: formData.Precio ? parseFloat(formData.Precio) : 0
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">
                        {initialData ? 'Editar Equipo' : 'Añadir Nuevo Equipo'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input
                        label="Nombre del Equipo *"
                        value={formData.Nombre}
                        onChange={e => setFormData({ ...formData, Nombre: e.target.value })}
                        required
                        placeholder="Ej: Lector Solares"
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
                        <select
                            className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                            value={formData.Categoria}
                            onChange={e => setFormData({ ...formData, Categoria: e.target.value })}
                        >
                            {CATEGORIAS.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                        <select
                            className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                            value={formData.Estado}
                            onChange={e => setFormData({ ...formData, Estado: e.target.value })}
                        >
                            {ESTADOS.map(st => (
                                <option key={st} value={st}>{st}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Precio (€)"
                            type="number"
                            step="0.01"
                            value={formData.Precio}
                            onChange={e => setFormData({ ...formData, Precio: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                        <textarea
                            className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                            rows="3"
                            value={formData.Notas}
                            onChange={e => setFormData({ ...formData, Notas: e.target.value })}
                            placeholder="Detalles adicionales..."
                        />
                    </div>

                    <div className="pt-4 flex space-x-3">
                        <Button variant="secondary" onClick={onClose} className="w-full justify-center">
                            Cancelar
                        </Button>
                        <Button type="submit" className="w-full justify-center">
                            <Save size={18} className="mr-2" />
                            Guardar
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalEquipo;
