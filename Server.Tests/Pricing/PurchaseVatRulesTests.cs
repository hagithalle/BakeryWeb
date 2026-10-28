using Server.Models;
using Server.Services.Pricing;

namespace Server.Tests.Pricing
{
    /// <summary>Effective purchase cost for every combination (no database). P = 100, r = 18%.</summary>
    public class PurchaseVatRulesTests
    {
        private const PurchaseVatTreatment Incl = PurchaseVatTreatment.IncludesVat, Excl = PurchaseVatTreatment.ExcludesVat, None = PurchaseVatTreatment.NoVat;

        private static (decimal, PurchaseVatState) Cost(PurchaseVatTreatment? t, bool? deductible, VatStatus? business, decimal? rate = 0.18m) =>
            PurchaseVatRules.EffectivePrice(100m, t, deductible, business, rate);

        [Theory]
        // exempt: VAT is part of the cost and is never reclaimed (deductibility is irrelevant)
        [InlineData(Incl, null, VatStatus.Exempt, "100", PurchaseVatState.Applied)]
        [InlineData(Excl, null, VatStatus.Exempt, "118", PurchaseVatState.Applied)]
        [InlineData(None, null, VatStatus.Exempt, "100", PurchaseVatState.Applied)]
        [InlineData(Excl, false, VatStatus.Exempt, "118", PurchaseVatState.Applied)]
        // registered, deductible: VAT is removed from the cost
        [InlineData(Incl, true, VatStatus.Registered, "84.745763", PurchaseVatState.Applied)]
        [InlineData(Excl, true, VatStatus.Registered, "100", PurchaseVatState.Applied)]
        // registered, not deductible: VAT stays in the cost
        [InlineData(Incl, false, VatStatus.Registered, "100", PurchaseVatState.Applied)]
        [InlineData(Excl, false, VatStatus.Registered, "118", PurchaseVatState.Applied)]
        // registered, no VAT on the purchase
        [InlineData(None, null, VatStatus.Registered, "100", PurchaseVatState.Applied)]
        // registered, deductibility not answered: never assumed - used as entered
        [InlineData(Incl, null, VatStatus.Registered, "100", PurchaseVatState.DeductibilityUnknown)]
        [InlineData(Excl, null, VatStatus.Registered, "100", PurchaseVatState.DeductibilityUnknown)]
        public void EffectiveCost(PurchaseVatTreatment? t, bool? deductible, VatStatus business, string expected, PurchaseVatState state)
        {
            Assert.Equal((decimal.Parse(expected, System.Globalization.CultureInfo.InvariantCulture), state), Cost(t, deductible, business));
        }

        [Theory]
        [InlineData(VatStatus.Exempt)]
        [InlineData(VatStatus.Registered)]
        public void NotReviewed_IsUsedExactlyAsEntered(VatStatus business)
        {
            Assert.Equal((100m, PurchaseVatState.TreatmentUnknown), Cost(null, null, business));
        }

        [Fact]
        public void WithoutABusinessVatStatus_OrARate_NothingIsConverted()
        {
            Assert.Equal((100m, PurchaseVatState.VatStatusNotSet), Cost(Excl, false, business: null));
            Assert.Equal((100m, PurchaseVatState.NoVatRate), Cost(Excl, false, VatStatus.Exempt, rate: null));
            Assert.Equal((100m, PurchaseVatState.TreatmentUnknown), Cost(null, null, business: null));
        }

        [Fact]
        public void EffectiveCosts_KeepSixDecimals()
        {
            // 2.90 per kg including VAT, deductible: 2.90 / 1.18 = 2.4576271186...
            Assert.Equal(2.457627m, PurchaseVatRules.EffectivePrice(2.90m, Incl, true, VatStatus.Registered, 0.18m).Effective);
        }

        [Theory]
        [InlineData(9, null, VatStatus.Exempt)]                      // not a treatment
        [InlineData(null, false, VatStatus.Registered)]              // deductibility without a treatment
        [InlineData((int)None, true, VatStatus.Registered)]          // no VAT, but "deductible"
        [InlineData((int)None, false, VatStatus.Registered)]
        [InlineData((int)Incl, true, VatStatus.Exempt)]              // an exempt business cannot deduct
        public void Contradictions_AreRejected(int? treatment, bool? deductible, VatStatus business)
        {
            Assert.Throws<PricingValidationException>(() =>
                PurchaseVatRules.Validate((PurchaseVatTreatment?)treatment, deductible, business));
        }

        [Theory]
        [InlineData(null, null, VatStatus.Exempt)]
        [InlineData((int)Incl, null, VatStatus.Exempt)]
        [InlineData((int)Excl, false, VatStatus.Exempt)]
        [InlineData((int)Incl, true, VatStatus.Registered)]
        [InlineData((int)Excl, null, VatStatus.Registered)]
        [InlineData((int)None, null, null)]
        public void ConsistentChoices_AreAccepted(int? treatment, bool? deductible, VatStatus? business)
        {
            PurchaseVatRules.Validate((PurchaseVatTreatment?)treatment, deductible, business);
        }
    }
}
