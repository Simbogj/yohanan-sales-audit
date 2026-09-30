import api from './api';

export const purchasesService = {
  getAll: (params = {}) =>
    api.get('/purchases', { params }).then((r) => r.data.data),

  getById: (id) =>
    api.get(`/purchases/${id}`).then((r) => r.data.data),

  create: (data) =>
    api.post('/purchases', data).then((r) => r.data.data),

  update: (id, data) =>
    api.put(`/purchases/${id}`, data).then((r) => r.data.data),

  delete: (id) =>
    api.delete(`/purchases/${id}`).then((r) => r.data.data),
};
