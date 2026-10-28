namespace Server.Models
{
    /// <summary>What the entered purchase price contains. Not set (null) = not reviewed yet: the price is used as entered.</summary>
    public enum PurchaseVatTreatment
    {
        IncludesVat = 1, // the entered price includes VAT
        ExcludesVat = 2, // the entered price is before VAT (VAT is paid on top)
        NoVat = 3,       // no VAT is paid on this purchase (e.g. fresh produce, a VAT-exempt supplier)
    }

    /// <summary>
    /// A purchase whose price may or may not include VAT (ingredients, packaging, overhead expenses).
    /// InputVatDeductible is only meaningful for a VAT-registered business and a purchase with VAT; it is never
    /// assumed. (A future partial deduction percentage can be added next to it without changing these meanings.)
    /// </summary>
    public interface IPurchasePriced
    {
        string Name { get; }
        PurchaseVatTreatment? PurchaseVatTreatment { get; set; }
        bool? InputVatDeductible { get; set; }
    }
}
