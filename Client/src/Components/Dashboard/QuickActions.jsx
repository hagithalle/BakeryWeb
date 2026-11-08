import React from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { brandPalette as p } from '../../constants/brandPalette';
import { QUICK_ACTIONS } from './quickActionsConfig';

function ActionCard({ action }) {
  const Icon = action.icon;
  const primary = Boolean(action.primary);
  return (
    <ButtonBase
      component={RouterLink}
      to={action.path}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1.5,
        minHeight: 84,
        p: 2,
        width: '100%',
        boxSizing: 'border-box',
        textAlign: 'right',
        borderRadius: '18px',
        border: `1px solid ${primary ? p.burgundy : p.border}`,
        background: primary ? `linear-gradient(135deg, ${p.burgundy} 0%, ${p.burgundyDark} 100%)` : p.white,
        color: primary ? p.white : p.ink,
        boxShadow: primary ? '0 10px 24px rgba(94, 20, 40, 0.22)' : '0 4px 16px rgba(94, 20, 40, 0.06)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: p.burgundy,
          boxShadow: primary ? '0 14px 28px rgba(94, 20, 40, 0.28)' : '0 10px 24px rgba(94, 20, 40, 0.10)',
        },
        '&.Mui-focusVisible': { outline: `3px solid ${primary ? p.blushDeep : p.burgundy}`, outlineOffset: 2 },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 48,
          height: 48,
          flexShrink: 0,
          borderRadius: '14px',
          display: 'grid',
          placeItems: 'center',
          bgcolor: primary ? 'rgba(255, 255, 255, 0.16)' : p.blushSoft,
          color: primary ? p.white : p.burgundy,
        }}
      >
        <Icon size={24} strokeWidth={1.9} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1.3, color: 'inherit' }}>{action.title}</Typography>
        <Typography sx={{ fontSize: 14, lineHeight: 1.4, mt: 0.25, color: primary ? 'rgba(255, 255, 255, 0.9)' : p.muted }}>
          {action.hint}
        </Typography>
      </Box>
      <ChevronLeft size={20} aria-hidden style={{ flexShrink: 0, opacity: 0.7 }} />
    </ButtonBase>
  );
}

export default function QuickActions() {
  return (
    <Box
      component="ul"
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        display: 'grid',
        gap: { xs: 1.25, md: 2 },
        // 2×2 keeps each hint on one line; four across only when cards stay ~320px+ wide.
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
      }}
    >
      {QUICK_ACTIONS.map((action) => (
        <Box component="li" key={action.id} sx={{ display: 'flex' }}>
          <ActionCard action={action} />
        </Box>
      ))}
    </Box>
  );
}
