import React from 'react';
import { Box } from '@mui/material';
import bakeryManagerLogoUrl from '../../assets/branding/bakerymanager-logo.webp';

export const BAKERY_MANAGER_LOGO_ALT = 'BakeryManager – ניהול חכם לקונדיטוריות';
// Intrinsic size of the WebP (trimmed to the artwork), so the browser reserves the right space.
const LOGO_WIDTH = 438;
const LOGO_HEIGHT = 360;

/**
 * The universal BakeryManager software brand (same for every customer).
 * Deliberately separate from the personal bakery logo (assets/images/logo.png) shown inside the app.
 * Made from assets/images/Logo_BakearyManger.png: the cream paper background converted to
 * transparency and the empty margins trimmed, so it sits cleanly on any light surface.
 * `height` accepts a number or an MUI responsive value; the width follows the aspect ratio.
 * Pass alt="" when the name is already written next to the logo.
 */
export default function BakeryManagerLogo({ height = 140, alt = BAKERY_MANAGER_LOGO_ALT, sx }) {
  return (
    <Box
      component="img"
      src={bakeryManagerLogoUrl}
      alt={alt}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      decoding="async"
      sx={{
        display: 'block',
        height,
        width: 'auto',
        maxWidth: '100%',
        aspectRatio: `${LOGO_WIDTH} / ${LOGO_HEIGHT}`,
        objectFit: 'contain',
        ...sx,
      }}
    />
  );
}
