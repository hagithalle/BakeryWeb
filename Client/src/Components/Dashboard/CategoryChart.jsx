import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const CategoryChart = ({ strings }) => (
  <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
    <Typography variant="subtitle1" color="primary" sx={{ mb: 2 }}>{strings.dashboard?.categoryChart || 'מוצרים לפי קטגוריה'}</Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ width: 120, height: 120, borderRadius: '50%', border: '16px solid #d2b48c', borderTop: '16px solid #f8f5f2', mb: 1 }} />
      <Typography variant="body2" color="text.secondary">{strings.dashboard?.categoryLabel || 'עוגיות'}</Typography>
    </Box>
  </Paper>
);

export default CategoryChart;
