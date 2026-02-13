/**
 * מרכז אחד לכל ה-Enums והמרות שלהם
 * תואם ל-UnitType Enum בשרת
 */

export const UnitType = {
  Piece: 0,      // חתיכה
  Whole: 1,      // עוגה שלמה
  Portion: 2,    // מנה
  Box: 3,        // קופסה
  Dozen: 4,      // תריסר
  Kilogram: 5,   // ק"ג
  Gram: 6,       // גרם
  Liter: 7       // ליטר
};

export const UnitTypeLabels = {
  [UnitType.Piece]: "חתיכה",
  [UnitType.Whole]: "עוגה שלמה",
  [UnitType.Portion]: "מנה",
  [UnitType.Box]: "קופסה",
  [UnitType.Dozen]: "תריסר",
  [UnitType.Kilogram]: "ק\"ג",
  [UnitType.Gram]: "גרם",
  [UnitType.Liter]: "ליטר"
};

export const UnitTypeOptions = Object.entries(UnitTypeLabels).map(([value, label]) => ({
  value: parseInt(value),
  label
}));

export const getUnitTypeLabel = (unitType) => {
  return UnitTypeLabels[unitType] || "לא ידוע";
};

export const getUnitTypeValue = (label) => {
  const entry = Object.entries(UnitTypeLabels).find(([_, l]) => l === label);
  return entry ? parseInt(entry[0]) : UnitType.Piece;
};
