import React, { useState } from 'react';
import { Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CalculateIcon from '@mui/icons-material/Calculate';
import BoltIcon from '@mui/icons-material/Bolt';
import ShieldIcon from '@mui/icons-material/Shield';
import FixedExpensesHeader from './FixedExpenses/FixedExpensesHeader';
import FixedExpensesSummary from './FixedExpenses/FixedExpensesSummary';
import FixedExpensesList from './FixedExpenses/FixedExpensesList';

const fixedExpenses = [
  { title: 'שכירות סדנה', category: 'שכירות', amount: 3500, icon: HomeIcon, color: '#7c5c3b', bg: '#f6ede2' },
  { title: 'ראה חשבון חודשי', category: 'ראה חשבון', amount: 800, icon: CalculateIcon, color: '#7c5c3b', bg: '#f6ede2' },
  { title: 'חשמל', category: 'חשמל', amount: 1200, icon: BoltIcon, color: '#d4b03a', bg: '#faeaea' },
  { title: 'ביטוח עסק', category: 'ביטוח', amount: 350, icon: ShieldIcon, color: '#7c5cfa', bg: '#eafaea' },
];

export default function FixedExpensesPage() {
  const monthlyTotal = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const yearlyTotal = monthlyTotal * 12;

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f5f2', minHeight: '100vh' }}>
      <FixedExpensesHeader onAdd={() => {}} />
      <FixedExpensesSummary expenses={fixedExpenses} />
      <FixedExpensesList expenses={fixedExpenses} />
    </Box>
  );
}
