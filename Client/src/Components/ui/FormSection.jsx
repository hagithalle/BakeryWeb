import React from 'react';
import { Box, Typography } from '@mui/material';
import FloatingSectionIcon from './FloatingSectionIcon';

export default function FormSection({ icon, title, children, sx = {}, iconRight = 24 }) {
  const hasIcon = Boolean(icon);
  return (
    <Box sx={{ position: 'relative', mt: hasIcon ? '44px' : 0, ...sx }}>
      {hasIcon && <FloatingSectionIcon src={icon} right={iconRight} />}
      <Box
        sx={{
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid #F1DDD3',
          borderRadius: '22px',
          p: 3,
          pt: hasIcon ? '52px' : 3,
          position: 'relative',
        }}
      >
        {title && (
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: '#8A5E4A', mb: 2, fontSize: '15px' }}
          >
            {title}
          </Typography>
        )}
        {children}
      </Box>
    </Box>
  );
}
