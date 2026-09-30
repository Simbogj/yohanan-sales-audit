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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import toast from 'react-hot-toast';
import { expensesService } from '../../services/expensesService';

const CATEGORIES = ['RENT', 'UTILITIES', 'SALARY', 'MAINTENANCE', 'TRANSPORT', 'MARKETING', 'OTHER'];
const today = new Date().toISOString().split('T')[0];
const emptyForm = { expense_date: today, category: 'OTHER', description: '', amount: '', note: '' };

function fmtCurrency(n) {
  return `ETB ${parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

export default function ExpensesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.search = search;
      setRows(await expensesService.getAll(params));
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, categoryFilter, search]);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditRow(null); setForm(emptyForm); setDialogOpen(true); }

  function openEdit(row) {
    setEditRow(row);
    setForm({
      expense_date: row.expense_date?.split('T')[0] || today,
      category: row.category,
      description: row.description,
      amount: String(row.amount),
      note: row.note || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.description || !form.amount) {
      toast.error('Description and amount are required');
      return;
    }
    setSaving(true);
    try {
      if (editRow) {
        await expensesService.update(editRow.id, form);
        toast.success('Expense updated');
      } else {
        await expensesService.create(form);
        toast.success('Expense recorded');
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await expensesService.delete(id);
      toast.success('Expense deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete');
    }
  }

  const totalExpenses = rows.reduce((s, r) => s + parseFloat(r.amount || 0), 0);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <ReceiptLongIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Expenses</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          Add Expense
        </Button>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          label="Search description"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 220 }}
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
          label="Category"
          size="small"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
      </Box>

      {rows.length > 0 && (
        <Box mb={2}>
          <Chip label={`Total expenses: ${fmtCurrency(totalExpenses)}`} color="error" variant="outlined" />
        </Box>
      )}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Date</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Recorded By</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.expense_date?.split('T')[0]}</TableCell>
                    <TableCell>
                      <Chip label={row.category} size="small" variant="outlined" color="warning" />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{row.description}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {fmtCurrency(row.amount)}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{row.note || '—'}</TableCell>
                    <TableCell>{row.recorded_by_name}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => openEdit(row)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
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

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRow ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        <DialogContent>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <TextField
              label="Date"
              type="date"
              value={form.expense_date}
              onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              fullWidth
            >
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <TextField
              label="Description *"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              label="Amount (ETB) *"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              fullWidth
            />
            <TextField
              label="Note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              fullWidth
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

      {/* Delete confirm */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Expense?</DialogTitle>
        <DialogContent><Typography>This action cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => handleDelete(deleteId)}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
