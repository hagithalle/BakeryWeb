public class RecipeDto
{
    public int? Id { get; set; }

    // מידע בסיסי
    public string Name { get; set; }
    public string? Description { get; set; }
    public string Category { get; set; }     // לחמים / עוגות / אחר...
    public int RecipeType { get; set; }      // 0=חלבי, 1=בשרי, 2=פרווה

    // תפוקה
    public double YieldAmount { get; set; }  // כמה יחידות יוצא מהמתכון
    public int OutputUnitType { get; set; }  // enum: Piece / Gram / Whole

    // אפייה
    public int PrepTime { get; set; }        // זמן הכנה בדקות
    public int BakeTime { get; set; }        // זמן אפייה בדקות
    public int Temperature { get; set; }     // מעלות צלזיוס

    // תצוגה
    public string? ImageUrl { get; set; }

    // טבלאות
    public List<RecipeIngredientDto> Ingredients { get; set; } = new();
    public List<RecipeStepDto> Steps { get; set; } = new();
    public List<BaseRecipeDto> BaseRecipes { get; set; } = new();
}