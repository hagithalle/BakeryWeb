import { authPalette as p } from './authPalette';

// Styling for Clerk's prebuilt <SignIn>/<SignUp> (the only Clerk components the app renders).
// Visual only: sign-in methods, routing and redirects are configured in App.jsx and the Clerk dashboard.
const touchTarget = { minHeight: '44px' };
export const AUTH_CARD_MAX_WIDTH = 460;

export const clerkAppearance = {
  layout: {
    socialButtonsPlacement: 'top',
    socialButtonsVariant: 'blockButton',
  },
  variables: {
    colorPrimary: p.burgundy,
    colorPrimaryForeground: p.white,
    colorForeground: p.ink,
    colorMutedForeground: p.muted,
    colorBackground: '#FFFDFB',
    colorInput: p.white,
    colorInputForeground: p.ink,
    colorBorder: p.border,
    colorRing: p.burgundy,
    colorDanger: '#B3261E',
    borderRadius: '14px',
    fontFamily: '"Assistant", "Heebo", "Roboto", sans-serif',
    // Clerk's default base is 13px, which made hints and links too small; derived sizes scale from this.
    fontSize: '0.9375rem',
    // Slightly tighter than Clerk's 1rem default, so the sign-up form is less spread out.
    spacing: '0.875rem',
  },
  elements: {
    rootBox: { direction: 'rtl', width: '100%', display: 'flex', justifyContent: 'center' },
    cardBox: {
      width: '100%',
      maxWidth: `${AUTH_CARD_MAX_WIDTH}px`,
      borderRadius: '24px',
      border: `1px solid ${p.border}`,
      boxShadow: '0 18px 50px rgba(94, 20, 40, 0.12)',
    },
    card: { boxShadow: 'none', border: 'none', paddingBlock: '28px', paddingInline: '28px', gap: '22px' },
    headerTitle: {
      fontFamily: '"Suez One", "Assistant", serif',
      fontWeight: 400,
      fontSize: '28px',
      lineHeight: 1.25,
      color: p.burgundy,
    },
    headerSubtitle: { color: p.muted, fontSize: '15px' },
    socialButtonsBlockButton: {
      ...touchTarget,
      borderColor: p.border,
      '&:hover': { backgroundColor: '#FBF1EE' },
    },
    socialButtonsBlockButtonText: { color: p.ink, fontSize: '15px', fontWeight: 600 },
    dividerText: { color: p.muted, fontSize: '14px' },
    formFieldLabel: { color: p.ink, fontWeight: 600, fontSize: '15px' },
    // "אופציונלי" next to optional labels: readable size, AA colour.
    formFieldHintText: { color: p.muted, fontSize: '14px' },
    formFieldAction: { color: p.burgundy, fontSize: '14px', fontWeight: 600 },
    formFieldInput: {
      ...touchTarget,
      fontSize: '16px', // 16px+ stops iOS Safari from zooming into the field
      '&::placeholder': { color: p.placeholder, opacity: 1 },
      // Email addresses read left-to-right even in a Hebrew form.
      '&[type="email"], &[name="identifier"], &[name="emailAddress"]': { direction: 'ltr', textAlign: 'right' },
    },
    formButtonPrimary: {
      minHeight: '48px',
      background: `linear-gradient(135deg, ${p.burgundy} 0%, ${p.burgundyDark} 100%)`,
      textTransform: 'none',
      fontWeight: 700,
      fontSize: '16px',
      boxShadow: '0 8px 20px rgba(94, 20, 40, 0.22)',
      '&:hover': { background: p.burgundyDark },
    },
    footerActionText: { color: p.muted, fontSize: '15px' },
    footerActionLink: { color: p.burgundy, fontWeight: 700, fontSize: '15px' },
  },
};
