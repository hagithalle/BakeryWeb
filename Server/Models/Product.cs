using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    public class Product
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        // סוג המוצר: בודד (מבוסס מתכון) או מארז (המכיל מוצרים אחרים)
        public ProductType ProductType { get; set; } = ProductType.Single;

        // על איזה מתכון המוצר מבוסס (רלוונטי רק ל-Single type)
        public int? RecipeId { get; set; }
        public Recipe? Recipe { get; set; }

        // סוג היחידה שאנחנו מוכרים (חתיכה, עוגה שלמה וכו')
        // רלוונטי רק ל-Single type
        public UnitType SaleUnitType { get; set; } = UnitType.Piece;

        // קצב המרה: כמה יחידות מכירה מ-1 יחידת מתכון
        // דוגמה: מתכון ברוניז מייצא 1 עוגה גדולה, והמוצר הוא חתיכה → UnitConversionRate = 30
        // רלוונטי רק ל-Single type
        public int UnitConversionRate { get; set; } = 1;

        // פריטי המארז (רלוונטי רק ל-Package type)
        public List<PackageItem> PackageItems { get; set; } = new();

        // אריזה ספציפית למוצר
        public int? PackagingId { get; set; }
        public Packaging? Packaging { get; set; }

        // אריזה נוספת (למארז או מוצר)
        public List<ProductAdditionalPackaging> AdditionalPackaging { get; set; } = new();

        // זמן אריזה בדקות (זמן עבודה נוסף מעבר לזמן המתכון)
        public int? PackagingTimeMinutes { get; set; }

        // תמונה
        public string? ImageUrl { get; set; }

        // תיאור
        public string? Description { get; set; }

        // קטגוריה של המוצר
        public string? Category { get; set; }

        // אחוז רווח רצוי (0.15 = 15%)
        public decimal ProfitMarginPercent { get; set; } = 0;

        // מחיר מכירה ידני (אופציונלי - אם מוגדר, לא מחשבים אוטומטית)
        public decimal? ManualSellingPrice { get; set; }

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
        public decimal PackagingOverheadCost { get; set; }

        [NotMapped]
        public decimal TotalCost { get; set; }

        [NotMapped]
        public decimal ProfitAmount { get; set; }

        [NotMapped]
        public decimal SellingPriceBeforeVAT { get; set; }

        [NotMapped]
        public decimal SellingPriceWithVAT { get; set; }
    }
}
