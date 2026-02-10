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

// המרת כמות ליחידת בסיס (קילוגרם/ליטר) לחישוב עלות
export const convertToBaseUnit = (quantity, unit) => {
  switch (unit) {
    case 1: // Kilogram
      return quantity;
    case 2: // Gram
      return quantity / 1000;
    case 3: // Liter
      return quantity;
    case 4: // Milliliter
      return quantity / 1000;
    case 5: // Unit
      return quantity;
    case 6: // Dozen
      return quantity * 12;  // תריסר
    case 7: // Package
      return quantity;
    case 8: // Teaspoon
      return quantity * 0.005;  // כפית ≈ 5 גרם
    case 9: // Tablespoon
      return quantity * 0.015;  // כף ≈ 15 גרם
    case 10: // Cup
      return quantity * 0.240;  // כוס ≈ 240 מ"ל
    default:
      return quantity;
  }
};

// חישוב עלות רכיב
export const calculateIngredientCost = (ingredient, quantity) => {
  if (!ingredient || !ingredient.pricePerKg) {
    console.log('⚠️ calculateIngredientCost: Missing data', { ingredient, quantity });
    return 0;
  }
  
  // המרת unit למספר במקרה שהוא string
  const unitNumber = typeof ingredient.unit === 'string' ? parseInt(ingredient.unit) : ingredient.unit;
  
  const baseQuantity = convertToBaseUnit(quantity, unitNumber);
  const cost = ingredient.pricePerKg * baseQuantity;
  
  console.log('💰 calculateIngredientCost:', {
    name: ingredient.name,
    quantity: quantity,
    unit: ingredient.unit,
    unitType: typeof ingredient.unit,
    unitNumber: unitNumber,
    unitName: getUnitDisplayName(unitNumber),
    pricePerKg: ingredient.pricePerKg,
    baseQuantity: baseQuantity,
    calculation: `${ingredient.pricePerKg} × ${baseQuantity}`,
    cost: cost
  });
  
  return cost;
};
