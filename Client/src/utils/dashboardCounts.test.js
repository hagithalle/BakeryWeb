import { describe, it, expect } from 'vitest';
import { countsFromSettled, hasFailedCounts } from './dashboardCounts';

const ok = (n) => ({ status: 'fulfilled', value: Array.from({ length: n }) });
const failed = { status: 'rejected', reason: new Error('network') };

describe('dashboard counts', () => {
  it('counts each list in order: products, recipes, ingredients, packaging', () => {
    expect(countsFromSettled([ok(3), ok(5), ok(12), ok(0)])).toEqual({ products: 3, recipes: 5, ingredients: 12, packaging: 0 });
  });

  it('reports a failed or malformed source as null, never as zero', () => {
    const counts = countsFromSettled([ok(3), failed, { status: 'fulfilled', value: { items: [] } }, ok(2)]);
    expect(counts).toEqual({ products: 3, recipes: null, ingredients: null, packaging: 2 });
    expect(hasFailedCounts(counts)).toBe(true);
  });

  it('a real zero is not a failure', () => {
    expect(hasFailedCounts(countsFromSettled([ok(0), ok(0), ok(0), ok(0)]))).toBe(false);
  });
});
