import { getField } from './productForm';

// Product categories offered by the product form. "אחר" lets the user type their own category;
// the typed text (not the word "אחר") is what gets stored on the product.
export const OTHER_CATEGORY = 'אחר';
export const PREDEFINED_PRODUCT_CATEGORIES = [
  'מארז יום הולדת',
  'מארז יום אהבה',
  'מארז פורים',
  'מארז חג',
  'מארז כללי',
  OTHER_CATEGORY,
];

export const UNCATEGORIZED_LABEL = 'ללא קטגוריה';
export const MORE_CATEGORIES_LABEL = 'קטגוריות נוספות';

/**
 * A product's category, resolved exactly like the Products page filter:
 * the product's own category, otherwise its recipe's category, otherwise "".
 */
export function resolveProductCategory(product) {
  const recipe = getField(product, 'recipe', 'Recipe');
  return getField(product, 'category', 'Category') || recipe?.category || recipe?.Category || '';
}

/**
 * Product-form state for a stored category (fixes editing products with a custom category):
 * a value that is not one of the predefined options is a custom category, so the form shows
 * "אחר" with the custom text filled in instead of an empty dropdown.
 */
export function categoryFormState(stored, predefined = PREDEFINED_PRODUCT_CATEGORIES) {
  const value = (stored ?? '').trim();
  if (!value) return { category: '', customCategory: '', showCustomCategory: false };
  if (value === OTHER_CATEGORY) return { category: OTHER_CATEGORY, customCategory: '', showCustomCategory: true };
  if (predefined.includes(value)) return { category: value, customCategory: '', showCustomCategory: false };
  return { category: OTHER_CATEGORY, customCategory: value, showCustomCategory: true };
}

/** The category the product form saves: the custom text when "אחר" is chosen, otherwise the option. */
export const categoryFromForm = ({ category, customCategory, showCustomCategory }) =>
  (showCustomCategory ? customCategory : category);

/**
 * Real products grouped by resolved category, for the dashboard chart.
 * - Each product counts once (duplicates by id are ignored).
 * - Surrounding whitespace is ignored; an empty category goes to "ללא קטגוריה" (always last).
 * - Named categories are ranked by count (ties alphabetically); past `maxNamed`, the tail is
 *   folded into one "קטגוריות נוספות" row so the chart stays readable.
 * @returns {{ total: number, groups: Array<{ key: string, label: string, count: number, share: number, kind: 'category'|'more'|'none', categories?: number }> }}
 */
export function groupProductsByCategory(products, { maxNamed = 6 } = {}) {
  const seen = new Set();
  const counts = new Map();
  let uncategorized = 0;
  let total = 0;

  for (const product of Array.isArray(products) ? products : []) {
    if (!product) continue;
    const id = getField(product, 'id', 'Id');
    if (id != null) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    total += 1;
    const category = String(resolveProductCategory(product)).trim();
    if (!category) uncategorized += 1;
    else counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  const share = (count) => (total ? count / total : 0);
  const named = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'he'))
    .map(([label, count]) => ({ key: `c:${label}`, label, count, share: share(count), kind: 'category' }));

  let groups = named;
  if (named.length > maxNamed) {
    const kept = named.slice(0, maxNamed - 1);
    const rest = named.slice(maxNamed - 1);
    const restCount = rest.reduce((sum, g) => sum + g.count, 0);
    groups = [...kept, { key: 'more', label: MORE_CATEGORIES_LABEL, count: restCount, share: share(restCount), kind: 'more', categories: rest.length }];
  }
  if (uncategorized > 0) {
    groups = [...groups, { key: 'none', label: UNCATEGORIZED_LABEL, count: uncategorized, share: share(uncategorized), kind: 'none' }];
  }
  return { total, groups };
}
