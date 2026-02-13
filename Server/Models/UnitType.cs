namespace Server.Models
{
    /// <summary>
    /// סוגי יחידות ייצור/מכירה קבועות
    /// </summary>
    public enum UnitType
    {
        /// <summary>חתיכה / יחידה בודדת</summary>
        Piece = 0,
        
        /// <summary>עוגה שלמה</summary>
        Whole = 1,
        
        /// <summary>מנה</summary>
        Portion = 2,
        
        /// <summary>קופסה</summary>
        Box = 3,
        
        /// <summary>תריסר (12)</summary>
        Dozen = 4,
        
        /// <summary>ק"ג</summary>
        Kilogram = 5,
        
        /// <summary>גרם</summary>
        Gram = 6,
        
        /// <summary>ליטר</summary>
        Liter = 7
    }

    /// <summary>
    /// Helper class להמרה בין Enum לעברית
    /// </summary>
    public static class UnitTypeExtensions
    {
        public static string ToHebrew(this UnitType unit) => unit switch
        {
            UnitType.Piece => "חתיכה",
            UnitType.Whole => "עוגה שלמה",
            UnitType.Portion => "מנה",
            UnitType.Box => "קופסה",
            UnitType.Dozen => "תריסר",
            UnitType.Kilogram => "ק\"ג",
            UnitType.Gram => "גרם",
            UnitType.Liter => "ליטר",
            _ => "לא ידוע"
        };

        public static UnitType FromHebrew(string hebrew) => hebrew switch
        {
            "חתיכה" => UnitType.Piece,
            "עוגה שלמה" => UnitType.Whole,
            "מנה" => UnitType.Portion,
            "קופסה" => UnitType.Box,
            "תריסר" => UnitType.Dozen,
            "ק\"ג" => UnitType.Kilogram,
            "גרם" => UnitType.Gram,
            "ליטר" => UnitType.Liter,
            _ => UnitType.Piece
        };
    }
}
