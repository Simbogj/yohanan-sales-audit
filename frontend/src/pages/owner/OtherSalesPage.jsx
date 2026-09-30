import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import { otherSalesService } from '../../services/otherSalesService';

const today = new Date().toISOString().split('T')[0];

function statusColor(s) {
  if (s === 'VERIFIED') return 'success';
  if (s === 'DISPUTED') return 'error';
  return 'warning';
}

function fmtCurrency(n) {
  return `ETB ${parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

export default function OtherSalesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [auditDialog, setAuditDialog] = useState(null); // row being audited
  const [auditForm, setAuditForm] = useState({ status: 'VERIFIED', note: '' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      setRows(await otherSalesService.getAll(params));
    } catch {
      toast.error('Failed to load other sales');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  async function handleAudit() {
    if (auditForm.status === 'DISPUTED' && !auditForm.note) {
      toast.error('A note is required when disputing');
      return;
    }
    setSaving(true);
    try {
      await otherSalesService.updateStatus(auditDialog.id, auditForm.status, auditForm.note);
      toast.success(`Marked as ${auditForm.status}`);
      setAuditDialog(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await otherSalesService.delete(id);
      toast.success('Deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete');
    }
  }

  const totalAmount = rows.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <FactCheckIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Other Sales</Typography>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          label="Search item"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 200 }}
        />
        <TextField
          label="Date"
          type="date"
          size="small"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          select
          label="Status"
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="VERIFIED">Verified</MenuItem>
          <MenuItem value="DISPUTED">Disputed</MenuItem>
        </TextField>
      </Box>

      {rows.length > 0 && (
        <Box mb={2}>
          <Chip label={`Total: ${fmtCurrency(totalAmount)}`} color="primary" variant="outlined" />
        </Box>
      )}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Date</TableCell>
                <TableCell>Item</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Waiter</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Note</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No other sales found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.sale_date?.split('T')[0]}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{row.item_name}</TableCell>
                    <TableCell align="right">{row.quantity}</TableCell>
                    <TableCell align="right">{fmtCurrency(row.unit_price)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmtCurrency(row.total_amount)}</TableCell>
                    <TableCell>{row.waiter_name}</TableCell>
                    <TableCell>
                      <Chip label={row.status} size="small" color={statusColor(row.status)} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{row.note || '—'}</TableCell>
                    <TableCell align="center">
                      {row.status === 'PENDING' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => { setAuditDialog(row); setAuditForm({ status: 'VERIFIED', note: '' }); }}
                          sx={{ mr: 0.5, fontSize: '0.72rem' }}
                        >
                          Audit
                        </Button>
                      )}
                      <IconButton size="small" onClick={() => setDeleteId(row.id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Audit dialog */}
      <Dialog open={Boolean(auditDialog)} onClose={() => setAuditDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Audit: {auditDialog?.item_name}</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Result"
            value={auditForm.status}
            onChange={(e) => setAuditForm({ ...auditForm, status: e.target.value })}
            fullWidth
            sx={{ mt: 2, mb: 2 }}
          >
            <MenuItem value="VERIFIED">Verified</MenuItem>
            <MenuItem value="DISPUTED">Disputed</MenuItem>
          </TextField>
          <TextField
            label={auditForm.status === 'DISPUTED' ? 'Note (required)' : 'Note (optional)'}
            value={auditForm.note}
            onChange={(e) => setAuditForm({ ...auditForm, note: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleAudit} disabled={saving}
            color={auditForm.status === 'DISPUTED' ? 'error' : 'success'}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Other Sale?</DialogTitle>
        <DialogContent><Typography>This action cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => handleDelete(deleteId)}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
