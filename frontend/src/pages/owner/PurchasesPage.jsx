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
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import toast from 'react-hot-toast';
import { purchasesService } from '../../services/purchasesService';
import { format } from 'date-fns';

const CATEGORIES = ['COFFEE_BEANS', 'MILK', 'SUGAR', 'FLOUR', 'PACKAGING', 'CLEANING', 'OTHER'];
const UNITS = ['kg', 'g', 'litre', 'ml', 'pack', 'box', 'unit', 'piece'];

const today = new Date().toISOString().split('T')[0];

const emptyForm = {
  purchase_date: today,
  supplier_name: '',
  item_name: '',
  category: 'OTHER',
  quantity: '',
  unit: 'kg',
  unit_cost: '',
  note: '',
};

function fmtCurrency(n) {
  return `ETB ${parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

export default function PurchasesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
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
      if (search) params.search = search;
      const data = await purchasesService.getAll(params);
      setRows(data);
    } catch {
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditRow(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(row) {
    setEditRow(row);
    setForm({
      purchase_date: row.purchase_date?.split('T')[0] || today,
      supplier_name: row.supplier_name || '',
      item_name: row.item_name,
      category: row.category,
      quantity: String(row.quantity),
      unit: row.unit,
      unit_cost: String(row.unit_cost),
      note: row.note || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.item_name || !form.quantity || !form.unit_cost) {
      toast.error('Item name, quantity, and unit cost are required');
      return;
    }
    setSaving(true);
    try {
      if (editRow) {
        await purchasesService.update(editRow.id, form);
        toast.success('Purchase updated');
      } else {
        await purchasesService.create(form);
        toast.success('Purchase recorded');
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
      await purchasesService.delete(id);
      toast.success('Purchase deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete');
    }
  }

  const totalCost = rows.reduce((s, r) => s + parseFloat(r.total_cost || 0), 0);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <ShoppingCartIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Purchases</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          Record Purchase
        </Button>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          label="Search item / supplier"
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
        {dateFilter && (
          <Button size="small" onClick={() => setDateFilter('')}>Clear date</Button>
        )}
      </Box>

      {/* Summary chip */}
      {rows.length > 0 && (
        <Box mb={2}>
          <Chip label={`Total spent: ${fmtCurrency(totalCost)}`} color="error" variant="outlined" />
        </Box>
      )}

      {/* Table */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Date</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell align="right">Unit Cost</TableCell>
                <TableCell align="right">Total Cost</TableCell>
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
                    No purchases found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.purchase_date?.split('T')[0]}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{row.item_name}</TableCell>
                    <TableCell>
                      <Chip label={row.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{row.supplier_name || '—'}</TableCell>
                    <TableCell align="right">{row.quantity}</TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell align="right">{fmtCurrency(row.unit_cost)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {fmtCurrency(row.total_cost)}
                    </TableCell>
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
        <DialogTitle>{editRow ? 'Edit Purchase' : 'Record Purchase'}</DialogTitle>
        <DialogContent>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <TextField
              label="Purchase Date"
              type="date"
              value={form.purchase_date}
              onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Supplier Name"
              value={form.supplier_name}
              onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Item Name *"
              value={form.item_name}
              onChange={(e) => setForm({ ...form, item_name: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              fullWidth
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Quantity *"
              type="number"
              inputProps={{ min: 0.001, step: 0.001 }}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Unit"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              fullWidth
            >
              {UNITS.map((u) => (
                <MenuItem key={u} value={u}>{u}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Unit Cost (ETB) *"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={form.unit_cost}
              onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
              fullWidth
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total:{' '}
                <strong>
                  {fmtCurrency((parseFloat(form.quantity) || 0) * (parseFloat(form.unit_cost) || 0))}
                </strong>
              </Typography>
            </Box>
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

      {/* Delete confirm */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Purchase?</DialogTitle>
        <DialogContent>
          <Typography>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => handleDelete(deleteId)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
