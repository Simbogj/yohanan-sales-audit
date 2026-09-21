import api from './api';

export const authService = {
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data.data;
  },
};
