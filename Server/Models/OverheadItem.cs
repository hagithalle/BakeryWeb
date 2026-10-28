namespace Server.Models
{

    public enum OverheadType
    {
        עקיפה = 0,
        קבועה = 1
    }

    public enum OverheadCategory
    {
        Operational = 0, // הוצאות תפעול (חשמל, מים, דלק, ארנונה)
        Rent = 1,        // שכירות
        Accountant = 2,  // רואה חשבון
        Insurance = 3,   // ביטוח
        Other = 4        // שונות
    }

    public class OverheadItem : IOwnedEntity, IPurchasePriced
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty; // "רואה חשבון", "חשמל", "ביטוח"

        // קטגוריה ראשית (enum)
        public OverheadCategory Category { get; set; } = OverheadCategory.Other;

        // עלות חודשית ממוצעת
        public decimal MonthlyCost { get; set; }

        public bool IsActive { get; set; } = true;

        public OverheadType Type { get; set; } = OverheadType.עקיפה;

        // מע"מ בהוצאה החודשית (ריק = לא נבדק עדיין; הסכום נלקח כפי שהוזן)
        public PurchaseVatTreatment? PurchaseVatTreatment { get; set; }
        public bool? InputVatDeductible { get; set; }

        public int? UserId { get; set; }
    }
}
