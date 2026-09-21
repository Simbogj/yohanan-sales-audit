import api from './api';

export const dailyAuditService = {
  getStatus: async (date) => {
    const res = await api.get('/daily-audit', { params: { date } });
    return res.data.data;
  },

  closeDay: async (date) => {
    const res = await api.post('/daily-audit/close', { date });
    return res.data.data;
  },
};
