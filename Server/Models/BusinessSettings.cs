namespace Server.Models
{
    /// <summary>VAT status of a business ("עוסק פטור" / "עוסק מורשה").</summary>
    public enum VatStatus
    {
        Exempt = 1,     // עוסק פטור: no VAT is added to sales
        Registered = 2, // עוסק מורשה: VAT is added to sales at the rate in force
    }

    /// <summary>
    /// Pricing settings of one business (one row per user, created when the user saves the settings).
    /// No row, or no VatStatus, means "not chosen yet": nothing is assumed.
    /// </summary>
    public class BusinessSettings : IOwnedEntity
    {
        public int Id { get; set; }

        public VatStatus? VatStatus { get; set; }

        /// <summary>Markup on cost for recommended prices, as a fraction (0.15 = 15%). Empty = the default 15%.</summary>
        public decimal? DefaultMarkupPercent { get; set; }

        public int? UserId { get; set; }
    }
}
