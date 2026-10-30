import api from './axios';

export const placeOrder = (data) => api.post('/api/orders', data);
export const getSellerOrders = () => api.get('/api/orders/seller');
export const getBuyerOrders = () => api.get('/api/orders/buyer');
export const updateOrderStatus = (id, status) => api.patch(`/api/orders/${id}/status`, { status });
