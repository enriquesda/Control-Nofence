import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const ModalNuevoCliente = ({ isOpen, onClose, onSave }) => {
    const [newClient, setNewClient] = useState({ Dni: '', Nombre: '', Telefono: '', Email: '', Tipo: 'Nofence' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(newClient);
        setNewClient({ Dni: '', Nombre: '', Telefono: '', Email: '', Tipo: 'Nofence' });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Cliente">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="DNI / CIF"
                    value={newClient.Dni}
                    onChange={e => setNewClient({ ...newClient, Dni: e.target.value })}
                    required
                />
                <Input
                    label="Nombre Completo"
                    value={newClient.Nombre}
                    onChange={e => setNewClient({ ...newClient, Nombre: e.target.value })}
                    required
                />
                <Input
                    label="Teléfono"
                    value={newClient.Telefono}
                    onChange={e => setNewClient({ ...newClient, Telefono: e.target.value })}
                />
                <Input
                    label="Email"
                    value={newClient.Email}
                    onChange={e => setNewClient({ ...newClient, Email: e.target.value })}
                    type="email"
                />

                <div className="flex flex-col space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Tipo de Cliente</label>
                    <div className="flex space-x-4 mt-1">
                        <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 p-2 rounded-md flex-1 hover:bg-slate-100">
                            <input
                                type="radio"
                                name="tipo"
                                value="Nofence"
                                checked={newClient.Tipo === 'Nofence'}
                                onChange={() => setNewClient({ ...newClient, Tipo: 'Nofence' })}
                                className="text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Nofence</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 p-2 rounded-md flex-1 hover:bg-slate-100">
                            <input
                                type="radio"
                                name="tipo"
                                value="Normal"
                                checked={newClient.Tipo === 'Normal'}
                                onChange={() => setNewClient({ ...newClient, Tipo: 'Normal' })}
                                className="text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Normal</span>
                        </label>
                    </div>
                </div>

                <div className="flex space-x-3 pt-4">
                    <Button variant="secondary" onClick={onClose} className="flex-1">
                        Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                        Crear
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ModalNuevoCliente;
