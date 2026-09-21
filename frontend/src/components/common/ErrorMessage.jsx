import React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

export default function ErrorMessage({ message = 'Something went wrong. Please try again.' }) {
  return (
    <Box py={3}>
      <Alert severity="error">{message}</Alert>
    </Box>
  );
}
