namespace Server.Models
{
    public class OverheadItem
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty; // "רואה חשבון", "חשמל", "ביטוח"

        // עלות חודשית ממוצעת
        public decimal MonthlyCost { get; set; }

        public bool IsActive { get; set; } = true; // שתוכלי לכבות דברים זמנית
    }
}
