using System.Collections.Generic;

namespace Server.Models
{
    public class Recipe
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        // תיאור המתכון
        public string? Description { get; set; }

        // קטגוריית מתכון (רשות משמית או ערך מספרי)
        public string? Category { get; set; }

        // כמה יחידות יוצאות מהמתכון
        public int OutputUnits { get; set; }

        // זמן הכנה בדקות
        public int? PrepTime { get; set; }

        // זמן אפייה בדקות
        public int? BakeTime { get; set; }

        // טמפרטורת אפייה (צלסיוס)
        public int? Temperature { get; set; }

        // כתובת תמונה
        public string? ImageUrl { get; set; }

      public List<RecipeStep> Steps { get; set; } = new();
    public List<RecipeIngredient> Ingredients { get; set; } = new();

        // סוג מתכון: חלבי/בשרי/פרווה
        public RecipeType RecipeType { get; set; } = RecipeType.Parve;
    }
}
