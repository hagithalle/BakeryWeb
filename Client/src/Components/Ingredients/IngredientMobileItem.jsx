import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Chip,
} from '@mui/material';

import getCategoryIcon from '../../utils/getCategoryIcon';
import { getStockStatus, STOCK_CONFIG } from '../../utils/getStockStatus';

import editIcon from '../../assets/icons/actions/edit-icon.svg';
import deleteIcon from '../../assets/icons/actions/delete-icon.svg';

export default function IngredientMobileItem({ row, onEdit, onDelete, categoryColors }) {
  const status = getStockStatus(row.originalStockQuantity ?? 0);
  const statusCfg = STOCK_CONFIG[status];
  const colors = categoryColors?.[row.category] || { bg: '#F5E6E0', text: '#971936' };
  const catIcon = getCategoryIcon(row.category);

  return (
    <Accordion
      elevation={0}
      disableGutters
      sx={{
        border: '1px solid #F0E4DB',
        borderRadius: '14px !important',
        mb: 1,
        direction: 'rtl',
        '&::before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        sx={{
          px: 1.5,
          py: 0.5,
          minHeight: 56,
          '& .MuiAccordionSummary-content': {
            margin: 0,
            width: '100%',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 1,
            width: '100%',
            direction: 'rtl',
            flexWrap: 'wrap',
          }}
        >
          {/* Category icon */}
          <Box
            component="img"
            src={catIcon}
            alt={row.category}
            sx={{ width: 32, height: 32, flexShrink: 0 }}
          />

          {/* Ingredient name */}
          <Typography variant="body1" sx={{ fontWeight: 700, flexGrow: 1 }}>
            {row.name}
          </Typography>

          {/* Category chip */}
          <Chip
            label={row.category}
            size="small"
            sx={{
              backgroundColor: colors.bg,
              color: colors.text,
              fontWeight: 600,
              borderRadius: '8px',
            }}
          />

          {/* Unit */}
          <Typography variant="caption" sx={{ color: '#9B5A25' }}>
            {row.unit}
          </Typography>

          {/* Stock quantity */}
          <Typography variant="caption" sx={{ color: '#7A3B2E', fontWeight: 600 }}>
            {row.stockQuantity}
          </Typography>

          {/* Price */}
          <Typography variant="caption" sx={{ color: '#555' }}>
            ₪{row.pricePerKg}
          </Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ bgcolor: '#FDF8F5', px: 2, py: 1.5 }}>
        {/* Detail rows */}
        {[
          { label: 'קטגוריה', value: row.category },
          { label: 'יחידת מידה', value: row.unit },
          { label: 'מחיר ליחידה', value: `₪${row.pricePerKg}` },
          { label: 'כמות במלאי', value: row.stockQuantity },
          ...(row.supplier && row.supplier !== '-'
            ? [{ label: 'ספק', value: row.supplier }]
            : []),
        ].map(({ label, value }) => (
          <Box
            key={label}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              direction: 'rtl',
              mb: 0.75,
            }}
          >
            <Typography variant="caption" sx={{ color: '#9B5A25', fontWeight: 500 }}>
              {label}
            </Typography>
            <Typography variant="body2" sx={{ color: '#3E2010', fontWeight: 600 }}>
              {value}
            </Typography>
          </Box>
        ))}

        {/* Status row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            direction: 'rtl',
            mb: 1.5,
          }}
        >
          <Typography variant="caption" sx={{ color: '#9B5A25', fontWeight: 500 }}>
            סטטוס
          </Typography>
          <Chip
            label={statusCfg.label}
            size="small"
            sx={{
              backgroundColor: statusCfg.bg,
              color: statusCfg.color,
              fontWeight: 600,
              borderRadius: '8px',
            }}
          />
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, direction: 'rtl' }}>
          <Box
            onClick={() => onEdit(row)}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              bgcolor: '#FFF8EC',
              borderRadius: '10px',
              py: 1,
              cursor: 'pointer',
              '&:hover': { bgcolor: '#FFF0D0' },
            }}
          >
            <Box component="img" src={editIcon} alt="ערוך" sx={{ width: 18, height: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#C98929' }}>
              ערוך
            </Typography>
          </Box>

          <Box
            onClick={() => onDelete(row)}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              bgcolor: '#FFEFEF',
              borderRadius: '10px',
              py: 1,
              cursor: 'pointer',
              '&:hover': { bgcolor: '#FFD6D6' },
            }}
          >
            <Box component="img" src={deleteIcon} alt="מחק" sx={{ width: 18, height: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#C62828' }}>
              מחק
            </Typography>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
