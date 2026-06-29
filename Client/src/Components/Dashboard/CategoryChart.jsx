import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import PieChartIcon from '@mui/icons-material/PieChart';
import dashboardSvgUrl from '../../icons/dashboard.svg';

const DONUT_SEGMENTS = [
  { color: '#E8C99A', deg: 0, size: 130 },
  { color: '#F5B8A0', deg: 130, size: 70 },
  { color: '#D2A679', deg: 200, size: 80 },
  { color: '#F0D5B8', deg: 280, size: 80 },
];

// Simple CSS-only donut chart as a visual placeholder
function DonutPlaceholder() {
  return (
    <Box sx={{ position: 'relative', width: 140, height: 140, mx: 'auto' }}>
      <Box
        sx={{
          width: 140,
          height: 140,
          borderRadius: '50%',
          background:
            'conic-gradient(#E8C99A 0deg 130deg, #F5B8A0 130deg 200deg, #D2A679 200deg 280deg, #F0D5B8 280deg 360deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Inner hole */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'white',
          }}
        />
      </Box>
    </Box>
  );
}

const CategoryChart = ({ strings }) => {
  const hasData = false; // replace with real check when data is wired

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '20px',
        border: '1px solid #F5EDE8',
        boxShadow: '0 4px 20px rgba(166,61,64,0.07)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative illustration top-left */}
      <Box
        component="img"
        src={dashboardSvgUrl}
        aria-hidden
        sx={{
          position: 'absolute',
          top: -10,
          left: -10,
          width: 80,
          height: 'auto',
          opacity: 0.1,
          pointerEvents: 'none',
        }}
      />

      {/* Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#A63D40' }}>
          {strings.dashboard?.categoryChart || 'מוצרים לפי קטגוריה'}
        </Typography>
        <PieChartIcon sx={{ fontSize: 20, color: '#C98929' }} />
      </Box>

      {/* Chart area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <DonutPlaceholder />
        <Typography variant="body2" sx={{ color: '#C4A88A', textAlign: 'center' }}>
          {strings.dashboard?.noData || 'אין נתונים להצגה'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default CategoryChart;
