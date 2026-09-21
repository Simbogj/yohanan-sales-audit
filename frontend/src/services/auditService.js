import api from './api';

export const auditService = {
  verify: async (saleId, note = '') => {
    const res = await api.post(`/audits/${saleId}/verify`, { note });
    return res.data.data;
  },

  dispute: async (saleId, note) => {
    const res = await api.post(`/audits/${saleId}/dispute`, { note });
    return res.data.data;
  },

  getAll: async (params = {}) => {
    const res = await api.get('/audits', { params });
    return res.data.data;
  },

  getBySaleId: async (saleId) => {
    const res = await api.get(`/audits/${saleId}`);
    return res.data.data;
  },
};
