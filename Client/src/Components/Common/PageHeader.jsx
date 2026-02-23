import React from 'react';
import { Box, Typography } from '@mui/material';
import AddButton from '../AddButton';

export default function PageHeader({ title, subtitle, buttonLabel, onAdd, buttonColor = '#bfa47a' }) {
  return (
    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#a03a4e' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="subtitle1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {buttonLabel && (
        <AddButton onClick={onAdd}>{buttonLabel}</AddButton>
      )}
    </Box>
  );
}
