using System;
using Server.Models;

namespace Server.Services.Pricing
{
    /// <summary>Why an item's effective cost is (or is not) adjusted for VAT.</summary>
    public enum PurchaseVatState
    {
        Applied = 0,           // treatment known and applied
        TreatmentUnknown = 1,  // not reviewed: price used as entered
        DeductibilityUnknown = 2, // registered business, VAT on the purchase, deductibility not answered: as entered
        VatStatusNotSet = 3,   // the business has not chosen its VAT status: as entered
        NoVatRate = 4,         // no VAT rate configured for the calculation date: as entered
    }

    /// <summary>
    /// The cost a purchase really has for the business, from the price as entered. Pure (no database, no clock).
    ///
    /// Exempt business (VAT is never reclaimed):         includes VAT -> P, excludes VAT -> P x (1 + r), no VAT -> P
    /// Registered, deductible:                           includes VAT -> P / (1 + r), excludes VAT -> P, no VAT -> P
    /// Registered, not deductible:                       includes VAT -> P, excludes VAT -> P x (1 + r), no VAT -> P
    /// Anything unknown (treatment, deductibility, VAT status, rate): P exactly as entered (never converted).
    /// Deductibility is never assumed. Effective prices keep 6 decimals (prices per kg are small).
    /// </summary>
    public static class PurchaseVatRules
    {
        public static (decimal Effective, PurchaseVatState State) EffectivePrice(
            decimal entered, PurchaseVatTreatment? treatment, bool? deductible, VatStatus? business, decimal? rate)
        {
            if (treatment == null) return (entered, PurchaseVatState.TreatmentUnknown);
            if (business == null) return (entered, PurchaseVatState.VatStatusNotSet);
            if (treatment == PurchaseVatTreatment.NoVat) return (entered, PurchaseVatState.Applied);
            if (rate is not decimal r) return (entered, PurchaseVatState.NoVatRate);

            var includes = treatment == PurchaseVatTreatment.IncludesVat;
            if (business == VatStatus.Exempt)
                return (includes ? entered : Round(entered * (1 + r)), PurchaseVatState.Applied);

            // Registered: only an explicit answer changes anything
            if (deductible == null) return (entered, PurchaseVatState.DeductibilityUnknown);
            if (deductible.Value)
                return (includes ? Round(entered / (1 + r)) : entered, PurchaseVatState.Applied);
            return (includes ? entered : Round(entered * (1 + r)), PurchaseVatState.Applied);
        }

        /// <summary>Rejects invalid or contradictory VAT information (checked before anything is written).</summary>
        public static void Validate(PurchaseVatTreatment? treatment, bool? deductible, VatStatus? business)
        {
            if (treatment is PurchaseVatTreatment t && !Enum.IsDefined(t))
                throw new PricingValidationException("סוג המע\"מ במחיר הקנייה אינו תקין");
            if (treatment == null && deductible != null)
                throw new PricingValidationException("לא ניתן לציין קיזוז מע\"מ בלי לציין אם המחיר כולל מע\"מ");
            if (treatment == PurchaseVatTreatment.NoVat && deductible != null)
                throw new PricingValidationException("בקנייה ללא מע\"מ אין מע\"מ לקיזוז");
            if (business == VatStatus.Exempt && deductible == true)
                throw new PricingValidationException("עוסק פטור אינו יכול לקזז מע\"מ תשומות");
        }

        public static decimal Round(decimal value) => Math.Round(value, 6, MidpointRounding.AwayFromZero);
    }
}
