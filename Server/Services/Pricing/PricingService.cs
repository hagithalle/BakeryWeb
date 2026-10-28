using System;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Server.Models;

namespace Server.Services.Pricing
{
    /// <summary>Prices products for the current user: their settings, today's VAT rate and the product's cost.</summary>
    public sealed class PricingService
    {
        // Cost warnings that mean part of the cost could not be calculated at all.
        private static readonly string[] IncompleteCostCodes =
            { "MissingIngredient", "MissingSubRecipe", "Cycle", "MissingRecipe", "MissingPackaging" };

        private readonly BusinessSettingsService _settings;
        private readonly VatRateTable _rates;
        private readonly TimeProvider _time;
        private readonly decimal _legacyVatRate;

        public PricingService(BusinessSettingsService settings, VatRateTable rates, TimeProvider time, IConfiguration configuration)
        {
            _settings = settings;
            _rates = rates;
            _time = time;
            // The single rate the app used before A2; only legacy (unconfirmed) prices still use it.
            _legacyVatRate = configuration.GetValue<decimal>("PricingSettings:VatRate", 0.17m);
        }

        public VatRateTable.Entry? TodaysVatRate() => _rates.RateOn(VatRateTable.TodayInIsrael(_time));

        public ProductPricing Price(Product product, ProductCostBreakdown cost) =>
            PricingCalculator.Calculate(new PricingInput(
                Mode: product.PricingMode,
                StoredPrice: product.ManualSellingPrice,
                ProductMarkup: product.ProfitMarginPercent,
                DefaultMarkup: _settings.EffectiveDefaultMarkup,
                VatStatus: _settings.VatStatus,
                VatRate: TodaysVatRate(),
                ProductionCost: cost.TotalCost,
                CostComplete: !cost.Warnings.Any(w => IncompleteCostCodes.Contains(w.Code)),
                LegacyVatRate: _legacyVatRate,
                UnverifiedPurchases: cost.Warnings
                    .Where(w => w.Code is "PurchaseVatUnknown" or "InputVatDeductibilityUnknown")
                    .Select(w => w.Message).Distinct().Count()));

        /// <summary>Calculates the pricing and fills the product's response fields (old ones kept for existing clients).</summary>
        public ProductPricing Apply(Product product, ProductCostBreakdown cost)
        {
            var pricing = Price(product, cost);
            product.Pricing = pricing;

            if (pricing.IsLegacy)
            {
                // Exactly the values the API returned before A2.
                var hasStored = product.ManualSellingPrice is decimal s && s > 0;
                product.ProfitAmount = hasStored ? product.ManualSellingPrice!.Value - product.TotalCost : product.TotalCost * product.ProfitMarginPercent;
                product.SellingPriceBeforeVAT = hasStored ? product.ManualSellingPrice!.Value : product.TotalCost + product.ProfitAmount;
                product.SellingPriceWithVAT = product.SellingPriceBeforeVAT * (1 + _legacyVatRate);
            }
            else
            {
                product.SellingPriceWithVAT = pricing.FinalPrice;
                product.SellingPriceBeforeVAT = pricing.PriceBeforeVat;
                product.ProfitAmount = pricing.Profit;
            }
            return pricing;
        }

        /// <summary>Rejects pricing values that cannot be saved (checked before anything is written).</summary>
        public static void Validate(PricingMode? mode, decimal? manualPrice, decimal markup)
        {
            if (mode is PricingMode m && !Enum.IsDefined(m))
                throw new PricingValidationException("אופן התמחור לא תקין");
            if (mode == PricingMode.Manual && !(manualPrice > 0))
                throw new PricingValidationException("במחיר ידני יש להזין מחיר מכירה סופי גדול מ-0");
            if (manualPrice is decimal price && price < 0)
                throw new PricingValidationException("מחיר מכירה לא יכול להיות שלילי");
            if (markup < 0 || markup > BusinessSettingsService.MaxMarkup)
                throw new PricingValidationException("אחוז התוספת על העלות חייב להיות בין 0% ל-1000%");
        }
    }
}
