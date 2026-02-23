
import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Define a color palette for the pie chart
const COLORS = [
  '#bfa47a', // Gold
  '#7c5c3b', // Brown
  '#e57373', // Red
  '#64b5f6', // Blue
  '#81c784', // Green
  '#ffd54f', // Yellow
  '#ba68c8', // Purple
  '#ffb74d', // Orange
  '#4dd0e1', // Teal
  '#a1887f', // Taupe
];


export default function FixedExpensesSummary({ expenses }) {
  const monthlyTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const yearlyTotal = monthlyTotal * 12;

  // Assign a color to each expense if not already set
  const coloredExpenses = expenses.map((e, idx) => ({
    ...e,
    color: e.color || COLORS[idx % COLORS.length],
  }));

  return (
    <Grid container spacing={4} sx={{ mb: 3, justifyContent: 'center' }}>
      {/* סה"כ חודשי בצד ימין */}
      <Grid item xs={12} md={5} order={{ xs: 2, md: 1 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#fffbe9' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>סה"כ חודשי</Typography>
          <Typography variant="h3" sx={{ color: '#bfa47a', fontWeight: 700 }}>{`₪${monthlyTotal.toLocaleString()}`}</Typography>
          <Typography variant="body2" sx={{ color: '#7c5c3b', mt: 1 }}>{`שנתי: ₪${yearlyTotal.toLocaleString()}`}</Typography>
        </Paper>
      </Grid>
      {/* התפלגות הוצאות בצד שמאל */}
      <Grid item xs={12} md={7} order={{ xs: 1, md: 2 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, minHeight: 220, background: '#fffbe9' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, textAlign: 'center' }}>התפלגות הוצאות</Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Box sx={{ width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={coloredExpenses}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={38}
                    paddingAngle={2}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#333"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={11}
                          fontWeight={600}
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {coloredExpenses.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Box>
            {/* Legend */}
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', minWidth: 120, maxHeight: 160, overflowY: 'auto', pr: 1 }}>
              {coloredExpenses.map((e, idx) => (
                <Box key={e.category + idx} sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: e.color, mr: 1, border: '1px solid #ccc' }} />
                  <Typography sx={{ fontWeight: 600, color: '#333', minWidth: 60 }}>{e.category}</Typography>
                  <Typography sx={{ mx: 1, color: '#7c5c3b', fontWeight: 500 }}>{`₪${e.amount}`}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
