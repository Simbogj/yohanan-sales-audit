import api from './api';

export const unpaidSalesService = {
  getAll: (params = {}) =>
    api.get('/unpaid-sales', { params }).then((r) => r.data.data),

  getById: (id) =>
    api.get(`/unpaid-sales/${id}`).then((r) => r.data.data),

  create: (data) =>
    api.post('/unpaid-sales', data).then((r) => r.data.data),

  markPaid: (id) =>
    api.patch(`/unpaid-sales/${id}/mark-paid`).then((r) => r.data.data),

  update: (id, data) =>
    api.put(`/unpaid-sales/${id}`, data).then((r) => r.data.data),

  delete: (id) =>
    api.delete(`/unpaid-sales/${id}`).then((r) => r.data.data),
};
