import React from 'react';
import { Paper, Typography, Divider, Box } from '@mui/material';

const MonthlySummary = ({ strings }) => (
  <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
    <Typography variant="subtitle1" color="primary" sx={{ mb: 2 }}>{strings.dashboard?.monthlySummary || 'סיכום חודשי'}</Typography>
    <Divider sx={{ mb: 1 }} />
    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#7c5c3b', mb: 1 }}>
      <span>{strings.dashboard?.totalIncome || 'סה"כ הכנסות'}</span>
      <span>₪0</span>
    </Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#d46a6a', mb: 1 }}>
      <span>{strings.dashboard?.totalExpense || 'סה"כ הוצאות'}</span>
      <span>₪0</span>
    </Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#7c5c3b', fontWeight: 'bold' }}>
      <span>{strings.dashboard?.profit || 'רווח נקי'}</span>
      <span>₪0</span>
    </Box>
  </Paper>
);

export default MonthlySummary;
