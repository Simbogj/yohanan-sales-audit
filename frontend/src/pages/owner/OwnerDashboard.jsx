import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';

import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import LockIcon from '@mui/icons-material/Lock';

import DashboardCard from '../../components/common/DashboardCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import { reportService } from '../../services/reportService';
import { dailyAuditService } from '../../services/dailyAuditService';
import { formatCurrency, formatDate, today } from '../../utils/format';
import toast from 'react-hot-toast';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [auditStatus, setAuditStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [rep, audit] = await Promise.all([
        reportService.getDaily(today()),
        dailyAuditService.getStatus(today()),
      ]);
      setReport(rep);
      setAuditStatus(audit);
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleCloseDay = async () => {
    setClosing(true);
    try {
      await dailyAuditService.closeDay(today());
      toast.success('Day closed successfully');
      setConfirmClose(false);
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close day');
    } finally {
      setClosing(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} />;

  const summary = report?.summary || {};
  const isClosed = auditStatus?.audit_record?.status === 'CLOSED';
  const pendingCount = parseInt(summary.pending_count || 0);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary.main">
            Today's Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(today())}
          </Typography>
        </Box>

        {isClosed ? (
          <Button variant="outlined" disabled startIcon={<LockIcon />}>
            Day Closed
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            startIcon={<LockIcon />}
            onClick={() => setConfirmClose(true)}
          >
            Close Day
          </Button>
        )}
      </Box>

      {isClosed && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This day has been closed by {auditStatus.audit_record.closed_by_name || 'owner'}.
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={6} sm={4} md={2}>
          <DashboardCard
            title="Total Sales"
            value={summary.total_transactions || 0}
            subtitle="transactions"
            icon={<ReceiptIcon />}
            color="primary.main"
            onClick={() => navigate('/owner/audit')}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <DashboardCard
            title="Revenue"
            value={formatCurrency(summary.total_revenue || 0)}
            subtitle="today"
            icon={<MonetizationOnIcon />}
            color="secondary.main"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <DashboardCard
            title="Pending"
            value={pendingCount}
            subtitle="need review"
            icon={<HourglassEmptyIcon />}
            color="warning.main"
            onClick={() => navigate('/owner/audit')}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <DashboardCard
            title="Verified"
            value={summary.verified_count || 0}
            subtitle="confirmed"
            icon={<CheckCircleIcon />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <DashboardCard
            title="Disputed"
            value={summary.disputed_count || 0}
            subtitle="discrepancies"
            icon={<CancelIcon />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <DashboardCard
            title="Items Sold"
            value={summary.total_items || 0}
            subtitle="total qty"
            icon={<ReceiptIcon />}
            color="text.secondary"
          />
        </Grid>
      </Grid>

      {/* Sales by Waiter */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Sales by Waiter
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {(report?.by_waiter || []).length === 0 ? (
                <Typography color="text.secondary" variant="body2">No sales today</Typography>
              ) : (
                report.by_waiter.map((w) => (
                  <Box key={w.id} display="flex" justifyContent="space-between" alignItems="center" py={1}
                    sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { border: 0 } }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{w.full_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{w.transaction_count} transactions</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {formatCurrency(w.total_sales)}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sales by Product */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Top Products
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {(report?.by_product || []).length === 0 ? (
                <Typography color="text.secondary" variant="body2">No sales today</Typography>
              ) : (
                report.by_product.slice(0, 8).map((p) => (
                  <Box key={p.id} display="flex" justifyContent="space-between" alignItems="center" py={1}
                    sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { border: 0 } }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{p.product_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.total_quantity} units</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color="secondary.main">
                      {formatCurrency(p.total_sales)}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Close Day Confirmation */}
      <ConfirmDialog
        open={confirmClose}
        title="Close Today's Sales?"
        message={
          pendingCount > 0
            ? `There are ${pendingCount} pending sale(s) that haven't been audited. Are you sure you want to close the day?`
            : 'Are you sure you want to close today\'s sales? This action cannot be undone.'
        }
        confirmLabel={closing ? 'Closing...' : 'Close Day'}
        confirmColor="warning"
        onConfirm={handleCloseDay}
        onCancel={() => setConfirmClose(false)}
      />
    </Box>
  );
}
