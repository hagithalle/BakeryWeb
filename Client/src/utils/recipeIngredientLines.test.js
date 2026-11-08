import { describe, it, expect } from 'vitest';
import mapServerRecipeToForm from './recipeMappers';
import {
  normalizeUnit, parseQuantity, isSuspiciousQuantity, buildIngredientLines, buildBaseRecipeLines, ingredientLineFlags,
} from './recipeIngredientLines';

// What GET /api/recipe returns (camelCase), with the nested ingredient.
const ingredientsList = [
  { id: 3, name: 'שוקולד מריר 55%' }, { id: 47, name: 'שוקולד חלב 35%' }, { id: 49, name: 'שמנת מתוקה' },
  { id: 50, name: 'קפה' }, { id: 2, name: 'סוכר' },
];
const serverRecipe = {
  id: 5, name: 'כדורי שוקולד', outputUnits: 70,
  ingredients: [
    { id: 212, ingredientId: 3, ingredient: { id: 3, name: 'שוקולד מריר 55%' }, quantity: 60, unit: 2 },
    { id: 213, ingredientId: 47, ingredient: { id: 47, name: 'שוקולד חלב 35%' }, quantity: 500, unit: 2 },
    { id: 214, ingredientId: 50, ingredient: { id: 50, name: 'קפה' }, quantity: 1, unit: 9 },
    { id: 216, ingredientId: 49, ingredient: { id: 49, name: 'שמנת מתוקה' }, quantity: 500, unit: 4 },
  ],
  steps: [{ order: 2, description: 'שני' }, { order: 1, description: 'ראשון' }],
  baseRecipes: [],
};

describe('edit form mapping (regression: names/quantities were lost in edit mode)', () => {
  it('maps every stored line with its name, quantity and unit', () => {
    const form = mapServerRecipeToForm(serverRecipe, ingredientsList);
    expect(form.ingredients).toEqual([
      { lineId: 212, ingredientId: 3, name: 'שוקולד מריר 55%', amount: 60, unit: 2 },
      { lineId: 213, ingredientId: 47, name: 'שוקולד חלב 35%', amount: 500, unit: 2 },
      { lineId: 214, ingredientId: 50, name: 'קפה', amount: 1, unit: 9 },
      { lineId: 216, ingredientId: 49, name: 'שמנת מתוקה', amount: 500, unit: 4 },
    ]);
    expect(form.steps).toEqual(['ראשון', 'שני']);
  });

  it('keeps the same ingredient twice (no de-duplication)', () => {
    const recipe = { ...serverRecipe, ingredients: [
      { id: 1, ingredientId: 2, quantity: 100, unit: 2 },
      { id: 2, ingredientId: 2, quantity: 30, unit: 2 },
    ] };
    const form = mapServerRecipeToForm(recipe, ingredientsList);
    expect(form.ingredients.map((i) => [i.lineId, i.name, i.amount])).toEqual([[1, 'סוכר', 100], [2, 'סוכר', 30]]);
  });

  it('never defaults a missing/invalid unit or quantity', () => {
    const recipe = { ...serverRecipe, ingredients: [
      { id: 1, ingredientId: 2, quantity: 0, unit: 0 },
      { id: 2, ingredientId: 2, unit: null },
    ] };
    const [a, b] = mapServerRecipeToForm(recipe, ingredientsList).ingredients;
    expect(a).toMatchObject({ amount: 0, unit: null });
    expect(b).toMatchObject({ amount: '', unit: null });
  });

  it('PascalCase server rows map the same way', () => {
    const form = mapServerRecipeToForm({ Id: 9, Ingredients: [{ Id: 7, IngredientId: 2, Quantity: 5, Unit: 1 }] }, ingredientsList);
    expect(form.ingredients).toEqual([{ lineId: 7, ingredientId: 2, name: 'סוכר', amount: 5, unit: 1 }]);
  });
});

describe('save payload (regression: rows were silently skipped and lines deleted)', () => {
  it('round-trips stored lines exactly: edit then save without changes sends the same lines', () => {
    const form = mapServerRecipeToForm(serverRecipe, ingredientsList);
    const { lines, problems, unknownNames } = buildIngredientLines(form.ingredients, ingredientsList);
    expect(problems).toEqual([]);
    expect(unknownNames).toEqual([]);
    expect(lines.map(({ IngredientId, Quantity, Unit }) => ({ IngredientId, Quantity, Unit }))).toEqual(
      serverRecipe.ingredients.map((l) => ({ IngredientId: l.ingredientId, Quantity: l.quantity, Unit: l.unit })),
    );
  });

  it('keeps duplicate ingredient lines as separate lines', () => {
    const rows = [{ ingredientId: 2, name: 'סוכר', amount: 100, unit: 2 }, { ingredientId: 2, name: 'סוכר', amount: 30, unit: 2 }];
    expect(buildIngredientLines(rows, ingredientsList).lines.map((l) => l.Quantity)).toEqual([100, 30]);
  });

  it('reports every invalid row instead of skipping it (and sends nothing for it)', () => {
    const rows = [
      { ingredientId: 2, name: 'סוכר', amount: '', unit: 2 },
      { ingredientId: 3, name: 'שוקולד מריר 55%', amount: 0, unit: 2 },
      { ingredientId: 47, name: 'שוקולד חלב 35%', amount: 10, unit: null },
      { ingredientId: 50, name: 'קפה', amount: 1, unit: 'כוסית' },
      { ingredientId: '', name: '', amount: 5, unit: 2 },
      { ingredientId: 49, name: 'שמנת מתוקה', amount: 500, unit: 4 },
    ];
    const { lines, problems } = buildIngredientLines(rows, ingredientsList);
    expect(problems).toHaveLength(5);
    expect(problems.join('\n')).toMatch(/שורה 1.*כמות/);
    expect(problems.join('\n')).toMatch(/שורה 2.*כמות/);
    expect(problems.join('\n')).toMatch(/שורה 3.*יחידת מידה/);
    expect(problems.join('\n')).toMatch(/שורה 4.*כוסית/);
    expect(problems.join('\n')).toMatch(/שורה 5.*לא נבחר חומר גלם/);
    expect(lines).toHaveLength(1); // the caller must not save at all while problems exist
  });

  it('asks about unknown ingredient names instead of creating them silently', () => {
    const { unknownNames, problems } = buildIngredientLines([{ name: 'פיסטוק', amount: 50, unit: 2 }], ingredientsList);
    expect(unknownNames).toEqual(['פיסטוק']);
    expect(problems).toEqual([]);
  });

  it('sub-recipe lines need a recipe, a positive quantity and a valid unit (no silent 1 / unit defaults)', () => {
    const { lines, problems } = buildBaseRecipeLines([
      { baseRecipeId: 9, name: 'ממרח', quantity: 2, unit: 5 },
      { baseRecipeId: 9, name: 'ממרח', quantity: null, unit: 5 },
      { baseRecipeId: 0, name: 'x', quantity: 1, unit: 5 },
    ]);
    expect(lines).toHaveLength(1);
    expect(problems).toHaveLength(2);
  });
});

describe('units', () => {
  it('accepts valid unit numbers and explicit unit text only', () => {
    expect(normalizeUnit(4)).toBe(4);
    expect(normalizeUnit('3')).toBe(3);
    expect(normalizeUnit('מ"ל')).toBe(4);
    expect(normalizeUnit('מ״ל')).toBe(4);
    expect(normalizeUnit('ליטר')).toBe(3);
    expect(normalizeUnit('ml')).toBe(4);
    expect(normalizeUnit('כף')).toBe(9);
    expect(normalizeUnit('כפית')).toBe(8);
    expect(normalizeUnit('ק"ג')).toBe(1);
    expect(normalizeUnit(0)).toBeNull();
    expect(normalizeUnit(11)).toBeNull();
    expect(normalizeUnit('')).toBeNull();
    expect(normalizeUnit('קורט')).toBeNull();
  });

  it('parses only positive quantities', () => {
    expect(parseQuantity('2,5')).toBe(2.5);
    expect(parseQuantity(0)).toBeNull();
    expect(parseQuantity(-1)).toBeNull();
    expect(parseQuantity('abc')).toBeNull();
  });

  it('flags 500 liters (and 200 kg) as suspicious, not 500 ml or 200 g', () => {
    expect(isSuspiciousQuantity(500, 3)).toBe(true);
    expect(isSuspiciousQuantity(200, 1)).toBe(true);
    expect(isSuspiciousQuantity(500, 4)).toBe(false);
    expect(isSuspiciousQuantity(200, 2)).toBe(false);
    expect(isSuspiciousQuantity(19.9, 1)).toBe(false);
    expect(isSuspiciousQuantity(600, 5)).toBe(true);
  });

  it('shows inline flags while editing', () => {
    expect(ingredientLineFlags({ amount: 500, unit: 3 })).toEqual(['כמות חריגה – לבדוק את היחידה (למשל מ"ל במקום ליטר)']);
    expect(ingredientLineFlags({ amount: '', unit: null })).toEqual(['כמות חסרה או לא תקינה', 'יש לבחור יחידת מידה']);
    expect(ingredientLineFlags({ amount: 500, unit: 4 })).toEqual([]);
  });
});
