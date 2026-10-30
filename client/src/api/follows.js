import api from './axios';

export const followShop = (shopId) => api.post('/api/follows', { shopId });
export const getMyShops = () => api.get('/api/follows/my-shops');
export const checkFollow = (shopId) => api.get(`/api/follows/check/${shopId}`);
