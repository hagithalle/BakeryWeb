import { describe, it, expect } from 'vitest';
import { authPalette as p } from './authPalette';
import { clerkAppearance } from './clerkAppearance';

// WCAG 2.x relative luminance and contrast ratio for #RRGGBB colours.
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('auth palette contrast (WCAG AA, 4.5:1 for normal text)', () => {
  const pairs = [
    ['body text on cream', p.ink, p.cream],
    ['muted text on cream', p.muted, p.cream],
    ['burgundy text on cream', p.burgundy, p.cream],
    ['white on primary button (start)', p.white, p.burgundy],
    ['white on primary button (end)', p.white, p.burgundyDark],
    ['highlight chip text', p.burgundyDark, p.blush],
    ['input placeholder on white', p.placeholder, p.white],
    ['muted hint text on white input card', p.muted, p.white],
  ];

  it.each(pairs)('%s', (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('Clerk text colours meet AA on the Clerk card background', () => {
    const { colorForeground, colorMutedForeground, colorBackground, colorPrimary } = clerkAppearance.variables;
    for (const fg of [colorForeground, colorMutedForeground, colorPrimary]) {
      expect(contrast(fg, colorBackground)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('Clerk controls stay comfortable on mobile', () => {
  const { elements } = clerkAppearance;
  const px = (v) => parseFloat(v);

  it('inputs are at least 44px high with 16px text (no iOS zoom)', () => {
    expect(px(elements.formFieldInput.minHeight)).toBeGreaterThanOrEqual(44);
    expect(px(elements.formFieldInput.fontSize)).toBeGreaterThanOrEqual(16);
  });

  it('buttons are at least 44px high', () => {
    expect(px(elements.formButtonPrimary.minHeight)).toBeGreaterThanOrEqual(44);
    expect(px(elements.socialButtonsBlockButton.minHeight)).toBeGreaterThanOrEqual(44);
  });

  it('secondary text is at least 14px', () => {
    for (const key of ['formFieldHintText', 'dividerText', 'footerActionText', 'headerSubtitle']) {
      expect(px(elements[key].fontSize)).toBeGreaterThanOrEqual(14);
    }
  });
});
