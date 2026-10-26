import { describe, it, expect } from "vitest";
import {
  PricingMode,
  VatStatus,
  initialPricingState,
  confirmLegacy,
  pricingFields,
  pricingIsValid,
  formatMoneyOrDash,
  formatPercentOrDash,
  vatSummary,
} from "./pricingForm";
import { buildInitialValues } from "./productForm";

const legacyBox = buildInitialValues({
  id: 1, productType: 1, profitMarginPercent: 0.15, manualSellingPrice: 63.91728841269841, pricingMode: null,
  packageItems: [], additionalPackaging: [],
});
const legacyReview = { storedPrice: 63.91728841269841, displayedPrice: 74.7832274428571, finalIfStoredIsFinal: 63.91728841269841, finalIfStoredExcludesVat: 74.78 };

describe("legacy (unconfirmed) prices", () => {
  it("open as legacy and are sent back unchanged: no mode, the exact stored value", () => {
    const state = initialPricingState(legacyBox);
    expect(state.mode).toBeNull();
    expect(pricingFields(state)).toEqual({ pricingMode: null, manualSellingPrice: 63.91728841269841, profitMarginPercent: 0.15 });
    expect(pricingIsValid(state)).toBe(true);
  });

  it("are confirmed only by an explicit choice", () => {
    const state = initialPricingState(legacyBox);
    expect(pricingFields(confirmLegacy(state, "stored", legacyReview)))
      .toMatchObject({ pricingMode: PricingMode.Manual, manualSellingPrice: 63.91728841269841 });
    expect(pricingFields(confirmLegacy(state, "displayed", legacyReview)))
      .toMatchObject({ pricingMode: PricingMode.Manual, manualSellingPrice: 74.78 });
    const other = confirmLegacy(state, "other", legacyReview);
    expect(other.mode).toBe(PricingMode.Manual);
    expect(pricingIsValid(other)).toBe(false);   // a price must be entered before saving
  });
});

describe("pricing modes", () => {
  it("a new product starts with the recommended price and the 15% default for its own markup", () => {
    const state = initialPricingState(null);
    expect(state.mode).toBe(PricingMode.Recommended);
    expect(pricingFields(state)).toMatchObject({ pricingMode: 3, manualSellingPrice: null, profitMarginPercent: 0.15 });
  });

  it("keeps a confirmed mode when editing", () => {
    const state = initialPricingState(buildInitialValues({ id: 4, productType: 0, pricingMode: 2, profitMarginPercent: 0.25, manualSellingPrice: 120 }));
    expect(state.mode).toBe(PricingMode.Percentage);
    expect(state.productMarkupPercent).toBe(25);
    expect(pricingFields(state)).toEqual({ pricingMode: 2, manualSellingPrice: 120, profitMarginPercent: 0.25 });
  });

  it("validates the input of the selected mode only", () => {
    const base = initialPricingState(null);
    expect(pricingIsValid({ ...base, mode: PricingMode.Manual, manualPrice: "" })).toBe(false);
    expect(pricingIsValid({ ...base, mode: PricingMode.Manual, manualPrice: "0" })).toBe(false);
    expect(pricingIsValid({ ...base, mode: PricingMode.Manual, manualPrice: "49.90" })).toBe(true);
    expect(pricingIsValid({ ...base, mode: PricingMode.Percentage, productMarkupPercent: "-1" })).toBe(false);
    expect(pricingIsValid({ ...base, mode: PricingMode.Percentage, productMarkupPercent: "20" })).toBe(true);
    expect(pricingIsValid({ ...base, mode: PricingMode.Recommended })).toBe(true);
  });

  it("manual prices are sent exactly as entered", () => {
    const state = { ...initialPricingState(null), mode: PricingMode.Manual, manualPrice: "49.90" };
    expect(pricingFields(state).manualSellingPrice).toBe(49.9);
  });
});

describe("display", () => {
  it("never shows NaN or a made-up zero for unknown values", () => {
    expect(formatMoneyOrDash(null)).toBe("—");
    expect(formatMoneyOrDash(undefined)).toBe("—");
    expect(formatMoneyOrDash("abc")).toBe("—");
    expect(formatMoneyOrDash(0)).toBe("₪0.00");
    expect(formatPercentOrDash(null)).toBe("—");
    expect(formatPercentOrDash(0.1527)).toBe("15.3%");
  });

  it("describes VAT from the server's pricing", () => {
    expect(vatSummary({ vatStatus: null })).toBeNull();
    expect(vatSummary({ vatStatus: VatStatus.Exempt })).toBe('עוסק פטור – ללא מע"מ במחיר');
    expect(vatSummary({ vatStatus: VatStatus.Registered, vatRate: 0.18, vatAmount: 18, priceBeforeVat: 100 }))
      .toBe('כולל מע"מ 18.0%: ₪18.00 · לפני מע"מ: ₪100.00');
  });
});
