import api from './api';

export const otherSalesService = {
  getAll: (params = {}) =>
    api.get('/other-sales', { params }).then((r) => r.data.data),

  getById: (id) =>
    api.get(`/other-sales/${id}`).then((r) => r.data.data),

  create: (data) =>
    api.post('/other-sales', data).then((r) => r.data.data),

  updateStatus: (id, status, note) =>
    api.patch(`/other-sales/${id}/status`, { status, note }).then((r) => r.data.data),

  delete: (id) =>
    api.delete(`/other-sales/${id}`).then((r) => r.data.data),
};
