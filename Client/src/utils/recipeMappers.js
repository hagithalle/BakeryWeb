import { normalizeUnit } from "./recipeIngredientLines";

// Maps a recipe from the server to the edit form.
// Every stored line is kept exactly (including the same ingredient twice); quantity and unit are shown as
// stored, never replaced by a default. A missing/invalid unit stays empty (null) so the user must choose one.
export default function mapServerRecipeToForm(recipe, ingredientsList = []) {
  if (!recipe) return null;

  const yieldAmount = recipe.outputUnits || recipe.OutputUnits || 1;
  const outputUnitType = recipe.outputUnitType ?? recipe.OutputUnitType ?? 0;

  // מתכוני בסיס
  const baseRecipes = (recipe.baseRecipes || recipe.BaseRecipes || []).map((br) => ({
    baseRecipeId: br.baseRecipeId ?? br.BaseRecipeId,
    name: br.baseRecipe?.name || br.BaseRecipe?.name || br.BaseRecipe?.Name || "",
    quantity: br.quantity ?? br.Quantity ?? null,
    unit: normalizeUnit(br.unit ?? br.Unit),
  }));

  // רכיבים: (before the fix, operator precedence applied this mapping only to the empty fallback, so the form
  // received raw server rows without name/amount and saving dropped them)
  const rawIngredients = recipe.ingredients || recipe.Ingredients || [];
  const ingredients = rawIngredients.map((ri) => {
    const nested = ri.ingredient || ri.Ingredient;
    const ingId = ri.ingredientId ?? ri.IngredientId ?? nested?.id ?? nested?.Id;
    const fullIngredient = ingredientsList.find((i) => String(i.id) === String(ingId));
    return {
      lineId: ri.id ?? ri.Id ?? null,
      ingredientId: ingId,
      name: fullIngredient?.name || fullIngredient?.ingredientName || nested?.name || nested?.Name || "",
      amount: ri.quantity ?? ri.Quantity ?? "",
      unit: normalizeUnit(ri.unit ?? ri.Unit),
    };
  });

  // שלבים
  const steps = [...(recipe.steps || recipe.Steps || [])]
    .sort((a, b) => (a.order || a.Order || 0) - (b.order || b.Order || 0))
    .map((s) => s.description || s.Description || "");

  return {
    // מידע בסיסי
    id: recipe.id,
    name: recipe.name || "",
    description: recipe.description || "",
    category: recipe.category || "לחמים",
    recipeType:
      typeof recipe.recipeType === "number"
        ? recipe.recipeType
        : recipe.recipeType === "Dairy"
        ? 0
        : recipe.recipeType === "Meat"
        ? 1
        : 2,
    imageUrl: recipe.imageUrl || null,

    // נתוני אפייה
    yieldAmount,
    outputUnitType,
    bakeTime: recipe.bakeTime || recipe.BakeTime || 0,
    prepTime: recipe.prepTime || recipe.PrepTime || 0,
    temperature: recipe.temperature || recipe.Temperature || 0,

    // טבלאות
    ingredients,
    steps,
    baseRecipes,

    // מקור
    source: "server",
  };
}

// ממפה תוצאה של ייבוא/AI למבנה טופס
// כאן נניח מה ה-AI מחזיר; תתאימי לפי ה-DTO שלך
export function mapImportedRecipeToForm(importedDraft) {
  if (!importedDraft) return null;

  return {
    name: importedDraft.name || "",
    description: importedDraft.description || "",
    category: importedDraft.category || "עוגות",
    recipeType:
      typeof importedDraft.recipeType === "number"
        ? importedDraft.recipeType
        : 2,
    imageUrl: importedDraft.imageUrl || null,
    yieldAmount: importedDraft.yieldAmount || 1,
    outputUnitType: importedDraft.outputUnitType ?? 0,
    bakeTime: importedDraft.bakeTime || 0,
    prepTime: importedDraft.prepTime || 0,
    temperature: importedDraft.temperature || 0,

    ingredients: importedDraft.ingredients || [],
    steps: importedDraft.steps || [],
    baseRecipes: importedDraft.baseRecipes || [],

    source: "import", // חשוב לצ'יפ ולכפתור "חזרה לייבוא"
  };
}
