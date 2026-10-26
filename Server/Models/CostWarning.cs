namespace Server.Models
{
    /// <summary>
    /// Why a calculated cost may be wrong. Values are never changed because of a warning; the warning only explains.
    /// </summary>
    public sealed record CostWarning(string Code, string Message, int? RecipeId = null, int? LineId = null)
    {
        public static CostWarning MissingIngredient(int? recipeId, int lineId) =>
            new("MissingIngredient", "חומר הגלם בשורה לא נמצא – השורה חושבה כ-0", recipeId, lineId);
        public static CostWarning UnknownLineUnit(int? recipeId, int lineId, string ingredient) =>
            new("UnknownUnit", $"ל\"{ingredient}\" אין יחידת מידה בשורת המתכון – הכמות חושבה כאילו היא בק\"ג/ליטר", recipeId, lineId);
        public static CostWarning UnknownIngredientUnit(int? recipeId, int lineId, string ingredient) =>
            new("UnknownIngredientUnit", $"לא הוגדר לפי איזו יחידה נקבע המחיר של \"{ingredient}\" – לא ניתן לוודא את חישוב העלות", recipeId, lineId);
        public static CostWarning UnitMismatch(int? recipeId, int lineId, string ingredient) =>
            new("UnitMismatch", $"המחיר של \"{ingredient}\" ושורת המתכון מוגדרים ביחידות שאינן תואמות (משקל/נפח מול יחידות) – העלות עלולה להיות שגויה", recipeId, lineId);
        public static CostWarning ApproximateConversion(int? recipeId, int lineId, string ingredient) =>
            new("ApproximateConversion", $"ל\"{ingredient}\" בוצעה המרה משוערת בין משקל לנפח (1 ליטר = 1 ק\"ג)", recipeId, lineId);
        public static CostWarning ZeroPrice(int? recipeId, int lineId, string ingredient) =>
            new("ZeroPrice", $"המחיר של \"{ingredient}\" הוא 0", recipeId, lineId);
        public static CostWarning MissingSubRecipe(int? recipeId, int lineId) =>
            new("MissingSubRecipe", "מתכון הבסיס בשורה לא נמצא – השורה חושבה כ-0", recipeId, lineId);
        public static CostWarning SubRecipeUnitIgnored(int? recipeId, int lineId, string subRecipe) =>
            new("SubRecipeUnitIgnored", $"הכמות של \"{subRecipe}\" חושבה כמספר יחידות של המתכון (יחידת המידה בשורה עדיין לא נתמכת)", recipeId, lineId);
        public static CostWarning Cycle(int? recipeId, int lineId) =>
            new("Cycle", "מתכון הבסיס מכיל את המתכון עצמו – השורה לא חושבה", recipeId, lineId);
        public static CostWarning MissingYield(int? recipeId, string recipe) =>
            new("MissingYield", $"לא הוגדרה כמות יחידות למתכון \"{recipe}\" – העלות ליחידה חושבה לפי יחידה אחת", recipeId);
        public static CostWarning NoIngredients(int? recipeId, string recipe) =>
            new("NoIngredients", $"למתכון \"{recipe}\" אין חומרי גלם או מתכוני בסיס – העלות שלו כוללת רק עבודה ותקורה", recipeId);
        public static CostWarning NoLaborSettings() =>
            new("NoLaborSettings", "לא הוגדרו הגדרות עבודה – עלות העבודה חושבה כ-0");
        public static CostWarning MissingProductRecipe() =>
            new("MissingRecipe", "המתכון של המוצר לא נמצא – עלות המתכון חושבה כ-0");
        public static CostWarning MissingPackaging() =>
            new("MissingPackaging", "פריט אריזה לא נמצא – עלותו חושבה כ-0");
    }
}
