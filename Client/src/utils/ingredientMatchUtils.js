// src/Components/Recipes/Import/ingredientMatchUtils.js

// ניקוי שם – להוריד רווחים, אחוזים, סוגריים וכו'
function normalizeName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[%(),]/g, "")
    .trim();
}

// מחזיר את החומר גלם הקיים הקרוב ביותר בשם
export function findClosestIngredient(importedName, ingredientsList) {
  const normImported = normalizeName(importedName);
  let best = null;
  let bestScore = 0;

  for (const ing of ingredientsList || []) {
    const normExisting = normalizeName(ing.name || ing.ingredientName || "");
    if (!normExisting) continue;

    // ניקח ניקוד פשוט: כמה המחרוזת דומה (contains / startsWith)
    let score = 0;

    if (normExisting === normImported) score = 100;
    else if (normExisting.includes(normImported) || normImported.includes(normExisting)) score = 70;
    else if (normExisting.startsWith(normImported) || normImported.startsWith(normExisting)) score = 60;

    if (score > bestScore) {
      bestScore = score;
      best = ing;
    }
  }

  // רק אם יש התאמה סבירה (אפשר לכוון הסף)
  if (bestScore >= 60) {
    return { ingredient: best, score: bestScore };
  }

  return null;
}

// מפצל את מרכיבי ה-AI: התאמות ישירות + חסרים
function splitImportedIngredients(imported, ingredientsList) {
  const matched = [];
  const missing = [];

  imported.forEach((ing) => {
    const name = (ing.name || "").trim();
    if (!name) return;

    // התאמה בסיסית לפי שם
    const exact = ingredientsList.find(i =>
      i.name === name || i.ingredientName === name
    );

    if (exact) {
      matched.push({
        ingredientId: exact.id,
        name: exact.name || exact.ingredientName,
        amount: ing.amount,
        unit: ing.unit ?? 2
      });
      return;
    }

    // נסי למצוא הצעה קרובה – לדוגמה "שוקולד" => "שוקולד 55% מריר"
    const suggestion = ingredientsList.find(i =>
      (i.name || i.ingredientName || "").includes(name)
      || name.includes(i.name || i.ingredientName || "")
    );

    missing.push({
      rawName: name,
      amount: ing.amount,
      unit: ing.unit ?? 2,
      suggestedIngredient: suggestion || null,
      selectedIngredientId: suggestion?.id ?? null
    });
  });

  return { matched, missing };
}
