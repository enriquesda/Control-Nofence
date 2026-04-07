import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

export const getClientes = () => api.get('/clientes');
export const getCliente = (dni) => api.get(`/clientes/${dni}`);
export const getDashboard = () => api.get('/dashboard');
export const createCliente = (data) => api.post('/clientes', data);
export const deleteCliente = (dni) => api.delete(`/clientes/${dni}`);
export const updateCliente = (dni, data) => api.patch(`/clientes/${dni}`, data);
export const updateKit = (dni, data) => api.put(`/clientes/${dni}/kit`, data);
export const addAcuerdo = (dni, data) => api.post(`/clientes/${dni}/acuerdos`, data);
export const updateAcuerdo = (id, data) => api.patch(`/acuerdos/${id}`, data);
export const deleteAcuerdo = (id) => api.delete(`/acuerdos/${id}`);
export const addFactura = (dni, data) => api.post(`/clientes/${dni}/factura`, data);
export const updateFactura = (id, data) => api.patch(`/facturas/${id}`, data);

// Equipos
export const getEquipos = (params) => api.get('/equipos', { params });
export const addEquipo = (dni, data) => api.post(`/clientes/${dni}/equipos`, data);
export const deleteEquipo = (id) => api.delete(`/equipos/${id}`);
export const updateEquipoStatus = (id, data) => api.patch(`/equipos/${id}/estado`, data);
export const getHistorialEquipos = (params) => api.get('/equipos/historial', { params });

// Notas Dashboard
export const getNotasDashboard = () => api.get('/notas_dashboard');
export const createNotaDashboard = (data) => api.post('/notas_dashboard', data);
export const deleteNotaDashboard = (id) => api.delete(`/notas_dashboard/${id}`);

export default api;
