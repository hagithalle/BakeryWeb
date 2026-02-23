import React from 'react';
import { Grid } from '@mui/material';
import FixedExpenseCard from './FixedExpenseCard';

export default function FixedExpensesList({ expenses }) {
  return (
    <Grid container spacing={3}>
      {expenses.map((e, idx) => (
        <Grid item xs={12} md={3} key={e.title}>
          <FixedExpenseCard expense={e} />
        </Grid>
      ))}
    </Grid>
  );
}
