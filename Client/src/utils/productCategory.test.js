import { describe, it, expect } from 'vitest';
import {
  resolveProductCategory, groupProductsByCategory, categoryFormState, categoryFromForm,
  OTHER_CATEGORY, UNCATEGORIZED_LABEL, MORE_CATEGORIES_LABEL,
} from './productCategory';

const product = (id, category, recipeCategory) => ({
  id,
  name: `p${id}`,
  category,
  ...(recipeCategory !== undefined && { recipe: { category: recipeCategory } }),
});
const summary = (result) => result.groups.map((g) => [g.label, g.count]);

describe('resolveProductCategory (same rule as the Products page filter)', () => {
  it('uses the product category first', () => {
    expect(resolveProductCategory(product(1, 'מארז חג', 'עוגות'))).toBe('מארז חג');
  });

  it('falls back to the recipe category, in camelCase or PascalCase', () => {
    expect(resolveProductCategory(product(1, null, 'עוגות'))).toBe('עוגות');
    expect(resolveProductCategory({ Id: 2, Category: '', Recipe: { Category: 'עוגיות' } })).toBe('עוגיות');
  });

  it('is empty when neither has a category', () => {
    expect(resolveProductCategory(product(1, null))).toBe('');
    expect(resolveProductCategory(product(1, '', ''))).toBe('');
  });
});

describe('groupProductsByCategory', () => {
  it('returns no groups for an empty or missing list', () => {
    expect(groupProductsByCategory([])).toEqual({ total: 0, groups: [] });
    expect(groupProductsByCategory(null)).toEqual({ total: 0, groups: [] });
  });

  it('groups by resolved category, ranked by count, ties alphabetical', () => {
    const result = groupProductsByCategory([
      product(1, 'מארז כללי'), product(2, 'מארז כללי'),
      product(3, 'מארז יום הולדת'), product(4, null, 'עוגות'),
    ]);
    expect(result.total).toBe(4);
    expect(summary(result)).toEqual([['מארז כללי', 2], ['מארז יום הולדת', 1], ['עוגות', 1]]);
  });

  it('puts products without any category in a "ללא קטגוריה" group, always last', () => {
    const result = groupProductsByCategory([product(1, null), product(2, ''), product(3, '  '), product(4, 'מארז חג')]);
    expect(summary(result)).toEqual([['מארז חג', 1], [UNCATEGORIZED_LABEL, 3]]);
    expect(result.groups.at(-1).kind).toBe('none');
  });

  it('keeps custom (free-text) categories as their own groups, merging whitespace variants', () => {
    const result = groupProductsByCategory([product(1, 'מארז ראש השנה'), product(2, ' מארז ראש השנה '), product(3, 'מארז חג')]);
    expect(summary(result)).toEqual([['מארז ראש השנה', 2], ['מארז חג', 1]]);
  });

  it('never double-counts a product returned twice', () => {
    const p1 = product(1, 'מארז חג');
    const result = groupProductsByCategory([p1, { ...p1 }, product(2, 'מארז חג')]);
    expect(result.total).toBe(2);
    expect(summary(result)).toEqual([['מארז חג', 2]]);
  });

  it('counts every product exactly once: group counts add up to the total and shares to 100%', () => {
    const list = [product(1, 'a'), product(2, 'b'), product(3, 'b'), product(4, null), product(5, 'c'), product(5, 'c')];
    const result = groupProductsByCategory(list);
    expect(result.groups.reduce((s, g) => s + g.count, 0)).toBe(result.total);
    expect(result.groups.reduce((s, g) => s + g.share, 0)).toBeCloseTo(1);
  });

  it('folds a long tail into "קטגוריות נוספות" without losing products', () => {
    const list = ['a', 'a', 'a', 'b', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((c, i) => product(i + 1, c));
    list.push(product(99, null));
    const result = groupProductsByCategory(list, { maxNamed: 4 });
    expect(summary(result)).toEqual([['a', 3], ['b', 2], ['c', 1], [MORE_CATEGORIES_LABEL, 5], [UNCATEGORIZED_LABEL, 1]]);
    expect(result.groups.find((g) => g.kind === 'more').categories).toBe(5);
    expect(result.groups.reduce((s, g) => s + g.count, 0)).toBe(result.total);
  });
});

describe('product form: editing a custom category (regression)', () => {
  it('opens a stored custom category as "אחר" with its text, not an empty dropdown', () => {
    expect(categoryFormState('מארז ראש השנה')).toEqual({ category: OTHER_CATEGORY, customCategory: 'מארז ראש השנה', showCustomCategory: true });
  });

  it('opens predefined categories and empty values as before', () => {
    expect(categoryFormState('מארז חג')).toEqual({ category: 'מארז חג', customCategory: '', showCustomCategory: false });
    expect(categoryFormState('')).toEqual({ category: '', customCategory: '', showCustomCategory: false });
    expect(categoryFormState(null)).toEqual({ category: '', customCategory: '', showCustomCategory: false });
  });

  it('round-trips: editing and saving without changes keeps the stored category', () => {
    for (const stored of ['מארז ראש השנה', 'מארז חג', 'עוגות שמרים']) {
      expect(categoryFromForm(categoryFormState(stored))).toBe(stored);
    }
  });
});
