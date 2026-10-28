using System;
using Server.Models;

namespace Server.Services.Pricing
{
    /// <summary>Everything the price of one product depends on.</summary>
    public sealed record PricingInput(
        PricingMode? Mode,
        decimal? StoredPrice,          // Products.ManualSellingPrice, exactly as stored
        decimal ProductMarkup,         // Products.ProfitMarginPercent (a markup on cost, 0.15 = 15%)
        decimal DefaultMarkup,         // business default markup for recommended prices
        VatStatus? VatStatus,          // null = not chosen yet
        VatRateTable.Entry? VatRate,   // rate in force today (null = none configured for today)
        decimal ProductionCost,
        bool CostComplete,             // false when a referenced recipe / ingredient / packaging is missing
        decimal LegacyVatRate,         // the single rate used before A2 (PricingSettings:VatRate)
        int UnverifiedPurchases = 0);  // purchases in this cost whose VAT information is missing (used as entered)

    /// <summary>
    /// The single place where selling prices, VAT and profit are calculated. Pure: no database, no clock.
    ///
    /// - Manual:      the stored price is the final amount the customer pays (never changed or rounded).
    /// - Percentage:  cost x (1 + product markup), + VAT when registered, rounded to agorot.
    /// - Recommended: cost x (1 + default markup), + VAT when registered, rounded to whole shekels.
    /// - Legacy (no mode): exactly the previous behaviour (stored price + legacy VAT, or cost x (1 + markup) + legacy
    ///   VAT); the price is shown as before but marked unconfirmed, and no profit is claimed.
    ///
    /// Revenue without VAT = final price (exempt) or final price / (1 + rate) (registered).
    /// Profit = revenue without VAT - production cost. Markup on cost = profit / cost; margin = profit / revenue.
    /// Purchase prices arrive at their effective cost (CostCalculatorService / PurchaseVatRules).
    /// </summary>
    public static class PricingCalculator
    {
        public static ProductPricing Calculate(PricingInput input)
        {
            var pricing = new ProductPricing { Mode = input.Mode, VatStatus = input.VatStatus };
            var costValid = input.CostComplete && input.ProductionCost > 0;

            if (!input.CostComplete)
            {
                pricing.CostStatus = "Incomplete";
                pricing.Issues.Add(new("CostIncomplete", "חסרים נתונים לחישוב עלות הייצור (מתכון, חומר גלם או אריזה) – לא ניתן לחשב רווח"));
            }
            else if (input.ProductionCost <= 0)
            {
                pricing.CostStatus = "Zero";
                pricing.Issues.Add(new("ZeroCost", "עלות הייצור היא 0 – כנראה חסרים מחירים או כמויות; לא ניתן לחשב רווח"));
            }
            if (costValid) pricing.ProductionCost = Money(input.ProductionCost);

            // Any product (legacy or not) whose cost uses purchases without complete VAT information
            if (input.UnverifiedPurchases > 0)
                pricing.Issues.Add(new("PurchaseVatNotVerified",
                    $"{input.UnverifiedPurchases} פריטי קנייה בעלות הזו עדיין ללא פרטי מע\"מ מלאים – העלות מחושבת לפי המחירים כפי שהוזנו"));

            if (input.Mode == null)
                return Legacy(input, pricing);

            if (input.VatStatus == null)
                pricing.Issues.Add(new("VatStatusNotSet", "לא נבחר סטטוס מע\"מ בהגדרות העסק – לא ניתן לחשב מע\"מ ורווח"));

            decimal? rate = input.VatStatus switch
            {
                Server.Models.VatStatus.Exempt => 0m,
                Server.Models.VatStatus.Registered => input.VatRate?.Rate,
                _ => null,
            };
            if (input.VatStatus == Server.Models.VatStatus.Registered)
            {
                if (input.VatRate == null)
                    pricing.Issues.Add(new("NoVatRate", "לא מוגדר שיעור מע\"מ לתאריך היום"));
                else
                    pricing.VatRateEffectiveFrom = input.VatRate.EffectiveFrom;
            }
            pricing.VatRate = rate;

            // ---- final price
            switch (input.Mode)
            {
                case PricingMode.Manual:
                    if (input.StoredPrice is decimal stored && stored > 0)
                        pricing.FinalPrice = stored;   // exactly as entered
                    else
                        pricing.Issues.Add(new("InvalidManualPrice", "לא הוזן מחיר מכירה ידני תקין"));
                    break;

                case PricingMode.Percentage:
                case PricingMode.Recommended:
                    var recommended = input.Mode == PricingMode.Recommended;
                    var markup = recommended ? input.DefaultMarkup : input.ProductMarkup;
                    pricing.AppliedMarkup = markup;
                    if (markup < 0)
                        pricing.Issues.Add(new("InvalidMarkup", "אחוז התוספת על העלות אינו תקין"));
                    else if (!costValid)
                        pricing.Issues.Add(new("PriceNeedsCost", "לא ניתן לחשב מחיר לפי אחוז בלי עלות ייצור תקינה"));
                    else if (rate is decimal r)
                    {
                        var final = input.ProductionCost * (1 + markup) * (1 + r);
                        pricing.FinalPrice = recommended
                            ? Math.Round(final, 0, MidpointRounding.AwayFromZero)
                            : Money(final);
                        pricing.RoundedToWholeShekel = recommended;
                    }
                    break;
            }

            // ---- VAT split and profit (only when the final price and the VAT treatment are known)
            if (pricing.FinalPrice is decimal price && rate is decimal vat)
            {
                var beforeVat = vat == 0 ? price : Money(price / (1 + vat));
                pricing.PriceBeforeVat = beforeVat;
                pricing.VatAmount = price - beforeVat;

                if (costValid)
                {
                    var profit = Money(beforeVat - input.ProductionCost);
                    pricing.Profit = profit;
                    pricing.MarkupOnCost = Ratio(profit / input.ProductionCost);
                    pricing.MarginOnRevenue = beforeVat > 0 ? Ratio(profit / beforeVat) : null;
                }
            }
            return pricing;
        }

        /// <summary>The behaviour before A2, unchanged: nothing a customer sees changes until the owner confirms.</summary>
        private static ProductPricing Legacy(PricingInput input, ProductPricing pricing)
        {
            var hasStored = input.StoredPrice is decimal s && s > 0;
            // Same expressions as the previous ProductService.CalculateSellingPrice, so the values are identical.
            var beforeVat = hasStored ? input.StoredPrice!.Value : input.ProductionCost + input.ProductionCost * input.ProductMarkup;
            var displayed = beforeVat * (1 + input.LegacyVatRate);

            pricing.FinalPrice = displayed;
            pricing.Legacy = new LegacyPriceReview
            {
                StoredPrice = input.StoredPrice,
                DisplayedPrice = displayed,
                LegacyVatRate = input.LegacyVatRate,
                FinalIfStoredIsFinal = hasStored ? input.StoredPrice : null,
                FinalIfStoredExcludesVat = hasStored ? Money(displayed) : null,
            };
            pricing.Issues.Add(new("LegacyPriceNotConfirmed",
                "מחיר מוצר זה נשמר לפני שהוגדר אם הוא כולל מע\"מ. המחיר מוצג כמו קודם; יש לאשר מהו המחיר הסופי ללקוח"));
            return pricing;
        }

        public static decimal Money(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);
        private static decimal Ratio(decimal value) => Math.Round(value, 4, MidpointRounding.AwayFromZero);
    }
}
