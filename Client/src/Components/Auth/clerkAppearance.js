// Styling for Clerk's prebuilt components, matching the bakery theme (see theme.jsx and the old login page).
export const clerkAppearance = {
  layout: {
    socialButtonsPlacement: 'top',
    socialButtonsVariant: 'blockButton',
  },
  variables: {
    colorPrimary: '#9B1F3A',
    colorForeground: '#3D2B1F',
    colorMutedForeground: '#8A5E4A',
    colorBackground: '#FFFDF9',
    colorInput: '#FFFDF9',
    colorInputForeground: '#3D2B1F',
    borderRadius: '14px',
    fontFamily: '"Assistant", "Heebo", "Roboto", sans-serif',
  },
  elements: {
    rootBox: { direction: 'rtl' },
    card: {
      border: '1px solid #F1DDD3',
      borderRadius: '28px',
      boxShadow: '0 20px 60px rgba(120,70,45,0.14)',
    },
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #9B1F3A 0%, #B7795A 100%)',
      textTransform: 'none',
      fontWeight: 700,
    },
  },
};
