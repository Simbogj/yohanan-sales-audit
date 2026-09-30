import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RefreshIcon from '@mui/icons-material/Refresh';
import toast from 'react-hot-toast';
import { reportService } from '../../services/reportService';

const today = new Date().toISOString().split('T')[0];

function fmtCurrency(n) {
  return `ETB ${parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

function SummaryCard({ title, value, subtitle, color = 'primary', icon }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase">
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700} color={`${color}.main`} mt={0.5}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            )}
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.7 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function BreakdownTable({ title, rows, keyLabel, valueLabel }) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} mb={1}>{title}</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>{keyLabel}</TableCell>
              <TableCell align="right">{valueLabel}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ color: 'text.secondary', py: 2 }}>
                  No data
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell>{r.category || r.key}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{fmtCurrency(r.total || r.value)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function ProfitReportPage() {
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!dateFrom || !dateTo) {
      toast.error('Please select both dates');
      return;
    }
    if (dateFrom > dateTo) {
      toast.error('"From" date cannot be after "To" date');
      return;
    }
    setLoading(true);
    try {
      const result = await reportService.getProfit(dateFrom, dateTo);
      setData(result);
    } catch {
      toast.error('Failed to load profit report');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  const isProfit = data ? data.profit.net_profit >= 0 : null;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <AssessmentIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Profit Report</Typography>
      </Box>

      {/* Date range selector */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <TextField
              label="From"
              type="date"
              size="small"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
            <TextField
              label="To"
              type="date"
              size="small"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
            <Button
              variant="contained"
              onClick={load}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            >
              {loading ? 'Loading…' : 'Generate Report'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {!data && !loading && (
        <Box textAlign="center" py={8} color="text.secondary">
          <AssessmentIcon sx={{ fontSize: 64, opacity: 0.2 }} />
          <Typography mt={2}>Select a date range and click Generate Report</Typography>
        </Box>
      )}

      {data && (
        <>
          {/* Period label */}
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <Typography variant="body2" color="text.secondary">
              Period: <strong>{data.date_from}</strong> → <strong>{data.date_to}</strong>
            </Typography>
            <Chip
              label={isProfit ? `Profit` : `Loss`}
              color={isProfit ? 'success' : 'error'}
              size="small"
              icon={isProfit ? <TrendingUpIcon /> : <TrendingDownIcon />}
            />
          </Box>

          {/* Top KPI cards */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                title="Total Revenue"
                value={fmtCurrency(data.revenue.total_revenue)}
                subtitle={`${data.revenue.sale_count + data.revenue.other_sale_count} transactions`}
                color="primary"
                icon={<TrendingUpIcon sx={{ fontSize: 32 }} />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                title="Total Costs"
                value={fmtCurrency(data.costs.total_costs)}
                subtitle={`Purchases + Expenses`}
                color="error"
                icon={<TrendingDownIcon sx={{ fontSize: 32 }} />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                title="Net Profit"
                value={fmtCurrency(data.profit.net_profit)}
                subtitle={`Margin: ${data.profit.profit_margin_pct}%`}
                color={isProfit ? 'success' : 'error'}
                icon={<AccountBalanceIcon sx={{ fontSize: 32 }} />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                title="Outstanding (Unpaid)"
                value={fmtCurrency(data.receivables.total_unpaid)}
                subtitle={`${data.receivables.unpaid_count} customers`}
                color="warning"
                icon={<AccountBalanceIcon sx={{ fontSize: 32 }} />}
              />
            </Grid>
          </Grid>

          {/* Revenue breakdown */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2} color="primary.main">
                Revenue Breakdown
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Catalogue Sales</Typography>
                      <Typography variant="body2" fontWeight={600}>{fmtCurrency(data.revenue.catalogue_sales)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" pl={2}>
                      <Typography variant="caption" color="success.main">↳ Verified</Typography>
                      <Typography variant="caption" color="success.main">{fmtCurrency(data.revenue.verified_catalogue_sales)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" pl={2}>
                      <Typography variant="caption" color="warning.main">↳ Pending</Typography>
                      <Typography variant="caption" color="warning.main">{fmtCurrency(data.revenue.pending_catalogue_sales)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" pl={2}>
                      <Typography variant="caption" color="error.main">↳ Disputed</Typography>
                      <Typography variant="caption" color="error.main">{fmtCurrency(data.revenue.disputed_catalogue_sales)}</Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Other (Manual) Sales</Typography>
                      <Typography variant="body2" fontWeight={600}>{fmtCurrency(data.revenue.other_sales)}</Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" fontWeight={700}>Total Revenue</Typography>
                      <Typography variant="body2" fontWeight={700} color="primary.main">{fmtCurrency(data.revenue.total_revenue)}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Costs breakdown */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2} color="error.main">
                Costs Breakdown
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <BreakdownTable
                    title={`Purchases by Category (Total: ${fmtCurrency(data.costs.total_purchases)})`}
                    rows={data.costs.purchases_by_category}
                    keyLabel="Category"
                    valueLabel="Amount"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <BreakdownTable
                    title={`Expenses by Category (Total: ${fmtCurrency(data.costs.total_expenses)})`}
                    rows={data.costs.expenses_by_category}
                    keyLabel="Category"
                    valueLabel="Amount"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="flex-end" gap={4}>
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">Total Purchases</Typography>
                  <Typography fontWeight={700} color="error.main">{fmtCurrency(data.costs.total_purchases)}</Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">Total Expenses</Typography>
                  <Typography fontWeight={700} color="error.main">{fmtCurrency(data.costs.total_expenses)}</Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">Total Costs</Typography>
                  <Typography fontWeight={700} color="error.main">{fmtCurrency(data.costs.total_costs)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* P&L Summary */}
          <Card elevation={0} sx={{ border: '2px solid', borderColor: isProfit ? 'success.main' : 'error.main' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>P&L Summary</Typography>
              <Box display="flex" flexDirection="column" gap={1.5} maxWidth={400}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Total Revenue</Typography>
                  <Typography fontWeight={600} color="primary.main">{fmtCurrency(data.revenue.total_revenue)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>− Total Purchases</Typography>
                  <Typography fontWeight={600} color="error.main">{fmtCurrency(data.costs.total_purchases)}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography fontWeight={600}>Gross Profit</Typography>
                  <Typography fontWeight={700} color={data.profit.gross_profit >= 0 ? 'success.main' : 'error.main'}>
                    {fmtCurrency(data.profit.gross_profit)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>− Total Expenses</Typography>
                  <Typography fontWeight={600} color="error.main">{fmtCurrency(data.costs.total_expenses)}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6" fontWeight={700}>Net Profit</Typography>
                  <Typography variant="h6" fontWeight={700} color={isProfit ? 'success.main' : 'error.main'}>
                    {fmtCurrency(data.profit.net_profit)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" textAlign="right">
                  Profit margin: {data.profit.profit_margin_pct}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
