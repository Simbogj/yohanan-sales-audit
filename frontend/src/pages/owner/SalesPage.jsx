import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';

import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import DateFilter from '../../components/common/DateFilter';

import { salesService } from '../../services/salesService';
import { userService } from '../../services/userService';
import { formatCurrency, formatTime, formatDate, today } from '../../utils/format';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: today(), waiter_id: '', status: '', search: '' });

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.waiter_id) params.waiter_id = filters.waiter_id;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const data = await salesService.getAll(params);
      setSales(data);
    } catch {
      /* handled silently */
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  useEffect(() => {
    userService.getAll({ role: 'WAITER' }).then(setWaiters).catch(() => {});
  }, []);

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} color="primary.main">All Sales</Typography>
        <Typography variant="body2" color="text.secondary">Browse and search all recorded sales</Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
          <DateFilter date={filters.date} onChange={(d) => setFilters({ ...filters, date: d })} />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Waiter</InputLabel>
            <Select value={filters.waiter_id} label="Waiter" onChange={(e) => setFilters({ ...filters, waiter_id: e.target.value })}>
              <MenuItem value="">All Waiters</MenuItem>
              {waiters.map((w) => <MenuItem key={w.id} value={w.id}>{w.full_name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filters.status} label="Status" onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="VERIFIED">Verified</MenuItem>
              <MenuItem value="DISPUTED">Disputed</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            sx={{ minWidth: 220 }}
          />
        </Stack>
      </Paper>

      {loading ? (
        <LoadingSpinner />
      ) : sales.length === 0 ? (
        <EmptyState message="No sales found" />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Sale ID</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Time</strong></TableCell>
                <TableCell><strong>Waiter</strong></TableCell>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell align="right"><strong>Qty</strong></TableCell>
                <TableCell align="right"><strong>Total</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'text.secondary' }}>
                    {sale.sale_number}
                  </TableCell>
                  <TableCell>{formatDate(sale.sale_date)}</TableCell>
                  <TableCell>{formatTime(sale.sale_time)}</TableCell>
                  <TableCell>{sale.waiter_name}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{sale.product_name}</Typography>
                      <Chip label={sale.product_category} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.7rem' }} />
                    </Box>
                  </TableCell>
                  <TableCell align="right">{sale.quantity}</TableCell>
                  <TableCell align="right"><strong>{formatCurrency(sale.total_amount)}</strong></TableCell>
                  <TableCell><StatusBadge status={sale.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
