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
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import DateFilter from '../../components/common/DateFilter';

import { salesService } from '../../services/salesService';
import { auditService } from '../../services/auditService';
import { userService } from '../../services/userService';
import { formatCurrency, formatTime, today } from '../../utils/format';
import toast from 'react-hot-toast';

export default function SalesAuditPage() {
  const [sales, setSales] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: today(), waiter_id: '', status: '', search: '' });

  const [disputeModal, setDisputeModal] = useState({ open: false, sale: null });
  const [disputeNote, setDisputeNote] = useState('');
  const [auditing, setAuditing] = useState(false);

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
    } catch (err) {
      toast.error('Failed to load sales');
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

  const handleVerify = async (sale) => {
    try {
      setAuditing(true);
      await auditService.verify(sale.id);
      toast.success(`${sale.sale_number} verified`);
      loadSales();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify');
    } finally {
      setAuditing(false);
    }
  };

  const handleOpenDispute = (sale) => {
    setDisputeNote('');
    setDisputeModal({ open: true, sale });
  };

  const handleConfirmDispute = async () => {
    if (!disputeNote.trim()) {
      toast.error('Please enter a reason for the dispute');
      return;
    }
    try {
      setAuditing(true);
      await auditService.dispute(disputeModal.sale.id, disputeNote.trim());
      toast.success(`${disputeModal.sale.sale_number} disputed`);
      setDisputeModal({ open: false, sale: null });
      loadSales();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispute');
    } finally {
      setAuditing(false);
    }
  };

  const pendingCount = sales.filter((s) => s.status === 'PENDING').length;

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} color="primary.main">Sales Audit</Typography>
        <Typography variant="body2" color="text.secondary">
          Review and verify sales against the physical sales book
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
          <DateFilter date={filters.date} onChange={(d) => setFilters({ ...filters, date: d })} />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Waiter</InputLabel>
            <Select
              value={filters.waiter_id}
              label="Waiter"
              onChange={(e) => setFilters({ ...filters, waiter_id: e.target.value })}
            >
              <MenuItem value="">All Waiters</MenuItem>
              {waiters.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.full_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="VERIFIED">Verified</MenuItem>
              <MenuItem value="DISPUTED">Disputed</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Search sale ID, product, waiter..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            sx={{ minWidth: 240 }}
          />
        </Stack>
      </Paper>

      {/* Pending badge */}
      {pendingCount > 0 && (
        <Box mb={2}>
          <Chip
            label={`${pendingCount} pending sale${pendingCount > 1 ? 's' : ''} need review`}
            color="warning"
            variant="filled"
          />
        </Box>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : sales.length === 0 ? (
        <EmptyState message="No sales found for the selected filters" />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Sale ID</strong></TableCell>
                <TableCell><strong>Time</strong></TableCell>
                <TableCell><strong>Waiter</strong></TableCell>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell align="right"><strong>Qty</strong></TableCell>
                <TableCell align="right"><strong>Unit Price</strong></TableCell>
                <TableCell align="right"><strong>Total</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.map((sale) => (
                <TableRow
                  key={sale.id}
                  hover
                  sx={{ '&:last-child td': { border: 0 } }}
                >
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                    {sale.sale_number}
                  </TableCell>
                  <TableCell>{formatTime(sale.sale_time)}</TableCell>
                  <TableCell>{sale.waiter_name}</TableCell>
                  <TableCell><strong>{sale.product_name}</strong></TableCell>
                  <TableCell>
                    <Chip label={sale.product_category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{sale.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(sale.unit_price)}</TableCell>
                  <TableCell align="right"><strong>{formatCurrency(sale.total_amount)}</strong></TableCell>
                  <TableCell><StatusBadge status={sale.status} /></TableCell>
                  <TableCell align="center">
                    {sale.status === 'PENDING' ? (
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleVerify(sale)}
                          disabled={auditing}
                        >
                          Verify
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleOpenDispute(sale)}
                          disabled={auditing}
                        >
                          Dispute
                        </Button>
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dispute Modal */}
      <Dialog open={disputeModal.open} onClose={() => setDisputeModal({ open: false, sale: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Dispute Sale</DialogTitle>
        <DialogContent>
          {disputeModal.sale && (
            <Box mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="body2" fontWeight={600}>{disputeModal.sale.sale_number}</Typography>
              <Typography variant="body2">{disputeModal.sale.product_name} × {disputeModal.sale.quantity}</Typography>
              <Typography variant="body2">Total: {formatCurrency(disputeModal.sale.total_amount)}</Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label="Reason for dispute"
            placeholder="e.g. Paper book shows quantity 2 but system recorded quantity 1"
            multiline
            rows={3}
            value={disputeNote}
            onChange={(e) => setDisputeNote(e.target.value)}
            required
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDisputeModal({ open: false, sale: null })} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDispute}
            variant="contained"
            color="error"
            disabled={auditing || !disputeNote.trim()}
          >
            {auditing ? 'Disputing...' : 'Confirm Dispute'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
