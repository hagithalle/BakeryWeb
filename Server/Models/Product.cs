using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    public class Product
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        // על איזה מתכון המוצר מבוסס
        public int RecipeId { get; set; }
        public Recipe Recipe { get; set; } = null!;

        // כמה יחידות מהמתכון נכנסות למוצר (לדוגמה: פרוסת עוגה = 1, עוגה שלמה = 12)
        public int RecipeUnitsQuantity { get; set; } = 1;

        // אריזה ספציפית למוצר
        public int? PackagingId { get; set; }
        public Packaging? Packaging { get; set; }

        // זמן אריזה בדקות (זמן עבודה נוסף מעבר לזמן המתכון)
        public int? PackagingTimeMinutes { get; set; }

        // שדות עלויות - לא נשמרים בDB, מחושבים בזמן קריאה
        [NotMapped]
        public decimal RecipeIngredientsCost { get; set; }

        [NotMapped]
        public decimal RecipeLaborCost { get; set; }

        [NotMapped]
        public decimal RecipeOverheadCost { get; set; }

        [NotMapped]
        public decimal PackagingCost { get; set; }

        [NotMapped]
        public decimal PackagingLaborCost { get; set; }

        [NotMapped]
        public decimal TotalCost { get; set; }
    }
}
