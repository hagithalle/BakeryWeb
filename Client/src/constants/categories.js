
// קטגוריות ראשיות לדף מתכונים (כולל לוגיקה דינמית לסוגים)
export const MAIN_RECIPE_CATEGORIES = [
  { value: "all", label: "כל הקטגוריות" },
  { value: "kosher", label: "כשרות" },
  { value: "type", label: "סוג מתכון" },
];

export const KOSHER_TYPES = [
  { value: "all", label:" הכול" },
  { value: "פרווה", label: "פרווה" },
  { value: "חלבי", label: "חלבי" },
  { value: "בשרי", label: "בשרי" },
];

export const RECIPE_TYPES = [
  { value: "all", label: "כל הסוגים" },
  { value: "עוגות", label: "עוגות" },
  { value: "עוגיות", label: "עוגיות" },
  { value: "לחמים", label: "לחמים" },
  { value: "מאפים", label: "מאפים" },
   { value: "אחר", label: "אחר" },
];

export function getSubCategoryOptions(category) {
  if (category === "kosher") return KOSHER_TYPES;
  if (category === "type") return RECIPE_TYPES;
  // ברירת מחדל: אין תתי קטגוריות לקטגוריות רגילות
  return [];
}

// קטגוריות/סוגים נוספים לדפים אחרים
export const ingredientCategories = [
  { value: "all", label: "כל הקטגוריות" },
  { value: "מוצרי חלב", label: "מוצרי חלב" },
  { value: "דגנים", label: "דגנים" },
  { value: "ממתיקים", label: "ממתיקים" },
  { value: "אחר", label: "אחר" },
];

export const productCategories = [
  { value: "all", label: "כל הקטגוריות" },
  { value: "מארז יום הולדת", label: "מארז יום הולדת" },
  { value: "מארז יום אהבה", label: "מארז יום אהבה" },
  { value: "מארז פורים", label: "מארז פורים" },
  { value: "מארז חג", label: "מארז חג" },
  { value: "מארז כללי", label: "מארז כללי" },
  { value: "אחר", label: "אחר" },
];

export const productTypes = [
  { value: "all", label: "כל הסוגים" },
  { value: "single", label: "מוצר בודד" },
  { value: "package", label: "מארז" },
];
