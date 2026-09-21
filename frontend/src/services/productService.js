import api from './api';

export const productService = {
  getAll: async (params = {}) => {
    const res = await api.get('/products', { params });
    return res.data.data;
  },

  getById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data.data;
  },

  create: async (data) => {
    const res = await api.post('/products', data);
    return res.data.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/products/${id}`, data);
    return res.data.data;
  },

  updateStatus: async (id, active) => {
    const res = await api.patch(`/products/${id}/status`, { active });
    return res.data.data;
  },
};
