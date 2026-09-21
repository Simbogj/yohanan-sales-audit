import api from './api';

export const salesService = {
  create: async ({ product_id, quantity }) => {
    const res = await api.post('/sales', { product_id, quantity });
    return res.data.data;
  },

  getAll: async (params = {}) => {
    const res = await api.get('/sales', { params });
    return res.data.data;
  },

  getToday: async () => {
    const res = await api.get('/sales/today');
    return res.data.data;
  },

  getMySales: async (params = {}) => {
    const res = await api.get('/sales/my-sales', { params });
    return res.data.data;
  },

  getById: async (id) => {
    const res = await api.get(`/sales/${id}`);
    return res.data.data;
  },
};
