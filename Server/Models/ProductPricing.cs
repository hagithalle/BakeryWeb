using System;
using System.Collections.Generic;

namespace Server.Models
{
    /// <summary>
    /// How a product's selling price is set. A product saved before pricing modes existed has no mode (null):
    /// it is a legacy product whose stored price has not been confirmed, and it keeps its previous behaviour.
    /// </summary>
    public enum PricingMode
    {
        Manual = 1,      // the stored price is the final amount the customer pays
        Percentage = 2,  // cost x (1 + this product's markup), plus VAT when registered
        Recommended = 3, // cost x (1 + the business default markup), plus VAT when registered, whole shekels
    }

    /// <summary>
    /// The selling price, VAT and profit of a product, as calculated by the server. Every value that cannot be
    /// calculated reliably is null and an issue explains why - nothing is silently replaced by zero.
    /// Percentages are fractions (0.15 = 15%).
    /// </summary>
    public sealed class ProductPricing
    {
        /// <summary>null = legacy (price not confirmed).</summary>
        public PricingMode? Mode { get; set; }
        public bool IsLegacy => Mode == null;

        public VatStatus? VatStatus { get; set; }
        /// <summary>Output VAT rate applied (0 for exempt; null when the VAT status is not chosen).</summary>
        public decimal? VatRate { get; set; }
        public DateOnly? VatRateEffectiveFrom { get; set; }

        /// <summary>Production cost (null when incomplete or zero).</summary>
        public decimal? ProductionCost { get; set; }
        /// <summary>Complete, Incomplete (missing data) or Zero.</summary>
        public string CostStatus { get; set; } = "Complete";

        /// <summary>The amount the customer pays.</summary>
        public decimal? FinalPrice { get; set; }
        /// <summary>Revenue without VAT (= FinalPrice for an exempt business).</summary>
        public decimal? PriceBeforeVat { get; set; }
        public decimal? VatAmount { get; set; }

        /// <summary>Revenue without VAT minus production cost.</summary>
        public decimal? Profit { get; set; }
        /// <summary>Profit / production cost.</summary>
        public decimal? MarkupOnCost { get; set; }
        /// <summary>Profit / revenue without VAT.</summary>
        public decimal? MarginOnRevenue { get; set; }

        /// <summary>The markup used to calculate the price (percentage and recommended modes).</summary>
        public decimal? AppliedMarkup { get; set; }
        /// <summary>True when the final price was rounded to whole shekels (recommended mode).</summary>
        public bool RoundedToWholeShekel { get; set; }

        /// <summary>Only for legacy products: what is stored and what is shown, so the owner can confirm.</summary>
        public LegacyPriceReview? Legacy { get; set; }

        public List<PricingIssue> Issues { get; set; } = new();
    }

    /// <summary>
    /// A legacy product's stored price and the price the app has been showing for it. Nothing here changes data:
    /// the owner confirms one interpretation explicitly by saving the product with a pricing mode.
    /// </summary>
    public sealed class LegacyPriceReview
    {
        /// <summary>Products.ManualSellingPrice exactly as stored (null when there is none).</summary>
        public decimal? StoredPrice { get; set; }
        /// <summary>The price the app showed before A2 (stored price + legacy VAT).</summary>
        public decimal DisplayedPrice { get; set; }
        public decimal LegacyVatRate { get; set; }
        /// <summary>"The customer pays the stored price" / "the customer pays the displayed price".</summary>
        public decimal? FinalIfStoredIsFinal { get; set; }
        public decimal? FinalIfStoredExcludesVat { get; set; }
    }

    public sealed record PricingIssue(string Code, string Message);
}
