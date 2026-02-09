import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClientes, updateCliente, addAcuerdo, updateAcuerdo, deleteAcuerdo } from '../../api';
import { ArrowLeft, User, Gift, Clock, MapPin } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

import ResumenCliente from './clientes/detalle/ResumenCliente';
import GestionKitDigital from './clientes/detalle/GestionKitDigital';
import GestionNofence from './clientes/detalle/GestionNofence';
import Historial from './clientes/detalle/Historial';

const ClientDetail = () => {
    const { dni } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');

    const fetchData = async () => {
        try {
            const res = await getClientes();
            const found = res.data.find(c => c.Dni === dni);
            if (found) {
                setClient(found);
            } else {
                alert('Cliente no encontrado');
                navigate('/');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dni]);

    const handleUpdateClient = async (e) => {
        if (e) e.preventDefault();
        await updateCliente(dni, client);
        fetchData();
        alert('Datos actualizados correctamente');
    };

    // --- AGREEMENT HANDLERS ---
    const handleAddAcuerdo = async (newAcuerdo) => {
        try {
            await addAcuerdo(dni, newAcuerdo);
            fetchData();
        } catch (error) {
            alert('Error al añadir acuerdo');
        }
    };

    const handleToggleAcuerdo = async (idAcuerdo, field, currentValue) => {
        const newValue = !currentValue;
        const payload = { [field]: newValue };

        // Set date automatically if checked
        if (newValue) {
            const today = new Date().toISOString().split('T')[0];
            if (field === 'Enviado') payload.Fecha_Envio = today;
            if (field === 'Firmado') payload.Fecha_Firma = today;
        } else {
            if (field === 'Enviado') payload.Fecha_Envio = null;
            if (field === 'Firmado') payload.Fecha_Firma = null;
        }

        await updateAcuerdo(idAcuerdo, payload);
        fetchData();
    };

    const handleUpdateAcuerdo = async (idAcuerdo, updates) => {
        await updateAcuerdo(idAcuerdo, updates);
    };


    if (loading) return <div className="p-8 text-center text-slate-500">Cargando datos del cliente...</div>;
    if (!client) return <div className="p-8 text-center text-red-500">Cliente no encontrado</div>;

    const tabs = [
        { id: 'general', label: 'Resumen', icon: <User size={18} /> },
        { id: 'kit', label: 'Kit Digital & Acuerdos', icon: <Gift size={18} /> },
        { id: 'nofence', label: 'Nofence', icon: <MapPin size={18} /> },
        { id: 'historial', label: 'Historial', icon: <Clock size={18} /> },
    ];

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 mb-8 flex justify-between items-center shadow-sm">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{client.Nombre}</h1>
                        <div className="flex items-center space-x-2 text-sm text-slate-500">
                            <span className="font-mono bg-slate-100 px-1.5 rounded">{client.Dni}</span>
                            <span>•</span>
                            <span className="flex items-center"><MapPin size={12} className="mr-1" /> {client.Localidad || 'Sin localidad'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Badge variant="primary" className="text-sm px-3 py-1">{client.Estado}</Badge>
                </div>
            </div>

            <div className="px-8 max-w-7xl mx-auto">
                {/* Tabs Navigation */}
                <div className="flex space-x-6 border-b border-slate-200 mb-8 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 pb-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'border-primary-600 text-primary-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
                    {activeTab === 'general' && (
                        <ResumenCliente
                            client={client}
                            setClient={setClient}
                            onSave={handleUpdateClient}
                        />
                    )}

                    {activeTab === 'kit' && (
                        <GestionKitDigital
                            client={client}
                            setClient={setClient}
                            dni={dni}
                            onUpdateKit={handleUpdateClient}
                            onAddAcuerdo={handleAddAcuerdo}
                            onToggleAcuerdo={handleToggleAcuerdo}
                            onUpdateAcuerdo={handleUpdateAcuerdo}
                            fetchData={fetchData}
                        />
                    )}

                    {activeTab === 'nofence' && (
                        <GestionNofence
                            client={client}
                            setClient={setClient}
                            onUpdate={handleUpdateClient}
                            dni={dni}
                        />
                    )}

                    {activeTab === 'historial' && (
                        <Historial client={client} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientDetail;
