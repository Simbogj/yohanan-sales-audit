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
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import toast from 'react-hot-toast';
import { unpaidSalesService } from '../../services/unpaidSalesService';

const today = new Date().toISOString().split('T')[0];
const emptyForm = {
  customer_name: '',
  amount_owed: '',
  sale_date: today,
  due_date: '',
  note: '',
};

function fmtCurrency(n) {
  return `ETB ${parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

export default function UnpaidSalesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paidFilter, setPaidFilter] = useState('false'); // default: show unpaid
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [markPaidId, setMarkPaidId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (paidFilter !== '') params.paid = paidFilter;
      if (search) params.search = search;
      setRows(await unpaidSalesService.getAll(params));
    } catch {
      toast.error('Failed to load unpaid sales');
    } finally {
      setLoading(false);
    }
  }, [paidFilter, search]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditRow(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(row) {
    setEditRow(row);
    setForm({
      customer_name: row.customer_name,
      amount_owed: String(row.amount_owed),
      sale_date: row.sale_date?.split('T')[0] || today,
      due_date: row.due_date?.split('T')[0] || '',
      note: row.note || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.customer_name || !form.amount_owed) {
      toast.error('Customer name and amount owed are required');
      return;
    }
    setSaving(true);
    try {
      if (editRow) {
        await unpaidSalesService.update(editRow.id, form);
        toast.success('Record updated');
      } else {
        await unpaidSalesService.create(form);
        toast.success('Unpaid sale recorded');
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid(id) {
    try {
      await unpaidSalesService.markPaid(id);
      toast.success('Marked as paid');
      setMarkPaidId(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  }

  async function handleDelete(id) {
    try {
      await unpaidSalesService.delete(id);
      toast.success('Deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete');
    }
  }

  const totalUnpaid = rows
    .filter((r) => !r.paid)
    .reduce((s, r) => s + parseFloat(r.amount_owed || 0), 0);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <MoneyOffIcon color="error" />
          <Typography variant="h5" fontWeight={700}>Unpaid Sales</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          Add Unpaid Sale
        </Button>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          label="Search customer"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 220 }}
        />
        <TextField
          select
          label="Status"
          size="small"
          value={paidFilter}
          onChange={(e) => setPaidFilter(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="false">Unpaid</MenuItem>
          <MenuItem value="true">Paid</MenuItem>
        </TextField>
      </Box>

      {paidFilter !== 'true' && rows.some((r) => !r.paid) && (
        <Box mb={2}>
          <Chip
            label={`Outstanding: ${fmtCurrency(totalUnpaid)}`}
            color="error"
            variant="outlined"
            icon={<MoneyOffIcon />}
          />
        </Box>
      )}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Amount Owed</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Paid At</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Recorded By</TableCell>
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
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const isOverdue = !row.paid && row.due_date && new Date(row.due_date) < new Date();
                  return (
                    <TableRow key={row.id} hover sx={isOverdue ? { bgcolor: 'error.50' } : {}}>
                      <TableCell>{row.sale_date?.split('T')[0]}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.customer_name}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: row.paid ? 'success.main' : 'error.main' }}>
                        {fmtCurrency(row.amount_owed)}
                      </TableCell>
                      <TableCell>
                        {row.due_date ? (
                          <Typography variant="body2" color={isOverdue ? 'error.main' : 'text.primary'} fontWeight={isOverdue ? 700 : 400}>
                            {row.due_date?.split('T')[0]}
                            {isOverdue && ' ⚠️'}
                          </Typography>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.paid ? 'Paid' : 'Unpaid'}
                          size="small"
                          color={row.paid ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        {row.paid_at ? new Date(row.paid_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{row.note || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{row.recorded_by_name}</TableCell>
                      <TableCell align="center">
                        {!row.paid && (
                          <Tooltip title="Mark as paid">
                            <IconButton size="small" color="success" onClick={() => setMarkPaidId(row.id)}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {!row.paid && (
                          <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRow ? 'Edit Unpaid Sale' : 'Record Unpaid Sale'}</DialogTitle>
        <DialogContent>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <TextField
              label="Customer Name *"
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              fullWidth
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              label="Amount Owed (ETB) *"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={form.amount_owed}
              onChange={(e) => setForm({ ...form, amount_owed: e.target.value })}
              fullWidth
            />
            <TextField
              label="Sale Date"
              type="date"
              value={form.sale_date}
              onChange={(e) => setForm({ ...form, sale_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Due Date (optional)"
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              multiline
              rows={2}
              fullWidth
              sx={{ gridColumn: '1 / -1' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : editRow ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mark paid confirm */}
      <Dialog open={Boolean(markPaidId)} onClose={() => setMarkPaidId(null)}>
        <DialogTitle>Mark as Paid?</DialogTitle>
        <DialogContent>
          <Typography>Confirm that this sale has been paid in full.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarkPaidId(null)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={() => handleMarkPaid(markPaidId)}>
            Confirm Paid
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Record?</DialogTitle>
        <DialogContent><Typography>This action cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => handleDelete(deleteId)}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
