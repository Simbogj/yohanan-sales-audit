import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

import { productService } from '../../services/productService';
import { formatCurrency, formatCategory } from '../../utils/format';
import toast from 'react-hot-toast';

const CATEGORIES = ['COFFEE', 'NON_COFFEE', 'BREAKFAST', 'FOOD', 'OTHER'];
const EMPTY_FORM = { product_code: '', name: '', category: 'COFFEE', price: '' };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, product: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ open: true, product: null });
  };

  const openEdit = (product) => {
    setForm({
      product_code: product.product_code,
      name: product.name,
      category: product.category,
      price: product.price,
    });
    setModal({ open: true, product });
  };

  const handleSave = async () => {
    if (!form.product_code || !form.name || !form.price) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      setSaving(true);
      if (modal.product) {
        await productService.update(modal.product.id, form);
        toast.success('Product updated');
      } else {
        await productService.create(form);
        toast.success('Product created');
      }
      setModal({ open: false, product: null });
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      await productService.updateStatus(product.id, !product.active);
      toast.success(`${product.name} ${product.active ? 'deactivated' : 'activated'}`);
      loadProducts();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary.main">Products</Typography>
          <Typography variant="body2" color="text.secondary">Manage menu items</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Product
        </Button>
      </Box>

      {loading ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <EmptyState message="No products yet" />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Code</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell align="right"><strong>Price</strong></TableCell>
                <TableCell align="center"><strong>Active</strong></TableCell>
                <TableCell align="center"><strong>Edit</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} hover sx={{ '&:last-child td': { border: 0 }, opacity: p.active ? 1 : 0.5 }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.product_code}</TableCell>
                  <TableCell><strong>{p.name}</strong></TableCell>
                  <TableCell>
                    <Chip label={formatCategory(p.category)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{formatCurrency(p.price)}</TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={p.active}
                      onChange={() => handleToggleStatus(p)}
                      size="small"
                      color="success"
                      inputProps={{ 'aria-label': `Toggle ${p.name}` }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Product Modal */}
      <Dialog open={modal.open} onClose={() => setModal({ open: false, product: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{modal.product ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Product Code"
              value={form.product_code}
              onChange={(e) => setForm({ ...form, product_code: e.target.value })}
              required
              fullWidth
              placeholder="e.g. COF-005"
            />
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              fullWidth
            />
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={form.category}
                label="Category"
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{formatCategory(c)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Price (ETB)"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              fullWidth
              inputProps={{ min: 0, step: 0.5 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModal({ open: false, product: null })} variant="outlined">Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
