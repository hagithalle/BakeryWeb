using System.Collections.Generic;

namespace Server.Models
{
    /// <summary>
    /// Why a calculated cost may be wrong. Stored data is never changed because of a warning.
    ///
    /// A BLOCKING warning means part of the cost cannot be calculated reliably (unknown units, an unsupported
    /// conversion, a missing price or reference, a suspicious quantity). Then the recipe's cost status is "Blocked",
    /// products using it get no production cost, no profit and no automatic (percentage/recommended) price;
    /// a manually confirmed selling price is still shown exactly as stored. Non-blocking warnings (purchase VAT
    /// details, missing labor settings) only explain how the value was calculated, as before.
    /// </summary>
    public sealed record CostWarning(string Code, string Message, int? RecipeId = null, int? LineId = null)
    {
        public static readonly IReadOnlySet<string> BlockingCodes = new HashSet<string>
        {
            "MissingIngredient", "UnknownUnit", "UnknownIngredientUnit", "UnitMismatch", "ApproximateConversion",
            "UnsupportedUnit", "ZeroPrice", "InvalidQuantity", "SuspiciousQuantity",
            "MissingSubRecipe", "SubRecipeUnitIgnored", "Cycle", "MissingYield", "NoIngredients",
            "MissingRecipe", "MissingPackaging",
        };

        /// <summary>True when the cost cannot be relied on (serialized as "blocking" for the client).</summary>
        public bool Blocking => BlockingCodes.Contains(Code);

        private const string NotCalculated = "לא ניתן לחשב עלות אמינה";

        public static CostWarning MissingIngredient(int? recipeId, int lineId) =>
            new("MissingIngredient", $"חומר הגלם בשורה לא נמצא – {NotCalculated}", recipeId, lineId);
        public static CostWarning UnknownLineUnit(int? recipeId, int lineId, string ingredient) =>
            new("UnknownUnit", $"ל\"{ingredient}\" אין יחידת מידה תקינה בשורת המתכון – {NotCalculated}", recipeId, lineId);
        public static CostWarning UnknownIngredientUnit(int? recipeId, int lineId, string ingredient) =>
            new("UnknownIngredientUnit", $"לא הוגדר לפי איזו יחידה נקבע המחיר של \"{ingredient}\" (ק\"ג, ליטר או יחידה) – {NotCalculated}", recipeId, lineId);
        public static CostWarning UnitMismatch(int? recipeId, int lineId, string ingredient) =>
            new("UnitMismatch", $"\"{ingredient}\": שורת המתכון ביחידות והמחיר לפי משקל/נפח (או להפך) – חסר משקל ליחידה, {NotCalculated}", recipeId, lineId);
        public static CostWarning ApproximateConversion(int? recipeId, int lineId, string ingredient) =>
            new("ApproximateConversion", $"\"{ingredient}\": אין המרה מדויקת בין נפח למשקל (כולל כפות/כפיות של מוצר שנמכר לפי משקל) – {NotCalculated}", recipeId, lineId);
        public static CostWarning UnsupportedUnit(int? recipeId, int lineId, string ingredient, string reason) =>
            new("UnsupportedUnit", $"\"{ingredient}\": {reason} – {NotCalculated}", recipeId, lineId);
        public static CostWarning ZeroPrice(int? recipeId, int lineId, string ingredient) =>
            new("ZeroPrice", $"המחיר של \"{ingredient}\" הוא 0 – יש להזין מחיר קנייה", recipeId, lineId);
        public static CostWarning InvalidQuantity(int? recipeId, int lineId, string ingredient) =>
            new("InvalidQuantity", $"הכמות של \"{ingredient}\" אינה גדולה מ-0 – {NotCalculated}", recipeId, lineId);
        public static CostWarning SuspiciousQuantity(int? recipeId, int lineId, string ingredient, decimal quantity, int unit) =>
            new("SuspiciousQuantity",
                $"כמות חריגה: {quantity:0.###} {Server.Services.Costing.RecipeUnits.HebrewName(unit)} של \"{ingredient}\" בשורה אחת – יש לבדוק את היחידה (למשל מ\"ל במקום ליטר)",
                recipeId, lineId);
        public static CostWarning MissingSubRecipe(int? recipeId, int lineId) =>
            new("MissingSubRecipe", $"מתכון הבסיס בשורה לא נמצא – {NotCalculated}", recipeId, lineId);
        public static CostWarning SubRecipeUnitIgnored(int? recipeId, int lineId, string subRecipe) =>
            new("SubRecipeUnitIgnored", $"\"{subRecipe}\": מתכון בסיס נתמך רק לפי מספר יחידות של המתכון – {NotCalculated}", recipeId, lineId);
        public static CostWarning Cycle(int? recipeId, int lineId) =>
            new("Cycle", "מתכון הבסיס מכיל את המתכון עצמו – השורה לא חושבה", recipeId, lineId);
        public static CostWarning MissingYield(int? recipeId, string recipe) =>
            new("MissingYield", $"לא הוגדרה כמות יחידות למתכון \"{recipe}\" – לא ניתן לחשב עלות ליחידה", recipeId);
        public static CostWarning NoIngredients(int? recipeId, string recipe) =>
            new("NoIngredients", $"למתכון \"{recipe}\" אין חומרי גלם או מתכוני בסיס – {NotCalculated}", recipeId);
        public static CostWarning NoLaborSettings() =>
            new("NoLaborSettings", "לא הוגדרו הגדרות עבודה – עלות העבודה חושבה כ-0");
        public static CostWarning MissingProductRecipe() =>
            new("MissingRecipe", $"המתכון של המוצר לא נמצא – {NotCalculated}");
        public static CostWarning PurchaseVatUnknown(string kind, string name, int? recipeId = null, int? lineId = null) =>
            new("PurchaseVatUnknown", $"לא צוין אם המחיר של {kind} \"{name}\" כולל מע\"מ – העלות מחושבת לפי המחיר כפי שהוזן", recipeId, lineId);
        public static CostWarning InputVatDeductibilityUnknown(string kind, string name, int? recipeId = null, int? lineId = null) =>
            new("InputVatDeductibilityUnknown", $"לא צוין אם המע\"מ על {kind} \"{name}\" מוכר לקיזוז – העלות מחושבת לפי המחיר כפי שהוזן", recipeId, lineId);
        public static CostWarning MissingPackaging() =>
            new("MissingPackaging", $"פריט אריזה לא נמצא – {NotCalculated}");
    }
}
