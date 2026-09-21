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
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

import { salesService } from '../../services/salesService';
import { formatCurrency, formatTime, formatDate, today } from '../../utils/format';

export default function MySalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateMode, setDateMode] = useState('today'); // 'today' | 'yesterday' | 'custom'
  const [customDate, setCustomDate] = useState(today());

  const getDate = () => {
    if (dateMode === 'today') return today();
    if (dateMode === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    }
    return customDate;
  };

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const data = await salesService.getMySales({ date: getDate() });
      setSales(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [dateMode, customDate]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const totalToday = sales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);

  return (
    <Box maxWidth={700} mx="auto">
      <Typography variant="h6" fontWeight={700} color="primary.main" mb={2}>
        My Sales
      </Typography>

      {/* Date filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          <ButtonGroup size="small" variant="outlined">
            <Button
              variant={dateMode === 'today' ? 'contained' : 'outlined'}
              onClick={() => setDateMode('today')}
            >
              Today
            </Button>
            <Button
              variant={dateMode === 'yesterday' ? 'contained' : 'outlined'}
              onClick={() => setDateMode('yesterday')}
            >
              Yesterday
            </Button>
            <Button
              variant={dateMode === 'custom' ? 'contained' : 'outlined'}
              onClick={() => setDateMode('custom')}
            >
              Date
            </Button>
          </ButtonGroup>

          {dateMode === 'custom' && (
            <TextField
              type="date"
              size="small"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          )}
        </Stack>
      </Paper>

      {/* Summary */}
      {sales.length > 0 && (
        <Box
          mb={2}
          p={2}
          bgcolor="primary.main"
          borderRadius={2}
          color="white"
          display="flex"
          justifyContent="space-between"
        >
          <Typography variant="body2">{sales.length} sales</Typography>
          <Typography variant="body2" fontWeight={700}>{formatCurrency(totalToday)}</Typography>
        </Box>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : sales.length === 0 ? (
        <EmptyState message="No sales found for this date" />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Sale ID</strong></TableCell>
                <TableCell><strong>Time</strong></TableCell>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell align="right"><strong>Qty</strong></TableCell>
                <TableCell align="right"><strong>Total</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                    {sale.sale_number}
                  </TableCell>
                  <TableCell>{formatTime(sale.sale_time)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{sale.product_name}</Typography>
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
