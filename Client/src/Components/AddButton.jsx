import React from 'react';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

/**
 * Unified Add Button Component
 * Used across all pages for consistent design: "הוסף חומר גלם", "מוצר חדש", "מתכון חדש", etc.
 * 
 * @param {function} onClick - Click handler
 * @param {React.ReactNode} children - Button text
 * @param {object} props - Additional MUI Button props
 */
export default function AddButton({ onClick, children, ...props }) {
  return (
    <Button
      variant="contained"
      startIcon={<AddIcon sx={{ mr: 1 }} />}
      onClick={onClick}
      sx={{
        backgroundColor: '#C98929',
        color: 'white',
        borderRadius: 2,
        px: 3,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        '&:hover': {
          backgroundColor: '#9B5A25'
        }
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
