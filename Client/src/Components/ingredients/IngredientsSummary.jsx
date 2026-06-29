import React from 'react';
import { Box, Paper, Typography, useMediaQuery } from '@mui/material';

import totalIcon     from '../../assets/icons/ingredients-summary/total-ingredients-icon.svg';
import availableIcon from '../../assets/icons/ingredients-summary/available-ingredients-icon.svg';
import lowStockIcon  from '../../assets/icons/ingredients-summary/low-stock-icon.svg';
import needOrderIcon from '../../assets/icons/ingredients-summary/need-order-icon.svg';

const CARDS = [
  {
    key: 'total',
    label: 'סה"כ חומרים',
    subtitle: 'כל החומרים',
    icon: totalIcon,
    valueColor: '#A63D40',
  },
  {
    key: 'available',
    label: 'זמינים',
    subtitle: 'מלאי תקין',
    icon: availableIcon,
    valueColor: '#2E7D32',
  },
  {
    key: 'low',
    label: 'עומדים להיגמר',
    subtitle: 'מלאי נמוך',
    icon: lowStockIcon,
    valueColor: '#E65100',
  },
  {
    key: 'outOfStock',
    label: 'צריך להזמין',
    subtitle: 'אזל מהמלאי',
    icon: needOrderIcon,
    valueColor: '#C62828',
  },
];

export default function IngredientsSummary({ stats }) {
  const isMobile = useMediaQuery('(max-width:768px)');
  const iconSize  = isMobile ? 100 : 130;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: '18px',
        mb: 3,
        direction: 'rtl',
      }}
    >
      {CARDS.map(({ key, label, subtitle, icon, valueColor }) => (
        <Paper
          key={key}
          elevation={0}
          sx={{
            borderRadius: '20px',
            background: '#FFFDF9',
            border: '1px solid #F1DDD3',
            boxShadow: '0 4px 20px rgba(120, 70, 45, 0.08)',
            p: { xs: '16px 18px', md: '20px 24px' },
            minHeight: 110,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            direction: 'rtl',
          }}
        >
          {/* Right side: label + number + subtitle */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 0.25,
              flex: 1,
              minWidth: 0,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#9B5A25',
                fontWeight: 500,
                fontSize: { xs: 11, md: 12 },
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
              }}
            >
              {label}
            </Typography>

            <Typography
              variant="h4"
              sx={{
                color: valueColor,
                fontWeight: 800,
                fontSize: { xs: 28, md: 34 },
                lineHeight: 1.1,
              }}
            >
              {stats?.[key] ?? 0}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: '#C4A88A',
                fontSize: { xs: 10, md: 11 },
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          {/* Left side: large icon */}
          <Box
            component="img"
            src={icon}
            alt={label}
            sx={{
              width: iconSize,
              height: iconSize,
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
        </Paper>
      ))}
    </Box>
  );
}
