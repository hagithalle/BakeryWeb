
import React from 'react';
import { Grid, Box } from '@mui/material';
import FixedExpenseCard from './FixedExpenseCard';

// צבעי קטגוריה קבועים (תואם CATEGORY_ICON_COLOR)
import { CATEGORY_ICON_COLOR } from '../../utils/categoryMap';

export default function FixedExpensesList({ expenses, onEdit, onDelete }) {
  React.useEffect(() => {
    console.log('FixedExpensesList expenses:', expenses);
  }, [expenses]);
  // צבע פס עליון לפי קטגוריה קבועה

  return (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      {expenses.map((e) => {
        const cat = CATEGORY_ICON_COLOR[e.category] || {};
        const topColor = cat.color || '#C98929';
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={e.title}>
            <Box
              sx={{
                boxShadow: '0 4px 16px 0 rgba(160, 120, 80, 0.10)',
                borderRadius: 3,
                bgcolor: '#fff',
                p: 2.5,
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'box-shadow 0.2s',
                '&:hover': {
                  boxShadow: '0 8px 32px 0 rgba(160, 120, 80, 0.18)',
                  transform: 'translateY(-2px) scale(1.01)',
                },
                position: 'relative',
                mb: 1,
                borderTop: `6px solid ${topColor}`,
              }}
            >
              <FixedExpenseCard expense={e} onEdit={() => onEdit(e)} onDelete={() => onDelete(e)} />
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
}
