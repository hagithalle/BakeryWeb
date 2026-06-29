import React from 'react';
import { Box, Typography } from '@mui/material';
import AddButton from '../AddButton';
import emptyIcon from '../../assets/icons/ui/empty-ingredients-icon.svg';

export default function IngredientsEmptyState({ onAdd }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2,
        direction: 'rtl',
      }}
    >
      <Box
        component="img"
        src={emptyIcon}
        alt="אין חומרי גלם"
        sx={{ width: 120, height: 120 }}
      />
      <Typography variant="h6" sx={{ color: '#A63D40', fontWeight: 700 }}>
        עדיין אין חומרי גלם
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: '#9B5A25', textAlign: 'center', maxWidth: 320 }}
      >
        הוסיפי חומר גלם ראשון כדי להתחיל לנהל מלאי ועלויות
      </Typography>
      <AddButton onClick={onAdd}>הוסף חומר גלם</AddButton>
    </Box>
  );
}
