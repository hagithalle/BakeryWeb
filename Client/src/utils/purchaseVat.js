// מע"מ במחירי קנייה (חומרי גלם, אריזות, הוצאות קבועות).
// השרת מחשב את העלות בפועל; כאן רק מה שואלים, מה נשלח, ומה מציגים.

export const PurchaseVatTreatment = { IncludesVat: 1, ExcludesVat: 2, NoVat: 3 };
const REGISTERED = 2;

export const TREATMENT_OPTIONS = [
  { value: PurchaseVatTreatment.IncludesVat, label: 'המחיר כולל מע"מ' },
  { value: PurchaseVatTreatment.ExcludesVat, label: 'המחיר לא כולל מע"מ' },
  { value: PurchaseVatTreatment.NoVat, label: 'אין מע"מ על הקנייה', hint: 'למשל פירות וירקות טריים, או ספק שהוא עוסק פטור' },
];

export const treatmentLabel = (value) =>
  TREATMENT_OPTIONS.find((o) => o.value === value)?.label ?? 'לא נבדק';

// שאלת הקיזוז רלוונטית רק לעוסק מורשה ורק כשיש מע"מ בקנייה
export const needsDeductibility = (vatStatus, treatment) =>
  vatStatus === REGISTERED &&
  (treatment === PurchaseVatTreatment.IncludesVat || treatment === PurchaseVatTreatment.ExcludesVat);

export const initialPurchaseVat = (item) => ({
  treatment: item?.purchaseVatTreatment ?? null,
  deductible: item?.inputVatDeductible ?? null,
});

// פריט חדש: חובה לענות. פריט קיים: מותר להשאיר "לא נבדק", אבל אם נבחר סוג – גם שאלת הקיזוז (כשרלוונטית)
export const purchaseVatIsComplete = (state, vatStatus, isNew) => {
  if (state.treatment === null) return !isNew;
  return !needsDeductibility(vatStatus, state.treatment) || state.deductible !== null;
};

// השדות שנשלחים לשרת. בלי סוג – לא נשלח דבר, והשרת משאיר את הערכים השמורים
export const purchaseVatPayload = (state, vatStatus) =>
  state.treatment === null
    ? {}
    : {
        purchaseVatTreatment: state.treatment,
        inputVatDeductible: needsDeductibility(vatStatus, state.treatment) ? state.deductible : null,
      };

export const isUnreviewed = (item, vatStatus) =>
  (item?.purchaseVatTreatment ?? null) === null ||
  (needsDeductibility(vatStatus, item.purchaseVatTreatment) && (item.inputVatDeductible ?? null) === null);

// ===== מסך הבדיקה המרוכזת =====

export const KIND_LABELS = { ingredient: "חומר גלם", packaging: "אריזה", overhead: "הוצאה קבועה" };
export const priceUnitLabel = (item) =>
  item.priceUnit === "month" ? "לחודש" : item.priceUnit === "unit" ? "ליחידה" : "לק\"ג / ליחידה";
export const rowKey = (item) => `${item.kind}:${item.id}`;

// State של השרת: 0 הוחל, 1 לא נבדק, 2 קיזוז לא צוין, 3 לא נבחר סטטוס מע"מ לעסק, 4 אין שיעור מע"מ
export const STATE_LABELS = {
  0: "נבדק",
  1: "לא נבדק",
  2: "לא צוין אם מוכר לקיזוז",
  3: "לא נבחר סטטוס מע\"מ לעסק",
  4: "אין שיעור מע\"מ להיום",
};

// הבחירה בטופס לפריט (אם נערך) או הערך השמור
export const effectiveChoice = (item, edits) => edits[rowKey(item)] ?? initialPurchaseVat(item);

const differs = (item, choice) =>
  choice.treatment !== (item.purchaseVatTreatment ?? null) || choice.deductible !== (item.inputVatDeductible ?? null);

// רק פריטים שסומנו במפורש, שהבחירה בהם שונה מהשמור ושיש בה סוג מע"מ
export const pendingChanges = (items, edits, selected, vatStatus) =>
  items
    .filter((item) => selected.has(rowKey(item)) && edits[rowKey(item)])
    .map((item) => ({ item, choice: edits[rowKey(item)] }))
    .filter(({ item, choice }) => choice.treatment !== null && differs(item, choice))
    .map(({ item, choice }) => ({
      kind: item.kind,
      id: item.id,
      ...purchaseVatPayload(choice, vatStatus),
    }));

// פריטים מסומנים שעדיין חסרה בהם תשובה (אין לשמור עד שיושלמו)
export const incompleteSelections = (items, edits, selected, vatStatus) =>
  items.filter((item) => selected.has(rowKey(item)) && !purchaseVatIsComplete(effectiveChoice(item, edits), vatStatus, true));
