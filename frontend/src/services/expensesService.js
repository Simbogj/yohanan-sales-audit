import api from './api';

export const expensesService = {
  getAll: (params = {}) =>
    api.get('/expenses', { params }).then((r) => r.data.data),

  getById: (id) =>
    api.get(`/expenses/${id}`).then((r) => r.data.data),

  create: (data) =>
    api.post('/expenses', data).then((r) => r.data.data),

  update: (id, data) =>
    api.put(`/expenses/${id}`, data).then((r) => r.data.data),

  delete: (id) =>
    api.delete(`/expenses/${id}`).then((r) => r.data.data),
};
