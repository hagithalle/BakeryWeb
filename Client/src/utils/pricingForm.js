// מצב התמחור בטופס המוצר. כל החישובים (מחיר, מע"מ, רווח) נעשים בשרת;
// כאן רק מה נשלח לשרת ואיך מציגים את מה שחזר.
import { percentToMargin } from "./productForm";

export const PricingMode = { Manual: 1, Percentage: 2, Recommended: 3 };
export const VatStatus = { Exempt: 1, Registered: 2 };

const finiteOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

// מצב התחלתי מתוך ערכי הטופס (buildInitialValues: אחוז התוספת כבר באחוזים).
// מוצר קיים שומר על המצב שלו (null = מחיר ישן שלא אושר); מוצר חדש מתחיל ממחיר מומלץ
export const initialPricingState = (initialValues) => {
  const isEdit = !!initialValues?.id;
  const mode = isEdit ? initialValues.pricingMode ?? null : PricingMode.Recommended;
  const stored = finiteOrNull(initialValues?.manualSellingPrice);
  return {
    mode,
    manualPrice: stored === null ? "" : String(stored),
    productMarkupPercent: isEdit ? finiteOrNull(initialValues.profitMarginPercent) ?? 0 : 15,
    legacyStoredPrice: isEdit && mode === null ? stored : null, // נשמר בדיוק כפי שהוא עד אישור
  };
};

// אישור מפורש של מחיר ישן: "המחיר השמור הוא הסופי" / "המחיר שהוצג הוא הסופי" / "מחיר אחר"
export const confirmLegacy = (state, choice, legacy) => {
  if (choice === "stored") return { ...state, mode: PricingMode.Manual, manualPrice: String(legacy.finalIfStoredIsFinal) };
  if (choice === "displayed") return { ...state, mode: PricingMode.Manual, manualPrice: String(legacy.finalIfStoredExcludesVat) };
  return { ...state, mode: PricingMode.Manual, manualPrice: "" };
};

// השדות שנשלחים לשרת (גם לתצוגה מקדימה וגם לשמירה)
export const pricingFields = (state) => {
  if (state.mode === null) {
    // מחיר ישן שלא אושר: נשלח בלי מצב תמחור ועם הערך השמור בדיוק – השרת לא משנה דבר
    return { pricingMode: null, manualSellingPrice: state.legacyStoredPrice, profitMarginPercent: percentToMargin(state.productMarkupPercent) };
  }
  return {
    pricingMode: state.mode,
    manualSellingPrice: finiteOrNull(state.manualPrice),
    profitMarginPercent: percentToMargin(state.productMarkupPercent),
  };
};

// אפשר לשמור? (השרת בודק שוב; זה רק כדי לא לשלוח טופס לא תקין)
export const pricingIsValid = (state) => {
  if (state.mode === PricingMode.Manual) return (finiteOrNull(state.manualPrice) ?? 0) > 0;
  if (state.mode === PricingMode.Percentage) {
    const markup = finiteOrNull(state.productMarkupPercent);
    return markup !== null && markup >= 0 && markup <= 1000;
  }
  return true;
};

export const formatMoneyOrDash = (value) => {
  const n = finiteOrNull(value);
  return n === null ? "—" : `₪${n.toFixed(2)}`;
};

export const formatPercentOrDash = (fraction) => {
  const n = finiteOrNull(fraction);
  return n === null ? "—" : `${(Math.round(n * 1000) / 10).toFixed(1)}%`;
};

// שורת המע"מ לתצוגה
export const vatSummary = (pricing) => {
  if (!pricing || pricing.vatStatus === null || pricing.vatStatus === undefined) return null;
  if (pricing.vatStatus === VatStatus.Exempt) return "עוסק פטור – ללא מע\"מ במחיר";
  const rate = formatPercentOrDash(pricing.vatRate);
  if (pricing.priceBeforeVat === null || pricing.priceBeforeVat === undefined) return `עוסק מורשה – מע"מ ${rate}`;
  return `כולל מע"מ ${rate}: ${formatMoneyOrDash(pricing.vatAmount)} · לפני מע"מ: ${formatMoneyOrDash(pricing.priceBeforeVat)}`;
};
