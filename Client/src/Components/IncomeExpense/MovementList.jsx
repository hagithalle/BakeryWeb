import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

export default function MovementList({ movements }) {
  if (!movements || movements.length === 0) {
    return null;
  }
  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3, mt: 2 }}>
      {/* Replace with mapped movement items */}
      <Typography variant="body1">רשימת תנועות (להשלמה)</Typography>
    </Paper>
  );
}
