import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
});

export const getClientes = () => api.get('/clientes');
export const getDashboard = () => api.get('/dashboard');
export const createCliente = (data) => api.post('/clientes', data);
export const deleteCliente = (dni) => api.delete(`/clientes/${dni}`);
export const updateCliente = (dni, data) => api.patch(`/clientes/${dni}`, data);
export const updateKit = (dni, data) => api.put(`/clientes/${dni}/kit`, data);
export const addAcuerdo = (dni, data) => api.post(`/clientes/${dni}/acuerdos`, data);
export const updateAcuerdo = (id, data) => api.patch(`/acuerdos/${id}`, data);
export const addFactura = (dni, data) => api.post(`/clientes/${dni}/factura`, data);

export default api;
