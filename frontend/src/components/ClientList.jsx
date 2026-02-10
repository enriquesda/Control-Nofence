import React, { useState, useEffect } from 'react';
import { getClientes, deleteCliente, createCliente } from '../api';
import FiltrosClientes from './clientes/FiltrosClientes';
import TablaClientes from './clientes/TablaClientes';
import ModalNuevoCliente from './clientes/ModalNuevoCliente';

const ClientList = () => {
    const [clientes, setClientes] = useState([]);
    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState('Todos');
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchData = () => {
        getClientes().then(res => setClientes(res.data));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (e, dni) => {
        e.preventDefault();
        if (window.confirm('¿Estás seguro de que quieres eliminar este cliente? Se borrarán todos sus datos y facturas.')) {
            await deleteCliente(dni);
            fetchData();
        }
    };

    const handleCreateClient = async (newClientData) => {
        await createCliente(newClientData);
        setShowAddModal(false);
        fetchData();
    };

    const filtered = clientes.filter(c => {
        const nombreMatch = (c.Nombre || '').toLowerCase().includes(search.toLowerCase());
        const dniMatch = (c.Dni || '').toLowerCase().includes(search.toLowerCase());
        const matchesSearch = nombreMatch || dniMatch;
        const matchesFilter = filterEstado === 'Todos' || c.Estado === filterEstado;
        return matchesSearch && matchesFilter;
    });

    return (
        <div>
            <FiltrosClientes
                search={search}
                onSearchChange={setSearch}
                filterEstado={filterEstado}
                onFilterChange={setFilterEstado}
                onAddClient={() => setShowAddModal(true)}
            />

            <TablaClientes
                clientes={filtered}
                onDelete={handleDelete}
            />

            <ModalNuevoCliente
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={handleCreateClient}
            />
        </div>
    );
};

export default ClientList;
