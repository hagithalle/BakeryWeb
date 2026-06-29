import React from 'react';
import { Paper, Typography, Box, Divider } from '@mui/material';
import CakeIcon from '@mui/icons-material/Cake';

const ROW_STYLES = [
  { color: '#2E7D32', label: 'income' },
  { color: '#A63D40', label: 'expense' },
  { color: '#9B5A25', label: 'profit', bold: true },
];

const MonthlySummary = ({ strings }) => {
  const rows = [
    { label: strings.dashboard?.totalIncome  || 'סה"כ הכנסות', value: '₪0', color: '#2E7D32' },
    { label: strings.dashboard?.totalExpense || 'סה"כ הוצאות', value: '₪0', color: '#A63D40' },
    { label: strings.dashboard?.profit       || 'רווח נקי',    value: '₪0', color: '#9B5A25', bold: true },
  ];

  return (
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
          {strings.dashboard?.monthlySummary || 'סיכום חודשי'}
        </Typography>
        <CakeIcon sx={{ fontSize: 20, color: '#C98929' }} />
      </Box>

      <Divider sx={{ borderColor: '#F5EDE8', mb: 1.5 }} />

      {/* Rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1, justifyContent: 'center' }}>
        {rows.map((row) => (
          <Box
            key={row.label}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1.2,
              px: 1.5,
              borderRadius: '10px',
              bgcolor: row.bold ? '#FDF6F0' : 'transparent',
              transition: 'background 0.15s',
              '&:hover': { bgcolor: '#FDF6F0' },
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: row.color, fontWeight: row.bold ? 700 : 500 }}
            >
              {row.value}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#7A5540', fontWeight: row.bold ? 700 : 400 }}
            >
              {row.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default MonthlySummary;
