using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

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

        // סוג היחידה שהמתכון מייצא (לדוגמה: "עוגה", "מנה", "עוגה גדולה")
        public UnitType OutputUnitType { get; set; } = UnitType.Piece;

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
        
        // מתכונים בסיסיים שמשמשים כרכיבים במתכון הזה
        // לדוגמה: סנדוויץ יכיל לחמנייה + סלט טונה
        public List<RecipeItem> BaseRecipes { get; set; } = new();

        // סוג מתכון: חלבי/בשרי/פרווה
        public RecipeType RecipeType { get; set; } = RecipeType.Parve;

        // שדות עלויות - לא נשמרים בDB, מחושבים בזמן קריאה
        [NotMapped]
        public decimal IngredientsCost { get; set; }

        [NotMapped]
        public decimal LaborCost { get; set; }

        [NotMapped]
        public decimal OverheadCost { get; set; }

        [NotMapped]
        public decimal PackagingCost { get; set; }

        [NotMapped]
        public decimal TotalCost { get; set; }

        [NotMapped]
        public decimal CostPerUnit { get; set; }
    }
}
