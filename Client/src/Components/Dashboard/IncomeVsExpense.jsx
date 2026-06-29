import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import financeIcon from '../../assets/decor/page-headers/finance-header-icon.svg';

const IncomeVsExpense = ({ strings }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: '20px',
      border: '1px solid #F5EDE8',
      boxShadow: '0 4px 20px rgba(166,61,64,0.07)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    {/* Title */}
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#A63D40' }}>
        {strings.dashboard?.incomeVsExpense || 'הכנסות מול הוצאות'}
      </Typography>
      <Box
        component="img"
        src={financeIcon}
        alt=""
        sx={{ width: 28, height: 28, objectFit: 'contain' }}
      />
    </Box>

    {/* Empty state */}
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
      }}
    >
      <Box
        component="img"
        src={financeIcon}
        alt=""
        sx={{ width: 80, height: 80, objectFit: 'contain', opacity: 0.35 }}
      />
      <Typography variant="body2" sx={{ color: '#C4A88A', textAlign: 'center' }}>
        {strings.dashboard?.noData || 'אין נתונים להצגה'}
      </Typography>
    </Box>
  </Paper>
);

export default IncomeVsExpense;
