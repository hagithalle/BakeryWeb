import { describe, it, expect } from 'vitest';
import { isCostBlocked, isLineBlocked, blockingWarnings, infoWarnings, costText } from './costStatus';

const vat = { code: 'PurchaseVatUnknown', message: 'מע"מ', blocking: false, recipeId: 5, lineId: 212 };
const unit = { code: 'ApproximateConversion', message: 'קפה', blocking: true, recipeId: 5, lineId: 214 };
const childLine = { code: 'ZeroPrice', message: 'ילד', blocking: true, recipeId: 9, lineId: 214 };

describe('blocked cost display', () => {
  it('a recipe/product is blocked by status or by any blocking warning', () => {
    expect(isCostBlocked({ costStatus: 'Blocked' })).toBe(true);
    expect(isCostBlocked({ costWarnings: [vat, unit] })).toBe(true);
    expect(isCostBlocked({ costStatus: 'Complete', costWarnings: [vat] })).toBe(false);
    expect(isCostBlocked(null)).toBe(false);
  });

  it('non-blocking (VAT) warnings never block', () => {
    expect(blockingWarnings([vat, unit])).toEqual([unit]);
    expect(infoWarnings([vat, unit])).toEqual([vat]);
  });

  it('a line is blocked only by a warning for the same recipe and line (sub-recipe ids can repeat)', () => {
    expect(isLineBlocked([vat, unit], 5, 214)).toBe(true);
    expect(isLineBlocked([vat, unit], 5, 212)).toBe(false);
    expect(isLineBlocked([childLine], 5, 214)).toBe(false);
  });

  it('never shows a number for a blocked cost', () => {
    expect(costText(15000, true)).toBe('—');
    expect(costText(15, false)).toBe('₪15.00');
  });
});
