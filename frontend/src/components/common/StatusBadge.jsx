import React from 'react';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

const statusConfig = {
  PENDING: {
    label: 'Pending',
    color: 'warning',
    icon: <HourglassEmptyIcon style={{ fontSize: 14 }} />,
  },
  VERIFIED: {
    label: 'Verified',
    color: 'success',
    icon: <CheckCircleIcon style={{ fontSize: 14 }} />,
  },
  DISPUTED: {
    label: 'Disputed',
    color: 'error',
    icon: <CancelIcon style={{ fontSize: 14 }} />,
  },
};

export default function StatusBadge({ status, size = 'small' }) {
  const config = statusConfig[status] || { label: status, color: 'default', icon: null };
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      icon={config.icon}
      variant="filled"
    />
  );
}
