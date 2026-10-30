import api from './axios';

export const getAdminOverview = () => api.get('/api/admin/overview');
