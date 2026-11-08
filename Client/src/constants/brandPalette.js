// BakeryManager colours: cream, blush pink and deep burgundy.
// Shared by the sign-in pages (C1) and the app shell and dashboard (C2).
// Text/background pairs are checked for WCAG AA contrast in Components/Auth/authPalette.test.js.
export const brandPalette = {
  cream: '#FFF9F4',
  creamPanel: 'rgba(255, 249, 244, 0.86)',
  blush: '#F4DCD8',
  blushSoft: '#FBEFEC',
  blushDeep: '#E7B9B5',
  burgundy: '#7E1F37',
  burgundyDark: '#5E1428',
  ink: '#3B2420',
  muted: '#6E4B43',
  placeholder: '#7A5C54',
  border: '#EBD3CC',
  white: '#FFFFFF',
  // Chart marks (validated with the dataviz palette validator on #FFFFFF: lightness band,
  // CVD and normal-vision separation, >= 3:1 vs surface). Text never uses these.
  chartAccent: '#8A2540',
  chartNeutral: '#9C8A85', // deliberately gray: "no category" is de-emphasised, and always labelled
};
