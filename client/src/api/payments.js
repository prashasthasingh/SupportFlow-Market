import api from './axios';

export const verifyPayment = (data) => api.post('/api/payments/verify', data);
