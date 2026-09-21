import React from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { today } from '../../utils/format';

export default function DateFilter({ date, onChange, label = 'Date' }) {
  return (
    <Box display="flex" gap={1} alignItems="center">
      <TextField
        type="date"
        label={label}
        value={date}
        onChange={(e) => onChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        size="small"
      />
      <Button variant="text" size="small" onClick={() => onChange(today())}>
        Today
      </Button>
    </Box>
  );
}
