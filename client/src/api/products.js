import api from './axios';

export const addProduct = (formData) =>
  api.post('/api/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getShopProducts = (shopId) => api.get(`/api/products/shop/${shopId}`);

export const updateProduct = (id, formData) =>
  api.patch(`/api/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const deleteProduct = (id) => api.delete(`/api/products/${id}`);

export const toggleInStock = (id, inStock) => {
  const fd = new FormData();
  fd.append('inStock', String(inStock));
  return api.patch(`/api/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const searchProducts = (q) => api.get(`/api/products/search?q=${encodeURIComponent(q)}`);
