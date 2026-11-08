import React from 'react';
import { Box, Typography } from '@mui/material';
import { Store } from 'lucide-react';
import { brandPalette as p } from '../../constants/brandPalette';
import useBakeryIdentity from './useBakeryIdentity';

/** Logo if the bakery has one, otherwise a neutral initial-letter badge. */
function BakeryBadge({ identity, size = 44 }) {
  if (identity.logoUrl) {
    return (
      <Box
        component="img"
        src={identity.logoUrl}
        alt=""
        sx={{ width: size, height: size, borderRadius: '14px', objectFit: 'cover', flexShrink: 0, bgcolor: p.white }}
      />
    );
  }
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '14px',
        display: 'grid',
        placeItems: 'center',
        background: `linear-gradient(135deg, ${p.burgundy} 0%, ${p.burgundyDark} 100%)`,
        color: p.white,
        fontFamily: '"Suez One", "Assistant", serif',
        fontSize: size * 0.46,
        lineHeight: 1,
        boxShadow: '0 4px 12px rgba(94, 20, 40, 0.18)',
      }}
    >
      {identity.initial ?? <Store size={size * 0.5} strokeWidth={1.8} />}
    </Box>
  );
}

/** Badge + bakery name, for the sidebar header and the mobile top bar. */
export default function BakeryIdentity({ size = 44, compact = false }) {
  const identity = useBakeryIdentity();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      <BakeryBadge identity={identity} size={size} />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: '"Assistant", "Heebo", sans-serif',
            fontWeight: 800,
            fontSize: compact ? 15 : 17,
            color: p.ink,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {identity.name}
        </Typography>
        {!compact && !identity.hasOwnName && (
          <Typography sx={{ fontSize: 13, color: p.muted, lineHeight: 1.3 }}>
            ניהול המאפייה
          </Typography>
        )}
      </Box>
    </Box>
  );
}
