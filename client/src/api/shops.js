import api from './axios';

export const createShop = (data) => api.post('/api/shops', data);
export const getMyShop = () => api.get('/api/shops/my');
export const getShopByToken = (qrToken) => api.get(`/api/shops/${qrToken}`);
