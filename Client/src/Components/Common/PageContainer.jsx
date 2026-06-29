import React from 'react';
import { Box } from '@mui/material';

/**
 * Shared centered page wrapper.
 * Keeps content at max 1200px, centered, with responsive horizontal padding.
 * Does NOT add vertical padding — that comes from MainLayout.
 */
export default function PageContainer({ children, sx = {} }) {
  return (
    <Box
      sx={{
        maxWidth: 1200,
        marginInline: 'auto',
        width: '100%',
        px: { xs: 0, md: 1 },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
