

import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import HomeIcon from '@mui/icons-material/Home';
import CalculateIcon from '@mui/icons-material/Calculate';
import { CATEGORY_ICON_COLOR, CATEGORY_ENUM_LABEL } from '../../utils/categoryMap';


export default function FixedExpensesSummary({ expenses }) {
  const monthlyTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const yearlyTotal = monthlyTotal * 12;

  // קיבוץ לפי קטגוריה (int) וסכימה, צבע תואם בדיוק לפס העליון של הכרטיסים
  const grouped = {};
  expenses.forEach((e) => {
    const cat = typeof e.category === 'number' ? e.category : Number(e.category);
    if (!grouped[cat]) grouped[cat] = { amount: 0, category: cat };
    grouped[cat].amount += e.amount;
  });
  const coloredExpenses = Object.values(grouped).map((e) => {
    const cat = CATEGORY_ICON_COLOR[e.category] || {};
    return {
      ...e,
      color: cat.color, // צבע פס עליון של כרטיס
      icon: cat.icon,
      label: CATEGORY_ENUM_LABEL[e.category] || 'שונות',
    };
  });

  return (
    <Grid container spacing={4} sx={{ mb: 3, justifyContent: 'center' }} columns={12}>
      {/* סה"כ חודשי בצד ימין */}
      <Grid sx={{ gridColumn: { xs: '1 / -1', md: '1 / 6' }, order: { xs: 2, md: 1 } }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#fff' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>סה"כ חודשי</Typography>
          <Typography variant="h3" sx={{ color: '#bfa47a', fontWeight: 700 }}>{`₪${monthlyTotal.toLocaleString()}`}</Typography>
          <Typography variant="body2" sx={{ color: '#7c5c3b', mt: 1 }}>{`שנתי: ₪${yearlyTotal.toLocaleString()}`}</Typography>
        </Paper>
      </Grid>
      {/* התפלגות הוצאות בצד שמאל */}
      <Grid sx={{ gridColumn: { xs: '1 / -1', md: '6 / 13' }, order: { xs: 1, md: 2 } }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, minHeight: 220, background: '#fff' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, textAlign: 'center' }}>התפלגות הוצאות</Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Box sx={{ width: 160, height: 160, minWidth: 120, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={120} minHeight={120}>
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
              {coloredExpenses.map((e, idx) => {
                const Icon = e.icon;
                return (
                  <Box key={e.category + idx} sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                    <Icon sx={{ color: e.color, fontSize: 18, mr: 1 }} />
                    <Typography sx={{ fontWeight: 600, color: '#333', minWidth: 60 }}>{e.label}</Typography>
                    <Typography sx={{ mx: 1, color: '#7c5c3b', fontWeight: 500 }}>{`₪${e.amount}`}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
