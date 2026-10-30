import api from './axios';

export const submitReview = (data) => api.post('/api/reviews', data);
export const getShopReviews = (shopId) => api.get(`/api/reviews/shop/${shopId}`);
export const checkOrderReview = (orderId) => api.get(`/api/reviews/order/${orderId}`);
