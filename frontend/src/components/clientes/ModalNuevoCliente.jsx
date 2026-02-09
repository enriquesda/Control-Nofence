import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const ModalNuevoCliente = ({ isOpen, onClose, onSave }) => {
    const [newClient, setNewClient] = useState({ Dni: '', Nombre: '', Telefono: '', Email: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(newClient);
        setNewClient({ Dni: '', Nombre: '', Telefono: '', Email: '' });
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
