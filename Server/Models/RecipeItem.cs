using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    /// <summary>
    /// מייצג מתכון בסיסי שמשמש כרכיב במתכון מורכב
    /// לדוגמה: סנדוויץ שמכיל לחמנייה וסלט טונה
    /// </summary>
    public class RecipeItem
    {
        public int Id { get; set; }

        /// <summary>
        /// המתכון המורכב שמכיל את הרכיב הזה
        /// (הסנדוויץ)
        /// </summary>
        public int ComposingRecipeId { get; set; }
        public Recipe? ComposingRecipe { get; set; }

        /// <summary>
        /// המתכון הבסיסי המשמש כרכיב
        /// (הלחמנייה או הסלט)
        /// </summary>
        public int BaseRecipeId { get; set; }
        public Recipe? BaseRecipe { get; set; }

        /// <summary>
        /// כמה יחידות מהמתכון הבסיסי נדרשות
        /// לדוגמה: 1 לחמנייה, 0.05 ק"ג סלט טונה
        /// </summary>
        public decimal Quantity { get; set; }

        /// <summary>
        /// יחידת מידה של הכמות
        /// </summary>
        public UnitOfMeasure Unit { get; set; }

        // שדות עלות - מחושבים בזמן ריצה
        [NotMapped]
        public decimal CostPerUnit { get; set; }

        [NotMapped]
        public decimal TotalCost { get; set; }
    }
}
