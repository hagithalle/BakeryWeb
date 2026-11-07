import React from 'react';
import { Box, GlobalStyles, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';
import BakeryManagerLogo from '../Branding/BakeryManagerLogo';
import { authPalette as p } from './authPalette';
import { AUTH_CARD_MAX_WIDTH } from './clerkAppearance';
import desktopPhotoUrl from '../../assets/images/auth-background.webp';
import mobilePhotoUrl from '../../assets/images/auth-background-mobile.webp';

const FONT = '"Assistant", "Heebo", "Roboto", sans-serif';
const PANEL_WIDTH = 'min(580px, 48vw)';
// The headline needs room between the panel and the flowers/cake in the photograph;
// below this width it would crowd them and compete with the form, so it is hidden there.
const WIDE = '@media (min-width: 1440px)';
const NO_MOTION = '@media (prefers-reduced-motion: reduce)';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: none; }
`;
const enter = (delayMs) => ({
  animation: `${fadeUp} 520ms ease-out ${delayMs}ms both`,
  [NO_MOTION]: { animation: 'none' },
});

/**
 * Branded page frame for the Clerk sign-in / sign-up components and account messages.
 * Desktop: full-bleed bakery photograph with a frosted cream panel on the left (clear of the cake).
 * Mobile: a cropped photo band, a compact BakeryManager badge and the form on cream.
 * Shows only the universal BakeryManager brand, never the personal bakery logo.
 */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <Box
      dir="rtl"
      sx={{
        position: 'relative',
        minHeight: '100dvh',
        width: '100%',
        overflowX: 'clip',
        bgcolor: p.cream,
        color: p.ink,
        fontFamily: FONT,
        display: 'flex',
        // In RTL, flex-end is the left side: the panel sits over the empty part of the photo.
        justifyContent: { md: 'flex-end' },
      }}
    >
      {/* Edge-to-edge page while an auth screen is mounted (removed again on unmount). */}
      <GlobalStyles styles={{ body: { margin: 0, backgroundColor: p.cream } }} />

      {/* Desktop photograph (decorative) */}
      <Box
        aria-hidden
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'fixed',
          inset: 0,
          backgroundImage: `url(${desktopPhotoUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: '70% center',
          backgroundColor: p.blush,
        }}
      />

      <Box
        component="main"
        sx={{
          position: 'relative',
          zIndex: 2,
          width: { xs: '100%', md: PANEL_WIDTH },
          minHeight: '100dvh',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: { md: 'center' },
          gap: { xs: 2, md: 2 },
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 0, md: 3.5 },
          pb: { xs: 3, md: 3 },
          bgcolor: { md: p.creamPanel },
          backdropFilter: { md: 'blur(18px) saturate(1.05)' },
          borderRight: { md: '1px solid rgba(255, 255, 255, 0.7)' },
          boxShadow: { md: '24px 0 64px rgba(94, 20, 40, 0.10)' },
        }}
      >
        {/* Mobile photo band, cropped to the cake (decorative) */}
        <Box
          aria-hidden
          sx={{
            display: { xs: 'block', md: 'none' },
            alignSelf: 'stretch',
            mx: { xs: -2, sm: -3 },
            height: 'clamp(170px, 30vh, 260px)',
            position: 'relative',
            backgroundImage: `url(${mobilePhotoUrl})`,
            backgroundSize: { xs: 'auto 175%', sm: 'cover' },
            backgroundPosition: { xs: '92% 72%', sm: '70% 60%' },
            backgroundRepeat: 'no-repeat',
            backgroundColor: p.blush,
            borderRadius: '0 0 28px 28px',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              background: `linear-gradient(180deg, rgba(255,249,244,0) 50%, rgba(255,249,244,0.85) 100%)`,
            },
          }}
        />

        {/* Brand: badge on mobile, large blended logo on desktop */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            mt: { xs: -7, md: 0 },
            px: { xs: 1.75, md: 0 },
            py: { xs: 1.5, md: 0 },
            bgcolor: { xs: p.cream, md: 'transparent' },
            border: { xs: `3px solid ${p.cream}`, md: 'none' },
            borderRadius: { xs: '28px', md: 0 },
            boxShadow: { xs: '0 10px 30px rgba(94, 20, 40, 0.16)', md: 'none' },
            overflow: 'hidden',
            lineHeight: 0,
            ...enter(0),
          }}
        >
          <BakeryManagerLogo height={{ xs: 76, md: 'clamp(104px, 15vh, 140px)' }} />
        </Box>

        {title && (
          <Box sx={{ textAlign: 'center', ...enter(60) }}>
            <Typography component="h1" sx={{ fontFamily: FONT, fontSize: 26, fontWeight: 800, color: p.burgundy, lineHeight: 1.2 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ fontFamily: FONT, fontSize: 15, color: p.muted, mt: 0.5 }}>{subtitle}</Typography>
            )}
          </Box>
        )}

        <Box sx={{ width: '100%', maxWidth: AUTH_CARD_MAX_WIDTH, display: 'flex', justifyContent: 'center', ...enter(80) }}>
          {children}
        </Box>

        <Typography
          component="p"
          sx={{ fontFamily: FONT, fontSize: 14, color: p.muted, textAlign: 'center', mt: { xs: 'auto', md: 0 }, pt: { xs: 1, md: 0 } }}
        >
          <bdi>BakeryManager</bdi> · ניהול חכם לקונדיטוריות
        </Typography>
      </Box>

      {/* Desktop headline, set directly on the soft pink upper part of the photograph (wide screens only) */}
      <Box
        data-testid="auth-tagline"
        sx={{
          display: 'none',
          [WIDE]: { display: 'flex' },
          position: 'absolute',
          zIndex: 1,
          top: '9vh',
          // The empty area between the panel and the flowers/cake, which start at ~70% of the width
          // (the photo is cover-scaled and focused at 70%); the text is centred within it.
          left: `calc(${PANEL_WIDTH} + 4vw)`,
          right: '32vw',
          justifyContent: 'center',
          ...enter(160),
        }}
      >
        <Box sx={{ maxWidth: 460, textAlign: 'center' }}>
          <Typography
            component="p"
            sx={{ fontFamily: '"Suez One", serif', fontSize: 'clamp(32px, 2.4vw, 44px)', lineHeight: 1.2, color: p.burgundy }}
          >
            {/* Fixed phrase break, so no single word is left alone on a line at any width. */}
            <Box component="span" sx={{ display: 'block' }}>כל הקונדיטוריה שלך</Box>
            <Box component="span" sx={{ display: 'block' }}>במקום אחד</Box>
          </Typography>
          <Typography sx={{ fontFamily: FONT, mt: 2, fontSize: 18, lineHeight: 1.65, color: p.ink, textWrap: 'balance' }}>
            מתכונים, חומרי גלם, עלויות ותמחור – מדויקים ומסודרים, כדי שיישאר יותר זמן לאפייה.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
