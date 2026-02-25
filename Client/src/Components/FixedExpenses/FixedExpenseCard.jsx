
import React from 'react';
import { Paper, Box, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PieChartIcon from '@mui/icons-material/PieChart';
import BoltIcon from '@mui/icons-material/Bolt';
import HomeIcon from '@mui/icons-material/Home';
import CalculateIcon from '@mui/icons-material/Calculate';
import ShieldIcon from '@mui/icons-material/Shield';

// מיפוי enum ל-label (תואם FixedExpensesPage)
const CATEGORY_ENUM_LABEL = {
  0: 'הוצאות תפעול',
  1: 'שכירות',
  2: 'ראה חשבון',
  3: 'ביטוח',
  4: 'שונות',
};

export default function FixedExpenseCard({ expense, onEdit, onDelete }) {
    React.useEffect(() => {
      console.log('FixedExpenseCard expense:', expense);
    }, [expense]);
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
  const { title, category, amount, type } = expense;
  const EXPENSE_TYPE_LABEL = { 0: 'עקיפה', 1: 'קבועה' };
  // הצג label של הקטגוריה אם היא מספר
  const categoryLabel = typeof category === 'number' ? CATEGORY_ENUM_LABEL[category] : category;
  return (
    <Paper elevation={3} sx={{ p: 2.5, borderRadius: 3, minHeight: 120, bgcolor: bg, position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Icon sx={{ color, fontSize: 28, mr: 1 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small" onClick={onEdit} sx={{ ml: 1 }} aria-label="ערוך">
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onDelete} aria-label="מחק">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
      <Typography variant="body2" sx={{ color: '#7c5c3b', mb: 0.5 }}>{categoryLabel}</Typography>
      <Typography variant="h5" sx={{ color: '#7c5c3b', fontWeight: 700 }}>{`₪${amount.toLocaleString()}`}</Typography>
      <Typography variant="caption" sx={{ color: '#bfa47a', fontWeight: 600 }}>לחודש</Typography>
      <Typography variant="caption" sx={{ color: '#bfa47a', fontWeight: 600, ml: 1 }}>{EXPENSE_TYPE_LABEL[type]}</Typography>
    </Paper>
  );
}
