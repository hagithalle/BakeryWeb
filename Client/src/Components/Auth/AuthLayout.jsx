import React from 'react';
import { Box, Typography } from '@mui/material';
import logoUrl from '../../assets/images/logo.png';

/**
 * Branded page frame for the Clerk sign-in / sign-up components and account messages.
 */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFF8F2 0%, #FBF0E8 50%, #F7E8DC 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 2,
        direction: 'rtl',
      }}
    >
      {/* Decorative blobs */}
      <Box aria-hidden sx={{ position: 'fixed', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(155,31,58,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <Box aria-hidden sx={{ position: 'fixed', bottom: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(183,121,90,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <Box component="img" src={logoUrl} alt="לוגו" sx={{ height: 90, objectFit: 'contain' }} />

      {title && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#9B1F3A', lineHeight: 1.2 }}>{title}</Typography>
          {subtitle && <Typography sx={{ fontSize: 14, color: '#8A5E4A', mt: 0.5 }}>{subtitle}</Typography>}
        </Box>
      )}

      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
        {children}
      </Box>
    </Box>
  );
}
