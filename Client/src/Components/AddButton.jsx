import React from 'react';
import { Button, Box } from '@mui/material';

export default function AddButton({
  label,
  icon,
  onClick,
  disabled = false,
  sx = {},
}) {
  if (!label) return null;

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      disableElevation
      sx={{
        height: 68,
        px: 4.2,
        minWidth: 290,
        borderRadius: '999px',

        background: '#FFF8F2',
        color: '#9B1F3A',

        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 2.2,

        fontWeight: 700,
        fontSize: '18px',
        lineHeight: 1,
        whiteSpace: 'nowrap',

        boxShadow: '0 10px 24px rgba(120, 70, 45, 0.08)',
        transition: 'all .25s ease',
        textTransform: 'none',

        '&:hover': {
          background: '#FDF0E5',
          transform: 'translateY(-2px)',
          boxShadow: '0 14px 28px rgba(120, 70, 45, 0.14)',
        },

        '&:disabled': {
          opacity: 0.55,
          color: '#9B1F3A',
        },

        ...sx,
      }}
    >
      <Box component="span" sx={{ fontWeight: 700 }}>
        {label}
      </Box>
      
      {icon && (
        <Box
          component="img"
          src={icon}
          alt=""
          loading="lazy"
          sx={{
            width: 54,
            height: 54,
            objectFit: 'contain',
            flexShrink: 0,
            display: 'block',
          }}
        />
      )}

      
    </Button>
  );
}