import { describe, it, expect } from "vitest";
import {
  buildInitialValues,
  buildUpdatePayload,
  withPackagingDetails,
  withRecipeNames,
  packagingLineCost,
  formatMoney,
  toSavedPackageItems,
  toSavedPackagingItems,
  marginToPercent,
  percentToMargin,
} from "./productForm";

// Shapes as GET /api/products returns them (camelCase, with nested recipe / packaging)
const yeastCake = {
  id: 2, name: "עוגת שמרים", productType: 0, recipeId: 6, unitConversionRate: 1, saleUnitType: 2,
  packagingId: null, packagingTimeMinutes: 5, profitMarginPercent: 0.1, manualSellingPrice: 48,
  imageUrl: "/uploads/products/b2198bcc.png", category: "מארז כללי", description: "תיאור",
  packageItems: [],
  additionalPackaging: [
    { id: 6, productId: 2, packagingId: 3, quantity: 1, packaging: { id: 3, name: "צלופן", cost: 0.5 } },
    { id: 7, productId: 2, packagingId: 2, quantity: 1, packaging: { id: 2, name: "מדבקת לוגו", cost: 0.1 } },
  ],
};
const cookieBox = {
  id: 1, name: "מארז עוגיות", productType: 1, recipeId: null, unitConversionRate: 1, saleUnitType: 0,
  packagingId: null, packagingTimeMinutes: 5, profitMarginPercent: 0.15, manualSellingPrice: 63.91728841269841,
  imageUrl: null, category: "מארז כללי",
  packageItems: [
    { id: 15, productId: 1, recipeId: 2, quantity: 20, recipe: { id: 2, name: "בראוניז" } },
    { id: 16, productId: 1, recipeId: 5, quantity: 10, recipe: { id: 5, name: "כדורי שוקולד" } },
  ],
  additionalPackaging: [
    { id: 10, productId: 1, packagingId: 1, quantity: 1, packaging: { id: 1, name: "קופסא", cost: 8 } },
    { id: 11, productId: 1, packagingId: 2, quantity: 1, packaging: { id: 2, name: "מדבקת לוגו", cost: 0.1 } },
  ],
};

// What AddProductDialog.handleSave does with an UNCHANGED form (manual price mode, the mode it opens in)
const saveUnchanged = (initial) => {
  const data = {
    name: initial.name,
    productType: initial.productType,
    description: initial.description,
    category: initial.category,
    profitMarginPercent: percentToMargin(initial.profitMarginPercent),
    manualSellingPrice: parseFloat(initial.manualSellingPrice),
    packagingTimeMinutes: parseInt(initial.packagingTimeMinutes) || 0,
  };
  if (initial.productType === "single") {
    data.recipeId = parseInt(initial.recipeId);
    data.recipeUnits = parseInt(initial.recipeUnits);
    const selectedRecipeData = null; // the recipe was not re-selected in the form
    data.saleUnitType = selectedRecipeData?.outputUnitType ?? initial.saleUnitType ?? 0;
  } else {
    data.packageItems = toSavedPackageItems(initial.packageItems);
  }
  if (initial.additionalPackaging.length > 0) data.additionalPackaging = toSavedPackagingItems(initial.additionalPackaging);
  return buildUpdatePayload(data, initial);
};

describe("additional packaging rows (₪NaN bug)", () => {
  it("keeps name and cost of existing packaging when editing", () => {
    const initial = buildInitialValues(yeastCake);
    expect(initial.additionalPackaging).toEqual([
      { packagingId: "3", name: "צלופן", cost: 0.5, quantity: 1 },
      { packagingId: "2", name: "מדבקת לוגו", cost: 0.1, quantity: 1 },
    ]);
    expect(initial.additionalPackaging.map((i) => formatMoney(packagingLineCost(i)))).toEqual(["₪0.50", "₪0.10"]);
  });

  it("uses current names and prices from the packaging list", () => {
    const initial = buildInitialValues(yeastCake);
    const view = withPackagingDetails(initial.additionalPackaging, [{ id: 3, name: "צלופן חדש", cost: 0.75 }]);
    expect(view[0]).toMatchObject({ name: "צלופן חדש", cost: 0.75 });
    expect(view[1]).toMatchObject({ name: "מדבקת לוגו", cost: 0.1 }); // not in the list: keeps loaded values
  });

  it("never shows NaN when a cost is unknown", () => {
    const [item] = buildInitialValues({ ...yeastCake, additionalPackaging: [{ packagingId: 9, quantity: 2 }] }).additionalPackaging;
    expect(packagingLineCost(item)).toBeNull();
    expect(formatMoney(packagingLineCost(item))).toBe("—");
    expect(formatMoney(NaN)).toBe("—");
    expect(formatMoney(undefined)).toBe("—");
  });
});

describe("editing a box keeps its items", () => {
  it("maps box items to the field the dialog uses (productId) with names", () => {
    const initial = buildInitialValues(cookieBox);
    expect(initial.packageItems).toEqual([
      { productId: "2", name: "בראוניז", quantity: 20 },
      { productId: "5", name: "כדורי שוקולד", quantity: 10 },
    ]);
    // the dialog's validity check: every item needs a productId
    expect(initial.packageItems.some((i) => !i.productId)).toBe(false);
    expect(withRecipeNames(initial.packageItems, [{ id: 2, name: "בראוניז מעודכן" }])[0].name).toBe("בראוניז מעודכן");
  });

  it("saving an unchanged box sends exactly the same items, packaging and prices", () => {
    const payload = saveUnchanged(buildInitialValues(cookieBox));
    expect(payload).toMatchObject({
      id: 1, productType: 1, recipeId: null, packagingId: null, packagingTimeMinutes: 5, imageUrl: null,
      profitMarginPercent: 0.15, manualSellingPrice: 63.91728841269841,
      packageItems: [{ recipeId: 2, quantity: 20 }, { recipeId: 5, quantity: 10 }],
      additionalPackaging: [{ packagingId: 1, quantity: 1 }, { packagingId: 2, quantity: 1 }],
    });
  });

  it("never sends NaN ids", () => {
    expect(toSavedPackageItems([{ productId: "" }, { productId: undefined }, { productId: "7", quantity: "3" }]))
      .toEqual([{ productId: 7, quantity: 3 }]);
  });
});

describe("editing a single product keeps its data", () => {
  it("saving an unchanged product sends the same recipe, units, sale unit, packaging, image and prices", () => {
    const payload = saveUnchanged(buildInitialValues(yeastCake));
    expect(payload).toMatchObject({
      id: 2, productType: 0, recipeId: 6, unitConversionRate: 1, saleUnitType: 2, packagingTimeMinutes: 5,
      imageUrl: "/uploads/products/b2198bcc.png", profitMarginPercent: 0.1, manualSellingPrice: 48,
      packageItems: [],
      additionalPackaging: [{ packagingId: 3, quantity: 1 }, { packagingId: 2, quantity: 1 }],
    });
  });
});

describe("sale unit", () => {
  it("keeps the stored sale unit when the form does not provide one", () => {
    const initial = buildInitialValues(yeastCake);
    const payload = buildUpdatePayload({ productType: "single", recipeId: 6, recipeUnits: 1 }, initial);
    expect(payload.saleUnitType).toBe(2);
  });
});

describe("profit margin round trip", () => {
  it.each([[1.1, 0.011], [0.7, 0.007], [12.5, 0.125], [15, 0.15]])("typed %s%% is saved as exactly %s", (percent, margin) => {
    expect(percentToMargin(percent)).toBe(margin);
  });

  it.each([0, 0.07, 0.1, 0.15, 0.29, 0.333333, 1.25])("%s survives form display and save unchanged", (margin) => {
    expect(percentToMargin(marginToPercent(margin))).toBe(margin);
  });
});
