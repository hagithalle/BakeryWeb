import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const IncomeVsExpense = ({ strings }) => (
  <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
    <Typography variant="subtitle1" color="primary" sx={{ mb: 2 }}>{strings.dashboard?.incomeVsExpense || 'הכנסות מול הוצאות'}</Typography>
    <Box sx={{ textAlign: 'center', color: '#bfa47a', mt: 4 }}>{strings.dashboard?.noData || 'אין נתונים להצגה'}</Box>
  </Paper>
);

export default IncomeVsExpense;
