// מיפוי בין מוצר כפי שהשרת מחזיר, טופס עריכת המוצר, וה-payload שנשלח בעדכון.
// הכול כאן פונקציות טהורות, כדי שאפשר יהיה לבדוק ששמירה בלי שינוי מחזירה בדיוק את אותם נתונים.

export const getField = (obj, camelKey, pascalKey) =>
  obj?.[camelKey] ?? obj?.[pascalKey];

export const toNumber = (value) => Number(value || 0);

// מספר תקין או null (לעולם לא NaN / Infinity)
const finiteOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

// אחוז רווח נשמר כשבר (0.15) ומוצג כאחוזים (15). עיגול מונע רעש של נקודה צפה
// (למשל 0.07 * 100 = 7.000000000000001) שהיה משנה את הערך השמור בכל שמירה.
const roundTo = (value, digits) => Math.round(value * 10 ** digits) / 10 ** digits;
export const marginToPercent = (fraction) => roundTo(toNumber(fraction) * 100, 6);
export const percentToMargin = (percent) => roundTo(toNumber(percent) / 100, 8);

// ===== מהשרת לטופס =====

// פריטי מארז: הטופס מזהה מתכון בשדה productId (כך הוא נבנה במקור), השרת בשדה recipeId
export const toFormPackageItems = (items = []) =>
  items
    .map((item) => {
      const recipeId = getField(item, "recipeId", "RecipeId") ?? getField(item, "productId", "ProductId");
      const recipe = getField(item, "recipe", "Recipe");
      return {
        productId: recipeId === null || recipeId === undefined ? "" : String(recipeId),
        name: getField(recipe, "name", "Name") || "",
        quantity: Number(getField(item, "quantity", "Quantity")) || 1,
      };
    })
    .filter((item) => item.productId !== "");

// אריזות נוספות: כולל שם ועלות, כדי שהשורה לא תציג "₪NaN" בלי שם
export const toFormPackagingItems = (items = []) =>
  items
    .map((item) => {
      const packagingId = getField(item, "packagingId", "PackagingId");
      const packaging = getField(item, "packaging", "Packaging");
      return {
        packagingId: packagingId === null || packagingId === undefined ? "" : String(packagingId),
        name: getField(packaging, "name", "Name") || "",
        cost: finiteOrNull(getField(packaging, "cost", "Cost")),
        quantity: Number(getField(item, "quantity", "Quantity")) || 1,
      };
    })
    .filter((item) => item.packagingId !== "");

// שם ועלות עדכניים מרשימת האריזות (אם הפריט קיים בה)
export const withPackagingDetails = (items = [], packagingList = []) =>
  items.map((item) => {
    const pack = packagingList.find((p) => Number(getField(p, "id", "Id")) === Number(item.packagingId));
    if (!pack) return item;
    return {
      ...item,
      name: getField(pack, "name", "Name") || item.name || "",
      cost: finiteOrNull(getField(pack, "cost", "Cost")) ?? item.cost ?? null,
    };
  });

// שם עדכני מרשימת המתכונים
export const withRecipeNames = (items = [], recipes = []) =>
  items.map((item) => {
    const recipe = recipes.find((r) => Number(getField(r, "id", "Id")) === Number(item.productId));
    return recipe ? { ...item, name: getField(recipe, "name", "Name") || item.name || "" } : item;
  });

// עלות שורת אריזה לתצוגה – null כשהעלות לא ידועה (במקום NaN)
export const packagingLineCost = (item) => {
  const cost = finiteOrNull(item?.cost);
  const quantity = finiteOrNull(item?.quantity);
  return cost === null || quantity === null ? null : cost * quantity;
};

export const formatMoney = (value) => {
  const n = finiteOrNull(value);
  return n === null ? "—" : `₪${n.toFixed(2)}`;
};

// ערכי התחלה לטופס עריכה מתוך מוצר שהשרת החזיר
export const buildInitialValues = (product) => {
  if (!product) return null;

  const productTypeValue = Number(getField(product, "productType", "ProductType") ?? 0);
  const productType = productTypeValue === 1 ? "package" : "single";
  const recipeUnitsQuantity = getField(product, "unitConversionRate", "UnitConversionRate") || 1;

  return {
    id: getField(product, "id", "Id"),
    name: getField(product, "name", "Name") || "",
    description: getField(product, "description", "Description") || "",
    productType,
    recipeId: getField(product, "recipeId", "RecipeId") || "",
    recipeUnits: recipeUnitsQuantity,
    unitConversionRate: recipeUnitsQuantity,
    saleUnitType: getField(product, "saleUnitType", "SaleUnitType") ?? 0,
    packageItems: toFormPackageItems(product.packageItems || product.PackageItems || []),
    category: getField(product, "category", "Category") || "",
    additionalPackaging: toFormPackagingItems(product.additionalPackaging || product.AdditionalPackaging || []),
    packagingId: getField(product, "packagingId", "PackagingId") || null,
    packagingTimeMinutes: getField(product, "packagingTimeMinutes", "PackagingTimeMinutes") || 0,
    profitMarginPercent: marginToPercent(getField(product, "profitMarginPercent", "ProfitMarginPercent")),
    manualSellingPrice: getField(product, "manualSellingPrice", "ManualSellingPrice") || "",
    imageUrl: getField(product, "imageUrl", "ImageUrl") || "",
  };
};

// ===== מהטופס לשמירה =====

export const toSavedPackageItems = (items = []) =>
  items
    .map((item) => ({ productId: parseInt(item.productId ?? item.recipeId), quantity: parseInt(item.quantity) || 1 }))
    .filter((item) => Number.isInteger(item.productId) && item.productId > 0);

export const toSavedPackagingItems = (items = []) =>
  items
    .filter((p) => p.packagingId)
    .map((item) => ({ packagingId: parseInt(item.packagingId), quantity: parseInt(item.quantity) || 1 }));

// payload לעדכון מוצר קיים (PUT /api/products/{id})
export const buildUpdatePayload = (productData, existingProduct) => {
  const productTypeValue = productData.productType === "package" ? 1 : 0;

  const packageItems =
    productTypeValue === 1
      ? (productData.packageItems || []).map((item) => ({
          recipeId: Number(item.recipeId ?? item.productId),
          quantity: Number(item.quantity) || 1,
        }))
      : [];

  const additionalPackaging = (productData.additionalPackaging || []).map((item) => ({
    packagingId: Number(item.packagingId),
    quantity: Number(item.quantity) || 1,
  }));

  return {
    id: existingProduct.id,
    name: productData.name,
    description: productData.description,
    category: productData.category,
    productType: productTypeValue,
    recipeId: productTypeValue === 0 ? Number(productData.recipeId) : null,
    unitConversionRate: productTypeValue === 0 ? Number(productData.recipeUnits || 1) : 1,
    saleUnitType: productTypeValue === 0 ? Number(productData.saleUnitType ?? existingProduct.saleUnitType ?? 0) : 0,
    packagingId: existingProduct.packagingId || null,
    packagingTimeMinutes: Number(productData.packagingTimeMinutes) || 0,
    imageUrl: existingProduct.imageUrl || null,
    profitMarginPercent: productData.profitMarginPercent,
    manualSellingPrice: productData.manualSellingPrice,
    packageItems,
    additionalPackaging,
  };
};
