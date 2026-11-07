import { describe, it, expect } from 'vitest';
import { heIL } from '@clerk/localizations';
import { clerkLocalization, PRODUCT_NAME } from './clerkLocalization';

const allStrings = (value) =>
  typeof value === 'string' ? [value]
    : value && typeof value === 'object' ? Object.values(value).flatMap(allStrings) : [];

describe('Clerk Hebrew localization', () => {
  it('never shows the Clerk dashboard application name (e.g. BakeryWeb)', () => {
    const strings = allStrings(clerkLocalization);
    expect(strings.some((s) => s.includes('{{applicationName}}'))).toBe(false);
    expect(clerkLocalization.signIn.emailCode.subtitle).toContain(PRODUCT_NAME);
  });

  it('uses neutral headings on the main screens', () => {
    expect(clerkLocalization.signIn.start.title).toBe('התחברות');
    expect(clerkLocalization.signUp.start.title).toBe('יצירת חשבון');
    expect(clerkLocalization.signUp.start.titleCombined).toBe('יצירת חשבון');
    expect(clerkLocalization.signUp.start.actionLink).toBe('התחברות');
    expect(clerkLocalization.signIn.start.subtitle).toContain(PRODUCT_NAME);
    expect(clerkLocalization.signUp.start.subtitle).toContain(PRODUCT_NAME);
  });

  it('keeps the rest of the stock Hebrew localization', () => {
    expect(clerkLocalization.locale).toBe(heIL.locale);
    expect(clerkLocalization.formFieldLabel__emailAddress).toBe(heIL.formFieldLabel__emailAddress);
    expect(clerkLocalization.signIn.start.actionText).toBe(heIL.signIn.start.actionText);
    expect(Object.keys(clerkLocalization.signIn)).toEqual(expect.arrayContaining(Object.keys(heIL.signIn)));
    expect(Object.keys(clerkLocalization.signUp)).toEqual(expect.arrayContaining(Object.keys(heIL.signUp)));
  });
});
