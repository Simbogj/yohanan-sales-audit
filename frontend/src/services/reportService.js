import api from './api';

export const reportService = {
  getDaily: async (date) => {
    const res = await api.get('/reports/daily', { params: { date } });
    return res.data.data;
  },

  getSalesByWaiter: async (date) => {
    const res = await api.get('/reports/sales-by-waiter', { params: { date } });
    return res.data.data;
  },

  getSalesByProduct: async (date) => {
    const res = await api.get('/reports/sales-by-product', { params: { date } });
    return res.data.data;
  },

  getSummary: async (params = {}) => {
    const res = await api.get('/reports/summary', { params });
    return res.data.data;
  },
};
