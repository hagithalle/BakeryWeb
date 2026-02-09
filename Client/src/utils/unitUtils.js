// המרת יחידות מידה לעברית
export const getUnitDisplayName = (unit) => {
  const unitMap = {
    1: "קילו",      // Kilogram
    2: "גרם",       // Gram
    3: "ליטר",      // Liter
    4: "מ\"ל",      // Milliliter
    5: "יחידה",     // Unit
    6: "תריסר",     // Dozen
    7: "חבילה",     // Package
    8: "כפית",      // Teaspoon
    9: "כף",        // Tablespoon
    10: "כוס"       // Cup
  };
  
  return unitMap[unit] || "יחידה";
};

// המרת סוג מתכון לעברית
export const getRecipeTypeDisplayName = (recipeType) => {
  const typeMap = {
    0: "פרווה",
    1: "חלבי",
    2: "בשרי"
  };
  
  return typeMap[recipeType] || "פרווה";
};
