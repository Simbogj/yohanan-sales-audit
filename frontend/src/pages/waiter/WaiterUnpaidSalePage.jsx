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
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import toast from 'react-hot-toast';
import { unpaidSalesService } from '../../services/unpaidSalesService';

const today = new Date().toISOString().split('T')[0];
const emptyForm = { customer_name: '', amount_owed: '', due_date: '', note: '' };

function fmtCurrency(n) {
  return `ETB ${parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

export default function WaiterUnpaidSalePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Show all unpaid records the waiter entered (not just today)
      setRows(await unpaidSalesService.getAll({ paid: 'false' }));
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.customer_name || !form.amount_owed) {
      toast.error('Customer name and amount are required');
      return;
    }
    setSubmitting(true);
    try {
      await unpaidSalesService.create({ ...form, sale_date: today });
      toast.success('Unpaid sale recorded');
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record');
    } finally {
      setSubmitting(false);
    }
  }

  const totalOwed = rows.reduce((s, r) => s + parseFloat(r.amount_owed || 0), 0);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <MoneyOffIcon color="error" />
          <Typography variant="h6" fontWeight={700}>Unpaid Sales</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleIcon />}
          onClick={() => setShowForm(!showForm)}
          size="small"
        >
          {showForm ? 'Cancel' : 'New Unpaid Sale'}
        </Button>
      </Box>

      {showForm && (
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Record Unpaid Sale
            </Typography>
            <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Customer Name *"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                fullWidth
                disabled={submitting}
              />
              <TextField
                label="Amount Owed (ETB) *"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={form.amount_owed}
                onChange={(e) => setForm({ ...form, amount_owed: e.target.value })}
                fullWidth
                disabled={submitting}
              />
              <TextField
                label="Due Date (optional)"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                disabled={submitting}
              />
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

      {rows.length > 0 && (
        <Box mb={2}>
          <Chip
            label={`Total outstanding: ${fmtCurrency(totalOwed)}`}
            color="error"
            variant="outlined"
            size="small"
          />
        </Box>
      )}

      <Typography variant="subtitle2" color="text.secondary" mb={1}>Outstanding (Unpaid)</Typography>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Sale Date</TableCell>
                <TableCell>Due Date</TableCell>
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
                    No unpaid sales
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const isOverdue = row.due_date && new Date(row.due_date) < new Date();
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.customer_name}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                        {fmtCurrency(row.amount_owed)}
                      </TableCell>
                      <TableCell>{row.sale_date?.split('T')[0]}</TableCell>
                      <TableCell>
                        {row.due_date ? (
                          <Typography variant="body2" color={isOverdue ? 'error.main' : 'text.primary'} fontWeight={isOverdue ? 700 : 400}>
                            {row.due_date?.split('T')[0]} {isOverdue && '⚠️'}
                          </Typography>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip label="Unpaid" size="small" color="error" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
