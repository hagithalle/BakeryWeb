using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Bind("IngredientId, Quantity, Unit")]
    public class RecipeIngredient
    {
        public int Id { get; set; }

        public int RecipeId { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public Recipe? Recipe { get; set; }

        public int IngredientId { get; set; }
        // לא JsonIgnore כי אנחנו צריכים את המידע בקליינט
        public Ingredient? Ingredient { get; set; }

        // הכמות במתכון
        public decimal Quantity { get; set; }

        // יחידת המידה של הכמות במתכון (יכולה להיות שונה מיחידת המידה של החומר במלאי)
        // מאוחסנת כ-int כדי לכל JSON serialization לעבוד בצורה חלקה
        public int Unit { get; set; }

        // עלות מחושבת של הרכיב במתכון (לא נשמר בDB, מחושב בזמן קריאה)
        [NotMapped]
        public decimal Cost { get; set; }
    }
}
