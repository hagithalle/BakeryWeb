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

    public class OverheadItem
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty; // "רואה חשבון", "חשמל", "ביטוח"

        // קטגוריה ראשית (enum)
        public OverheadCategory Category { get; set; } = OverheadCategory.Other;

        // עלות חודשית ממוצעת
        public decimal MonthlyCost { get; set; }

        public bool IsActive { get; set; } = true; // שתוכלי לכבות דברים זמנית

        // סוג הוצאה: עקיפה או קבועה
        public OverheadType Type { get; set; } = OverheadType.עקיפה;
    }
}
