export default function mapServerRecipeToForm(recipe, ingredientsList = []) {
  if (!recipe) return null;

  const yieldAmount = recipe.outputUnits || recipe.OutputUnits || 1;
  const outputUnitType = recipe.outputUnitType ?? recipe.OutputUnitType ?? 0;

  // מיפוי מתכונים בסיסיים
  const baseRecipes = (recipe.baseRecipes || recipe.BaseRecipes || []).map(
    (br) => ({
      baseRecipeId: br.baseRecipeId || br.BaseRecipeId,
      name: br.baseRecipe?.name || br.BaseRecipe?.name || "",
      quantity: br.quantity || br.Quantity || 1,
      unit: br.unit ?? br.Unit ?? 5,
    })
  );

  // מיפוי רכיבים
  const ingredients =
    recipe.ingredients || recipe.Ingredients || []
      // מניעת כפילויות
      .filter((ri, idx, arr) => {
        const currentId =
          ri.ingredient?.id ||
          ri.Ingredient?.id ||
          ri.ingredientId ||
          ri.IngredientId;
        const firstIndex = arr.findIndex((x) => {
          const xId =
            x.ingredient?.id ||
            x.Ingredient?.id ||
            x.ingredientId ||
            x.IngredientId;
          return xId === currentId;
        });
        return firstIndex === idx;
      })
      .map((ri) => {
        const ingId =
          ri.ingredient?.id ||
          ri.Ingredient?.id ||
          ri.ingredientId ||
          ri.IngredientId;
        const fullIngredient =
          ingredientsList.find((i) => i.id === ingId) || {};

        return {
          ingredientId: ingId,
          name:
            fullIngredient.name ||
            fullIngredient.ingredientName ||
            ri.ingredient?.name ||
            ri.Ingredient?.name ||
            "",
          amount: ri.quantity || ri.Quantity || 0,
          unit: ri.unit ?? ri.Unit ?? 2,
        };
      });

  // מיפוי שלבים
  const steps =
    (recipe.steps || recipe.Steps || [])
      .sort(
        (a, b) => (a.order || a.Order || 0) - (b.order || b.Order || 0)
      )
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