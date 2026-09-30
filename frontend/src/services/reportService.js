import api from './api';

export const reportService = {
  getDaily: (date) =>
    api.get('/reports/daily', { params: { date } }).then((r) => r.data.data),

  getSalesByWaiter: (date) =>
    api.get('/reports/sales-by-waiter', { params: { date } }).then((r) => r.data.data),

  getSalesByProduct: (date) =>
    api.get('/reports/sales-by-product', { params: { date } }).then((r) => r.data.data),

  getSummary: (date_from, date_to) =>
    api.get('/reports/summary', { params: { date_from, date_to } }).then((r) => r.data.data),

  getProfit: (date_from, date_to) =>
    api.get('/reports/profit', { params: { date_from, date_to } }).then((r) => r.data.data),
};
