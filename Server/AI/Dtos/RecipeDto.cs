namespace BakeryWeb.Server.AI.Dtos
{
    public class RecipeDto
    {
        // מידע בסיסי
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Category { get; set; } = "עוגות"; // אפשר ברירת מחדל
        public int RecipeType { get; set; } = 2;       // 0=חלבי, 1=בשרי, 2=פרווה

        // תפוקה
        public double YieldAmount { get; set; } = 1;   // כמה יחידות יוצא
        public string? OutputUnit { get; set; }        // "תבנית", "יחידה", "עוגה"

        // זמנים
        public int PrepTime { get; set; } = 0;         // בדקות
        public int BakeTime { get; set; } = 0;         // בדקות
        public int Temperature { get; set; } = 0;      // צלזיוס

        // תמונה – לא חובה, לרוב יהיה null
        public string? ImageUrl { get; set; }

        // רשימות
        public List<RecipeIngredientDto> Ingredients { get; set; } = new();
        public List<RecipeStepDto> Steps { get; set; } = new();

        // אופציונלי – בהמשך
        public List<BaseRecipeDto> BaseRecipes { get; set; } = new();
    }
}