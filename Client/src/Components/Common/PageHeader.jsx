import React from 'react';
import { Box, Typography, useMediaQuery } from '@mui/material';
import AddButton from '../AddButton';

function WavyBottom() {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 24,
        pointerEvents: 'none',
      }}
    >
      <svg
        viewBox="0 0 1200 24"
        preserveAspectRatio="none"
        style={{ width: '100%', height: 24, display: 'block' }}
      >
        <path
          d="M0,12 C100,4 200,20 300,12 C400,4 500,20 600,12 C700,4 800,20 900,12 C1000,4 1100,20 1200,12"
          fill="none"
          stroke="#E8BFAE"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.45"
        />
      </svg>
    </Box>
  );
}

export default function PageHeader({
  title,
  subtitle,
  illustration,
  actionLabel,
  actionIcon,
  onActionClick,
  actionNode,
  centered = false,
}) {
  const isMobile = useMediaQuery('(max-width:768px)');
  const hasAction = Boolean(actionNode || (actionLabel && onActionClick));

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1200,
        mx: 'auto',
        mb: 3,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          direction: 'rtl',
          background: 'linear-gradient(135deg, #FFFDF9 0%, #FBF1EC 100%)',
          border: '1px solid #E8D5C4',
          borderRadius: '22px',
          boxShadow: '0 8px 24px rgba(120, 70, 45, 0.08)',
          px: { xs: 3, md: 5 },
          py: { xs: 3, md: 4 },
          pb: { xs: 4.5, md: 5 },
          minHeight: { xs: centered ? 160 : (hasAction ? 230 : 180), md: 180 },
        }}
      >
        {centered ? (
          /* ── Centered layout: icon | title+subtitle+button | icon mirrored ── */
          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: { xs: 2, md: 3 },
              textAlign: 'center',
            }}
          >
            {illustration && (
              <Box
                component="img"
                src={illustration}
                aria-hidden
                alt=""
                loading="lazy"
                sx={{
                  width: { xs: 70, md: 120 },
                  height: 'auto',
                  objectFit: 'contain',
                  flexShrink: 0,
                  filter: 'drop-shadow(0 8px 16px rgba(120,70,45,0.18))',
                  transform: 'scaleX(-1)',
                  display: { xs: 'none', md: 'block' },
                }}
              />
            )}

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: 28, md: 42 },
                  fontWeight: 800,
                  color: '#9B1F3A',
                  lineHeight: 1.1,
                  letterSpacing: '-0.5px',
                }}
              >
                {title}
              </Typography>

              {subtitle && (
                <Typography
                  sx={{
                    fontSize: { xs: 14, md: 16 },
                    color: '#8A5E4A',
                    lineHeight: 1.5,
                  }}
                >
                  {subtitle}
                </Typography>
              )}

              {hasAction && (
                <Box sx={{ mt: 1 }}>
                  <AddButton
                    label={actionLabel}
                    icon={actionIcon}
                    onClick={onActionClick}
                  />
                </Box>
              )}
            </Box>

            {illustration && (
              <Box
                component="img"
                src={illustration}
                aria-hidden
                alt=""
                loading="lazy"
                sx={{
                  width: { xs: 70, md: 120 },
                  height: 'auto',
                  objectFit: 'contain',
                  flexShrink: 0,
                  filter: 'drop-shadow(0 8px 16px rgba(120,70,45,0.18))',
                  display: { xs: 'none', md: 'block' },
                }}
              />
            )}
          </Box>
        ) : (
          /* ── Default layout: title+icon right | button left ── */
          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: { xs: 3, md: 4 },
            }}
          >
            {/* Right side: illustration + title */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: { xs: 'center', md: 'flex-start' },
                gap: { xs: 2, md: 3 },
                width: { xs: '100%', md: 'auto' },
                textAlign: 'right',
              }}
            >
              {illustration && (
                <Box
                  component="img"
                  src={illustration}
                  alt=""
                  loading="lazy"
                  sx={{
                    width: { xs: 88, md: 145 },
                    height: 'auto',
                    objectFit: 'contain',
                    flexShrink: 0,
                    filter: 'drop-shadow(0 8px 16px rgba(120,70,45,0.18))',
                  }}
                />
              )}

              <Box>
                <Typography
                  component="h1"
                  sx={{
                    fontSize: { xs: 30, md: 46 },
                    fontWeight: 800,
                    color: '#9B1F3A',
                    lineHeight: 1.1,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {title}
                </Typography>

                {subtitle && (
                  <Typography
                    sx={{
                      fontSize: { xs: 14, md: 16 },
                      color: '#8A5E4A',
                      mt: 0.7,
                      lineHeight: 1.5,
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Left side: action area */}
            {hasAction && (
              <Box
                sx={{
                  width: { xs: '100%', md: 'auto' },
                  display: 'flex',
                  justifyContent: { xs: 'center', md: 'flex-start' },
                }}
              >
                {actionNode ?? (
                  <AddButton
                    label={actionLabel}
                    icon={actionIcon}
                    onClick={onActionClick}
                    sx={{ minWidth: { xs: 220, md: 'auto' } }}
                  />
                )}
              </Box>
            )}
          </Box>
        )}

        <WavyBottom />
      </Box>
    </Box>
  );
}
