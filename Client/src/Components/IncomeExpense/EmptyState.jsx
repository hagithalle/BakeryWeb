import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

export default function EmptyState() {
  return (
    <Paper elevation={2} sx={{ p: 4, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 3, mt: 2 }}>
      <AttachMoneyIcon sx={{ fontSize: 48, color: '#bfa47a', mb: 2 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>אין תנועות</Typography>
      <Typography variant="body2" color="text.secondary">הוסף את התנועה הראשונה שלך</Typography>
    </Paper>
  );
}
