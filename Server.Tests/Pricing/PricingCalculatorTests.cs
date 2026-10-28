using Microsoft.Extensions.Configuration;
using Server.Models;
using Server.Services.Pricing;

namespace Server.Tests.Pricing
{
    /// <summary>The pricing rules on their own (no database): every expected value is calculated by hand.</summary>
    public class PricingCalculatorTests
    {
        private static readonly VatRateTable Rates = new(new[]
        {
            new VatRateTable.Entry(new DateOnly(2015, 10, 1), 0.17m),
            new VatRateTable.Entry(new DateOnly(2025, 1, 1), 0.18m),
        });
        private static readonly VatRateTable.Entry Vat18 = Rates.RateOn(new DateOnly(2026, 10, 26))!;

        private static ProductPricing Price(PricingMode? mode, VatStatus? status, decimal cost, decimal? stored = null,
            decimal productMarkup = 0.10m, decimal defaultMarkup = 0.15m, bool complete = true, DateOnly? on = null) =>
            PricingCalculator.Calculate(new PricingInput(mode, stored, productMarkup, defaultMarkup, status,
                on is DateOnly date ? Rates.RateOn(date) : Vat18, cost, complete, LegacyVatRate: 0.17m));

        private static List<string> Codes(ProductPricing p) => p.Issues.Select(i => i.Code).ToList();

        // ------------------------------------------------------------------ VAT rates by date

        [Fact]
        public void VatRate_Is17PercentUntilTheEndOf2024_And18PercentFrom1January2025()
        {
            Assert.Equal(0.17m, Rates.RateOn(new DateOnly(2024, 12, 31))!.Rate);
            Assert.Equal(0.18m, Rates.RateOn(new DateOnly(2025, 1, 1))!.Rate);
            Assert.Equal(new DateOnly(2025, 1, 1), Rates.RateOn(new DateOnly(2026, 10, 26))!.EffectiveFrom);
            Assert.Null(Rates.RateOn(new DateOnly(2015, 9, 30)));   // before the first configured rate: unknown
        }

        [Fact]
        public void VatRates_ComeFromConfiguration_AndInvalidConfigurationFailsAtStartup()
        {
            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Vat:Rates:0:EffectiveFrom"] = "2025-01-01", ["Vat:Rates:0:Rate"] = "0.18",
                ["Vat:Rates:1:EffectiveFrom"] = "2015-10-01", ["Vat:Rates:1:Rate"] = "0.17",
            }).Build();
            Assert.Equal(0.17m, VatRateTable.FromConfiguration(config).RateOn(new DateOnly(2020, 1, 1))!.Rate);

            Assert.Throws<InvalidOperationException>(() => VatRateTable.FromConfiguration(new ConfigurationBuilder().Build()));
            Assert.Throws<InvalidOperationException>(() => new VatRateTable(new[] { new VatRateTable.Entry(new DateOnly(2025, 1, 1), 18m) }));
        }

        [Fact]
        public void TheRateInForceOnTheDayIsUsed()
        {
            var y2024 = Price(PricingMode.Manual, VatStatus.Registered, cost: 50, stored: 117, on: new DateOnly(2024, 6, 1));
            var y2025 = Price(PricingMode.Manual, VatStatus.Registered, cost: 50, stored: 118, on: new DateOnly(2025, 6, 1));
            Assert.Equal((100m, 17m, 0.17m), (y2024.PriceBeforeVat, y2024.VatAmount, y2024.VatRate));
            Assert.Equal((100m, 18m, 0.18m), (y2025.PriceBeforeVat, y2025.VatAmount, y2025.VatRate));
        }

        // ------------------------------------------------------------------ manual prices are final

        [Fact]
        public void Manual_Exempt_ThePriceIsWhatTheCustomerPays_NoVat()
        {
            var p = Price(PricingMode.Manual, VatStatus.Exempt, cost: 80, stored: 100);
            Assert.Equal(100m, p.FinalPrice);
            Assert.Equal(100m, p.PriceBeforeVat);
            Assert.Equal(0m, p.VatAmount);
            Assert.Equal(20m, p.Profit);
        }

        [Fact]
        public void Manual_Registered_VatIsInsideTheFinalPrice()
        {
            var p = Price(PricingMode.Manual, VatStatus.Registered, cost: 80, stored: 118);
            Assert.Equal(118m, p.FinalPrice);
            Assert.Equal(100m, p.PriceBeforeVat);
            Assert.Equal(18m, p.VatAmount);
            Assert.Equal(20m, p.Profit);
        }

        [Fact]
        public void Manual_KeepsTheExactEnteredValue_NeverRounded()
        {
            var p = Price(PricingMode.Manual, VatStatus.Exempt, cost: 40, stored: 63.91728841269841m);
            Assert.Equal(63.91728841269841m, p.FinalPrice);
            Assert.False(p.RoundedToWholeShekel);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("0")]
        [InlineData("-5")]
        public void Manual_WithoutAValidPrice_HasNoPriceAndSaysWhy(string? stored)
        {
            var p = Price(PricingMode.Manual, VatStatus.Exempt, cost: 40, stored: stored == null ? null : decimal.Parse(stored));
            Assert.Null(p.FinalPrice);
            Assert.Null(p.Profit);
            Assert.Contains("InvalidManualPrice", Codes(p));
        }

        // ------------------------------------------------------------------ markup-based prices

        [Fact]
        public void Percentage_UsesTheProductsOwnMarkup_RoundedToAgorot()
        {
            var exempt = Price(PricingMode.Percentage, VatStatus.Exempt, cost: 10.333m, productMarkup: 0.25m);
            Assert.Equal(12.92m, exempt.FinalPrice);   // 10.333 x 1.25 = 12.91625
            Assert.Equal(0.25m, exempt.AppliedMarkup);
            Assert.False(exempt.RoundedToWholeShekel);

            var registered = Price(PricingMode.Percentage, VatStatus.Registered, cost: 10, productMarkup: 0.25m);
            Assert.Equal(14.75m, registered.FinalPrice);   // 10 x 1.25 x 1.18
            Assert.Equal(12.50m, registered.PriceBeforeVat);
            Assert.Equal(2.25m, registered.VatAmount);
            Assert.Equal(2.50m, registered.Profit);
        }

        [Fact]
        public void Recommended_UsesTheDefaultMarkup_RoundedToTheNearestWholeShekel()
        {
            var exempt = Price(PricingMode.Recommended, VatStatus.Exempt, cost: 86.75m);
            Assert.Equal(100m, exempt.FinalPrice);   // 86.75 x 1.15 = 99.7625 -> 100
            Assert.True(exempt.RoundedToWholeShekel);
            Assert.Equal(13.25m, exempt.Profit);      // profit from the price the customer actually pays

            var registered = Price(PricingMode.Recommended, VatStatus.Registered, cost: 86.75m);
            Assert.Equal(118m, registered.FinalPrice);   // 86.75 x 1.15 x 1.18 = 117.71975 -> 118
            Assert.Equal(100m, registered.PriceBeforeVat);
            Assert.Equal(18m, registered.VatAmount);

            // halves round up (away from zero): 10 x 1.25 = 12.50 -> 13
            Assert.Equal(13m, Price(PricingMode.Recommended, VatStatus.Exempt, cost: 10, defaultMarkup: 0.25m).FinalPrice);
        }

        [Fact]
        public void MarkupOnCost_IsNotProfitMarginOnRevenue()
        {
            var p = Price(PricingMode.Manual, VatStatus.Exempt, cost: 80, stored: 100);
            Assert.Equal(0.25m, p.MarkupOnCost);    // 20 / 80
            Assert.Equal(0.20m, p.MarginOnRevenue); // 20 / 100

            var registered = Price(PricingMode.Manual, VatStatus.Registered, cost: 80, stored: 118);
            Assert.Equal(0.20m, registered.MarginOnRevenue); // VAT is not revenue: 20 / 100, not 20 / 118
        }

        // ------------------------------------------------------------------ missing or invalid costs

        [Fact]
        public void IncompleteCost_IsNeverTreatedAsZero()
        {
            var manual = Price(PricingMode.Manual, VatStatus.Exempt, cost: 30, stored: 50, complete: false);
            Assert.Equal(50m, manual.FinalPrice);   // the customer price is still known
            Assert.Null(manual.ProductionCost);
            Assert.Null(manual.Profit);
            Assert.Equal("Incomplete", manual.CostStatus);
            Assert.Contains("CostIncomplete", Codes(manual));

            var recommended = Price(PricingMode.Recommended, VatStatus.Exempt, cost: 30, complete: false);
            Assert.Null(recommended.FinalPrice);
            Assert.Contains("PriceNeedsCost", Codes(recommended));
        }

        [Fact]
        public void ZeroCost_GivesNoProfitAndNoMarkupBasedPrice()
        {
            var manual = Price(PricingMode.Manual, VatStatus.Exempt, cost: 0, stored: 50);
            Assert.Equal(50m, manual.FinalPrice);
            Assert.Null(manual.Profit);
            Assert.Null(manual.MarkupOnCost);
            Assert.Equal("Zero", manual.CostStatus);

            Assert.Null(Price(PricingMode.Percentage, VatStatus.Exempt, cost: 0).FinalPrice);
            Assert.Null(Price(PricingMode.Recommended, VatStatus.Registered, cost: 0).FinalPrice);
        }

        [Fact]
        public void NegativeMarkup_IsRejected()
        {
            var p = Price(PricingMode.Percentage, VatStatus.Exempt, cost: 10, productMarkup: -0.1m);
            Assert.Null(p.FinalPrice);
            Assert.Contains("InvalidMarkup", Codes(p));
        }

        // ------------------------------------------------------------------ VAT status not chosen

        [Fact]
        public void WithoutVatStatus_NothingIsAssumed()
        {
            var manual = Price(PricingMode.Manual, status: null, cost: 80, stored: 100);
            Assert.Equal(100m, manual.FinalPrice);
            Assert.Null(manual.PriceBeforeVat);
            Assert.Null(manual.VatAmount);
            Assert.Null(manual.Profit);
            Assert.Null(manual.VatRate);
            Assert.Contains("VatStatusNotSet", Codes(manual));

            Assert.Null(Price(PricingMode.Recommended, status: null, cost: 80).FinalPrice);
        }

        [Fact]
        public void Registered_WithoutARateForToday_HasNoVatSplit()
        {
            var p = Price(PricingMode.Manual, VatStatus.Registered, cost: 80, stored: 118, on: new DateOnly(2010, 1, 1));
            Assert.Equal(118m, p.FinalPrice);
            Assert.Null(p.PriceBeforeVat);
            Assert.Null(p.Profit);
            Assert.Contains("NoVatRate", Codes(p));
        }

        [Fact]
        public void UnreviewedPurchases_AreCounted_OnlyWhenThereAreAny()
        {
            var flagged = PricingCalculator.Calculate(new PricingInput(PricingMode.Manual, 100, 0.1m, 0.15m, VatStatus.Exempt, Vat18,
                80, true, LegacyVatRate: 0.17m, UnverifiedPurchases: 3));
            var issue = Assert.Single(flagged.Issues, i => i.Code == "PurchaseVatNotVerified");
            Assert.StartsWith("3 ", issue.Message);
            Assert.Equal(20m, flagged.Profit);   // the warning never changes a value

            Assert.DoesNotContain("PurchaseVatNotVerified", Codes(Price(PricingMode.Manual, VatStatus.Exempt, 80, 100)));
            Assert.DoesNotContain("PurchaseVatNotVerified", Codes(Price(PricingMode.Manual, VatStatus.Registered, 80, 118)));
        }

        // ------------------------------------------------------------------ legacy (unconfirmed) prices

        [Theory]
        [InlineData(VatStatus.Exempt)]
        [InlineData(VatStatus.Registered)]
        [InlineData(null)]
        public void Legacy_ShowsExactlyThePreviousPrice_WhateverTheVatStatus_AndClaimsNoProfit(VatStatus? status)
        {
            var p = Price(mode: null, status, cost: 10.646m, stored: 48m);
            Assert.True(p.IsLegacy);
            Assert.Equal(48m * 1.17m, p.FinalPrice);   // 56.16, as before A2
            Assert.Null(p.Profit);
            Assert.Null(p.PriceBeforeVat);
            Assert.Contains("LegacyPriceNotConfirmed", Codes(p));
            Assert.Equal(48m, p.Legacy!.StoredPrice);
            Assert.Equal(48m, p.Legacy.FinalIfStoredIsFinal);
            Assert.Equal(56.16m, p.Legacy.FinalIfStoredExcludesVat);
        }

        [Fact]
        public void Legacy_WithoutAStoredPrice_KeepsThePreviousMarkupPrice()
        {
            var p = Price(mode: null, VatStatus.Exempt, cost: 20m, productMarkup: 0.15m);
            Assert.Equal((20m + 20m * 0.15m) * 1.17m, p.FinalPrice);
            Assert.Null(p.Legacy!.FinalIfStoredIsFinal);
        }
    }
}
