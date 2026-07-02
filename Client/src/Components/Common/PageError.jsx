import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function PageError({
  message = 'אירעה שגיאה בטעינת הנתונים',
  description = 'ייתכן שיש בעיה בחיבור לשרת. אנא נסו שוב.',
  onRetry,
}) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1200,
        mx: 'auto',
        my: 6,
        direction: 'rtl',
      }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #FFF8F5 0%, #FDF2EF 100%)',
          border: '1px solid #F1D5C8',
          borderRadius: '22px',
          boxShadow: '0 4px 20px rgba(155,31,58,0.07)',
          px: { xs: 3, md: 6 },
          py: { xs: 6, md: 9 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2.5,
          textAlign: 'center',
        }}
      >
        <Box sx={{ fontSize: 56, lineHeight: 1, userSelect: 'none' }}>🍞</Box>

        <Typography
          component="h2"
          sx={{
            fontSize: { xs: 22, md: 28 },
            fontWeight: 800,
            color: '#9B1F3A',
            lineHeight: 1.2,
          }}
        >
          {message}
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: 14, md: 15 },
            color: '#8A5E4A',
            maxWidth: 400,
            lineHeight: 1.7,
          }}
        >
          {description}
        </Typography>

        {onRetry && (
          <Button
            onClick={onRetry}
            sx={{
              mt: 1.5,
              background: '#9B1F3A',
              color: 'white',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: 15,
              px: 4.5,
              py: 1.3,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(155,31,58,0.22)',
              '&:hover': { background: '#7D1830', transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
            }}
          >
            נסה שוב
          </Button>
        )}
      </Box>
    </Box>
  );
}
