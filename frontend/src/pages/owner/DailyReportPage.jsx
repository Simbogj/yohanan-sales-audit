import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import DateFilter from '../../components/common/DateFilter';
import DashboardCard from '../../components/common/DashboardCard';

import { reportService } from '../../services/reportService';
import { formatCurrency, formatDate, formatCategory, today } from '../../utils/format';

export default function DailyReportPage() {
  const [date, setDate] = useState(today());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reportService.getDaily(date);
      setReport(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const summary = report?.summary || {};

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary.main">Daily Report</Typography>
          <Typography variant="body2" color="text.secondary">{formatDate(date)}</Typography>
        </Box>
        <DateFilter date={date} onChange={setDate} />
      </Box>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} mb={4}>
            <Grid item xs={6} sm={3}>
              <DashboardCard title="Transactions" value={summary.total_transactions || 0} color="primary.main" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <DashboardCard title="Items Sold" value={summary.total_items || 0} color="secondary.main" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <DashboardCard title="Total Revenue" value={formatCurrency(summary.total_revenue || 0)} color="success.main" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <DashboardCard title="Pending" value={summary.pending_count || 0} color="warning.main" />
            </Grid>
          </Grid>

          {/* Audit Status */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Audit Status</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {summary.verified_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Verified</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight={700} color="error.main">
                      {summary.disputed_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Disputed</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                      {summary.pending_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Pending</Typography>
                  </Box>
                </Grid>
              </Grid>

              {report?.daily_audit && (
                <Box mt={2} p={1.5} bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="body2" color="text.secondary">
                    Day status:{' '}
                    <Chip
                      label={report.daily_audit.status}
                      size="small"
                      color={report.daily_audit.status === 'CLOSED' ? 'default' : 'success'}
                    />
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {/* By Waiter */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={2}>Sales by Waiter</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Waiter</strong></TableCell>
                          <TableCell align="right"><strong>Transactions</strong></TableCell>
                          <TableCell align="right"><strong>Total</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(report?.by_waiter || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              <Typography variant="body2" color="text.secondary">No data</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          report.by_waiter.map((w) => (
                            <TableRow key={w.id}>
                              <TableCell>{w.full_name}</TableCell>
                              <TableCell align="right">{w.transaction_count}</TableCell>
                              <TableCell align="right"><strong>{formatCurrency(w.total_sales)}</strong></TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* By Product */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={2}>Sales by Product</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Product</strong></TableCell>
                          <TableCell><strong>Category</strong></TableCell>
                          <TableCell align="right"><strong>Qty</strong></TableCell>
                          <TableCell align="right"><strong>Total</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(report?.by_product || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Typography variant="body2" color="text.secondary">No data</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          report.by_product.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell><strong>{p.product_name}</strong></TableCell>
                              <TableCell>
                                <Chip label={formatCategory(p.category)} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell align="right">{p.total_quantity}</TableCell>
                              <TableCell align="right"><strong>{formatCurrency(p.total_sales)}</strong></TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
