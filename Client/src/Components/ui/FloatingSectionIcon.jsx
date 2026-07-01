import React from 'react';
import { Box } from '@mui/material';

export default function FloatingSectionIcon({ src, size = 64, imgSize = 44, right = 24 }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        top: -Math.round(size * 0.44),
        right,
        width: size,
        height: size,
        borderRadius: '18px',
        background: 'linear-gradient(135deg, #FFF7EF 0%, #FFF0E5 100%)',
        boxShadow: '0 10px 22px rgba(120,70,45,0.13)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        border: '1px solid #F3DDD0',
      }}
    >
      <Box
        component="img"
        src={src}
        alt=""
        sx={{ width: imgSize, height: imgSize, objectFit: 'contain' }}
      />
    </Box>
  );
}
