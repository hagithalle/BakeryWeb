import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

export default function FixedExpensesSummary({ expenses }) {
  const monthlyTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const yearlyTotal = monthlyTotal * 12;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* סה"כ חודשי בצד ימין */}
      <Grid item xs={12} md={6} order={{ xs: 2, md: 1 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>סה"כ חודשי</Typography>
          <Typography variant="h3" sx={{ color: '#bfa47a', fontWeight: 700 }}>{`₪${monthlyTotal.toLocaleString()}`}</Typography>
          <Typography variant="body2" sx={{ color: '#7c5c3b', mt: 1 }}>{`שנתי: ₪${yearlyTotal.toLocaleString()}`}</Typography>
        </Paper>
      </Grid>
      {/* התפלגות הוצאות בצד שמאל */}
      <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, minHeight: 220 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>התפלגות הוצאות</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140 }}>
            <ResponsiveContainer width="60%" height={120}>
              <PieChart>
                <Pie
                  data={expenses}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={50}
                  innerRadius={30}
                  paddingAngle={2}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {expenses.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color || '#bfa47a'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <Box sx={{ ml: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {expenses.map((e, idx) => (
                <Box key={e.title} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: e.color || '#bfa47a', mr: 1 }} />
                  <Typography sx={{ fontWeight: 600, color: e.color, minWidth: 60 }}>{e.category}</Typography>
                  <Typography sx={{ mx: 1 }}>{`₪${e.amount}`}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
