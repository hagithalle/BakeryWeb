import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

import PieChartIcon from '@mui/icons-material/PieChart';
import BoltIcon from '@mui/icons-material/Bolt';
import HomeIcon from '@mui/icons-material/Home';
import CalculateIcon from '@mui/icons-material/Calculate';
import ShieldIcon from '@mui/icons-material/Shield';

export default function FixedExpenseCard({ expense }) {
  // Fallbacks for icon/color/bg
  let Icon = expense.icon;
  let color = expense.color || '#7c5c3b';
  let bg = expense.bg || '#f6ede2';
  if (!Icon) {
    // Pick icon by category/type if missing
    if (expense.category === 'חשמל') Icon = BoltIcon;
    else if (expense.category === 'שכירות') Icon = HomeIcon;
    else if (expense.category === 'ראה חשבון') Icon = CalculateIcon;
    else if (expense.category === 'ביטוח') Icon = ShieldIcon;
    else Icon = PieChartIcon;
  }
  const { title, category, amount } = expense;
  return (
    <Paper elevation={3} sx={{ p: 2.5, borderRadius: 3, minHeight: 120, bgcolor: bg }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Icon sx={{ color, fontSize: 28, mr: 1 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#7c5c3b', mb: 0.5 }}>{category}</Typography>
      <Typography variant="h5" sx={{ color: '#7c5c3b', fontWeight: 700 }}>{`₪${amount.toLocaleString()}`}</Typography>
      <Typography variant="caption" sx={{ color: '#bfa47a', fontWeight: 600 }}>לחודש</Typography>
      <Typography variant="caption" sx={{ color: '#bfa47a', fontWeight: 600, ml: 1 }}>קבוע</Typography>
    </Paper>
  );
}
