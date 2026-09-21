import api from './api';

export const userService = {
  getAll: async (params = {}) => {
    const res = await api.get('/users', { params });
    return res.data.data;
  },

  create: async (data) => {
    const res = await api.post('/users', data);
    return res.data.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data.data;
  },

  updateStatus: async (id, active) => {
    const res = await api.patch(`/users/${id}/status`, { active });
    return res.data.data;
  },
};
