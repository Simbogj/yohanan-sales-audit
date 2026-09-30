import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import toast from 'react-hot-toast';
import { otherSalesService } from '../../services/otherSalesService';

const today = new Date().toISOString().split('T')[0];
const emptyForm = { item_name: '', quantity: '', unit_price: '', note: '' };

function fmtCurrency(n) {
  return `ETB ${parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

function statusColor(s) {
  if (s === 'VERIFIED') return 'success';
  if (s === 'DISPUTED') return 'error';
  return 'warning';
}

export default function WaiterOtherSalePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await otherSalesService.getAll({ date: today }));
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = (parseFloat(form.quantity) || 0) * (parseFloat(form.unit_price) || 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.item_name || !form.quantity || !form.unit_price) {
      toast.error('Item name, quantity, and price are required');
      return;
    }
    setSubmitting(true);
    try {
      await otherSalesService.create(form);
      toast.success('Sale recorded!');
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h6" fontWeight={700}>Other Sales</Typography>
        <Button
          variant="contained"
          startIcon={<AddCircleIcon />}
          onClick={() => setShowForm(!showForm)}
          size="small"
        >
          {showForm ? 'Cancel' : 'New Sale'}
        </Button>
      </Box>

      {showForm && (
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Record Manual Sale</Typography>
            <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Item Name *"
                value={form.item_name}
                onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                fullWidth
                disabled={submitting}
              />
              <Box display="flex" gap={2}>
                <TextField
                  label="Quantity *"
                  type="number"
                  inputProps={{ min: 1, step: 1 }}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  fullWidth
                  disabled={submitting}
                />
                <TextField
                  label="Unit Price (ETB) *"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                  fullWidth
                  disabled={submitting}
                />
              </Box>
              {total > 0 && (
                <Typography variant="body2" color="primary.main" fontWeight={600}>
                  Total: {fmtCurrency(total)}
                </Typography>
              )}
              <TextField
                label="Note (optional)"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                multiline
                rows={2}
                fullWidth
                disabled={submitting}
              />
              <Button type="submit" variant="contained" disabled={submitting} sx={{ alignSelf: 'flex-end' }}>
                {submitting ? <CircularProgress size={22} color="inherit" /> : 'Submit'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Typography variant="subtitle2" color="text.secondary" mb={1}>Today's Other Sales</Typography>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Item</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No other sales today
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{row.item_name}</TableCell>
                    <TableCell align="right">{row.quantity}</TableCell>
                    <TableCell align="right">{fmtCurrency(row.unit_price)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmtCurrency(row.total_amount)}</TableCell>
                    <TableCell>
                      <Chip label={row.status} size="small" color={statusColor(row.status)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
