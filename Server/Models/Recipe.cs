using System.Collections.Generic;

namespace Server.Models
{
    public class Recipe
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;


        // כמה יחידות יוצאות מהמתכון
        public int OutputUnits { get; set; }

        // כתובת תמונה
        public string? ImageUrl { get; set; }

        public ICollection<RecipeIngredient> Ingredients { get; set; } = new List<RecipeIngredient>();

        // 🆕 רשימת שלבי הכנה
        public ICollection<RecipeStep> Steps { get; set; } = new List<RecipeStep>();

        // סוג מתכון: חלבי/בשרי/פרווה
        public RecipeType RecipeType { get; set; } = RecipeType.Parve;
    }
}
