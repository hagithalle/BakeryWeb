// Recipe ingredient lines between the edit form and the server.
//
// Rules (data-loss prevention):
// - every row is either sent exactly as entered or the whole save is stopped with a list of problems;
//   a row is never silently skipped, and a missing/invalid quantity or unit is never replaced by a default;
// - repeated ingredients stay separate lines (the same ingredient can be used twice);
// - unit text (from AI import) is mapped only through an explicit table; unknown text stops the save.

export const VALID_UNITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // UnitOfMeasure on the server

const UNIT_TEXT = {
  1: ['ק"ג', 'קג', 'קילו', 'קילוגרם', 'kg', 'kilogram', 'kilograms'],
  2: ['גרם', 'גר', "ג'", 'ג', 'g', 'gr', 'gram', 'grams'],
  3: ['ליטר', 'ליטרים', 'l', 'liter', 'liters', 'litre', 'litres'],
  4: ['מ"ל', 'מל', 'מיליליטר', 'ml', 'milliliter', 'milliliters'],
  5: ['יחידה', 'יחידות', "יח'", 'יח', 'unit', 'units', 'pc', 'pcs', 'piece', 'pieces'],
  6: ['תריסר', 'dozen'],
  7: ['חבילה', 'חבילות', 'package', 'pack'],
  8: ['כפית', 'כפיות', 'tsp', 'teaspoon', 'teaspoons'],
  9: ['כף', 'כפות', 'tbsp', 'tablespoon', 'tablespoons'],
  10: ['כוס', 'כוסות', 'cup', 'cups'],
};
const normalizeText = (text) => String(text).trim().toLowerCase()
  .replace(/[״”“]/g, '"').replace(/[׳’`]/g, "'").replace(/\.$/, '');
const TEXT_TO_UNIT = new Map(
  Object.entries(UNIT_TEXT).flatMap(([unit, names]) => names.map((n) => [normalizeText(n), Number(unit)])),
);

/** A unit value from the form: a valid number (or numeric string), known unit text, or null. Never a default. */
export function normalizeUnit(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = Number(raw);
  if (Number.isInteger(n)) return VALID_UNITS.includes(n) ? n : null;
  return TEXT_TO_UNIT.get(normalizeText(raw)) ?? null;
}

/** A positive number, or null. */
export function parseQuantity(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Same thresholds as the server (Server/Services/Costing/RecipeUnits.cs, SuspiciousFrom).
export const SUSPICIOUS_FROM = { 1: 20, 3: 20, 2: 20000, 4: 20000, 5: 500, 6: 50, 7: 100, 8: 100, 9: 100, 10: 50 };

/** A quantity this large in one line is almost always a unit mistake (e.g. 500 L meant as 500 ml). */
export const isSuspiciousQuantity = (quantity, unit) => {
  const limit = SUSPICIOUS_FROM[unit];
  return limit !== undefined && Number(quantity) >= limit;
};

/** Inline warnings for one form row (shown in the editor before saving). */
export function ingredientLineFlags(row) {
  const flags = [];
  const quantity = parseQuantity(row?.amount);
  const unit = normalizeUnit(row?.unit);
  if (quantity === null) flags.push('כמות חסרה או לא תקינה');
  if (unit === null) flags.push('יש לבחור יחידת מידה');
  if (quantity !== null && unit !== null && isSuspiciousQuantity(quantity, unit)) {
    flags.push('כמות חריגה – לבדוק את היחידה (למשל מ"ל במקום ליטר)');
  }
  return flags;
}

const findIngredient = (row, ingredientsList) => {
  const list = ingredientsList || [];
  if (row.ingredientId !== undefined && row.ingredientId !== null && row.ingredientId !== '') {
    const byId = list.find((i) => String(i.id) === String(row.ingredientId));
    if (byId) return byId;
  }
  const name = (row.name || '').trim();
  return name ? list.find((i) => (i.name || i.ingredientName) === name) ?? null : null;
};

/**
 * Builds the server lines from the form rows.
 * @returns {{ lines: Array<{IngredientId:number, Quantity:number, Unit:number, name:string}>,
 *            problems: string[], unknownNames: string[] }}
 * Rows whose ingredient is not in the user's list are reported in `unknownNames` (the caller asks before
 * creating them, then builds again). The save must not continue while `problems` or `unknownNames` is non-empty.
 */
export function buildIngredientLines(rows, ingredientsList) {
  const lines = [];
  const problems = [];
  const unknownNames = [];
  (rows || []).forEach((row, index) => {
    const label = `שורה ${index + 1}${row?.name ? ` ("${row.name}")` : ''}`;
    const ingredient = findIngredient(row || {}, ingredientsList);
    const quantity = parseQuantity(row?.amount);
    const unit = normalizeUnit(row?.unit);
    if (!ingredient) {
      const name = (row?.name || '').trim();
      if (name) unknownNames.push(name);
      else problems.push(`${label}: לא נבחר חומר גלם`);
    }
    if (quantity === null) problems.push(`${label}: כמות חסרה או לא תקינה ("${row?.amount ?? ''}")`);
    if (unit === null) problems.push(`${label}: יחידת מידה חסרה או לא מוכרת ("${row?.unit ?? ''}")`);
    if (ingredient && quantity !== null && unit !== null) {
      lines.push({ IngredientId: ingredient.id, Quantity: quantity, Unit: unit, name: ingredient.name || row.name || '' });
    }
  });
  return { lines, problems, unknownNames: [...new Set(unknownNames)] };
}

/** Sub-recipe lines: a chosen recipe and a positive quantity; the unit is sent as entered (no default). */
export function buildBaseRecipeLines(rows) {
  const lines = [];
  const problems = [];
  (rows || []).forEach((row, index) => {
    const label = `מתכון בסיס ${index + 1}${row?.name ? ` ("${row.name}")` : ''}`;
    const baseRecipeId = Number(row?.baseRecipeId);
    const quantity = parseQuantity(row?.quantity);
    const unit = normalizeUnit(row?.unit);
    const validRecipe = Number.isInteger(baseRecipeId) && baseRecipeId > 0;
    if (!validRecipe) problems.push(`${label}: לא נבחר מתכון`);
    if (quantity === null) problems.push(`${label}: כמות חסרה או לא תקינה`);
    if (unit === null) problems.push(`${label}: יחידת מידה חסרה או לא תקינה`);
    if (validRecipe && quantity !== null && unit !== null) lines.push({ ...row, baseRecipeId, quantity, unit });
  });
  return { lines, problems };
}
