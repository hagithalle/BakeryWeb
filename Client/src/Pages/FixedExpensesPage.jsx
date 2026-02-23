
import React, { useState } from 'react';
import { Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CalculateIcon from '@mui/icons-material/Calculate';
import BoltIcon from '@mui/icons-material/Bolt';
import ShieldIcon from '@mui/icons-material/Shield';
import FixedExpensesHeader from './FixedExpenses/FixedExpensesHeader';
import FixedExpensesSummary from './FixedExpenses/FixedExpensesSummary';
import FixedExpensesList from './FixedExpenses/FixedExpensesList';
import FilterBar from '../Components/FilterBar';


const fixedExpenses = [
  { title: 'שכירות סדנה', category: 'שכירות', amount: 3500, icon: HomeIcon, color: '#7c5c3b', bg: '#f6ede2', type: 'קבועה' },
  { title: 'ראה חשבון חודשי', category: 'ראה חשבון', amount: 800, icon: CalculateIcon, color: '#7c5c3b', bg: '#f6ede2', type: 'עקיפה' },
  { title: 'חשמל', category: 'חשמל', amount: 1200, icon: BoltIcon, color: '#d4b03a', bg: '#faeaea', type: 'קבועה' },
  { title: 'ביטוח עסק', category: 'ביטוח', amount: 350, icon: ShieldIcon, color: '#7c5cfa', bg: '#eafaea', type: 'עקיפה' },
];


export default function FixedExpensesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');

  // קטגוריות ייחודיות
  const categories = Array.from(new Set(fixedExpenses.map(e => e.category)));
  const types = Array.from(new Set(fixedExpenses.map(e => e.type)));

  // סינון
  const filteredExpenses = fixedExpenses.filter(e => {
    const matchesSearch = e.title.includes(search) || e.category.includes(search);
    const matchesCategory = category === 'all' || e.category === category;
    const matchesType = type === 'all' || e.type === type;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f5f2', minHeight: '100vh' }}>
      <FixedExpensesHeader onAdd={() => {}} />
      <FixedExpensesSummary expenses={fixedExpenses} />
      {/* שורת חיפוש/סינון מתחת לסיכום עלות עקיפה */}
      <Box sx={{ my: 2 }}>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchLabel="חפש לפי שם או קטגוריה"
          filters={[
            {
              label: 'קטגוריה',
              value: category,
              onChange: setCategory,
              options: categories.map(c => ({ value: c, label: c })),
            },
            {
              label: 'סוג עלות',
              value: type,
              onChange: setType,
              options: types.map(t => ({ value: t, label: t })),
            },
          ]}
        />
      </Box>
      <FixedExpensesList expenses={filteredExpenses} />
    </Box>
  );
}
