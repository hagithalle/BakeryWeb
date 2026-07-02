import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function PageLoader({ message = 'טוענים את הנתונים...' }) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1200,
        mx: 'auto',
        my: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        py: 10,
        direction: 'rtl',
      }}
    >
      <Box sx={{ position: 'relative', width: 80, height: 80 }}>
        {/* Track ring */}
        <CircularProgress
          size={80}
          thickness={2.5}
          variant="determinate"
          value={100}
          sx={{ color: '#F1DDD3', position: 'absolute', top: 0, left: 0 }}
        />
        {/* Spinning ring */}
        <CircularProgress
          size={80}
          thickness={2.5}
          sx={{ color: '#9B1F3A', position: 'absolute', top: 0, left: 0 }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            userSelect: 'none',
          }}
        >
          🥐
        </Box>
      </Box>

      <Typography
        sx={{
          color: '#8A5E4A',
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: 0.3,
        }}
      >
        {message}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#B7795A',
              animationDelay: `${i * 0.2}s`,
              animation: 'loaderDot 1.4s ease-in-out infinite',
              '@keyframes loaderDot': {
                '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.35 },
                '40%': { transform: 'scale(1)', opacity: 1 },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
