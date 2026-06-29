import React from 'react';
import { Box } from '@mui/material';
import IngredientMobileItem from './IngredientMobileItem';

export default function IngredientsMobileList({ rows, onEdit, onDelete, categoryColors }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map((row, idx) => (
        <IngredientMobileItem
          key={row.id ?? idx}
          row={row}
          onEdit={onEdit}
          onDelete={onDelete}
          categoryColors={categoryColors}
        />
      ))}
    </Box>
  );
}
