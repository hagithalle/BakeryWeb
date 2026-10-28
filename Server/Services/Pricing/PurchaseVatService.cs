using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services.Pricing
{
    /// <summary>
    /// VAT information of purchases (ingredients, packaging, overhead expenses): validation, saving rules and the
    /// bulk review of items that were not reviewed yet.
    /// </summary>
    public sealed class PurchaseVatService
    {
        private readonly BakeryDbContext _db;
        private readonly BusinessSettingsService _settings;
        private readonly PricingService _pricing;

        public PurchaseVatService(BakeryDbContext db, BusinessSettingsService settings, PricingService pricing)
        {
            _db = db;
            _settings = settings;
            _pricing = pricing;
        }

        /// <summary>Rejects invalid or contradictory VAT information for the current business.</summary>
        public void Validate(IPurchasePriced item) =>
            PurchaseVatRules.Validate(item.PurchaseVatTreatment, item.InputVatDeductible, _settings.VatStatus);

        /// <summary>
        /// Copies the VAT information of an update. A request without a VAT treatment (older clients, forms that do
        /// not show the question) keeps the stored values: a reviewed item can never be reset by omission.
        /// </summary>
        public static void ApplyUpdate(IPurchasePriced existing, IPurchasePriced incoming)
        {
            if (incoming.PurchaseVatTreatment == null) return;
            existing.PurchaseVatTreatment = incoming.PurchaseVatTreatment;
            existing.InputVatDeductible = incoming.InputVatDeductible;
        }

        // ------------------------------------------------------------------ bulk review

        public const string Ingredient = "ingredient", Packaging = "packaging", Overhead = "overhead";

        public sealed record ReviewItem(
            string Kind, int Id, string Name, decimal EnteredPrice, string PriceUnit,
            PurchaseVatTreatment? PurchaseVatTreatment, bool? InputVatDeductible,
            decimal EffectivePrice, PurchaseVatState State, bool IsActive);

        public sealed record Change(string Kind, int Id, PurchaseVatTreatment? PurchaseVatTreatment, bool? InputVatDeductible);

        public async Task<object> GetReviewAsync() => Describe(await LoadAsync());

        /// <summary>The effective cost each item WOULD have with the given choices. Writes nothing.</summary>
        public async Task<object> PreviewAsync(IReadOnlyList<Change> changes)
        {
            var items = await LoadAsync();
            var chosen = Resolve(items, changes, validate: false);
            var rate = _pricing.TodaysVatRate()?.Rate;
            return new
            {
                items = chosen.Select(c =>
                {
                    var (price, state) = PurchaseVatRules.EffectivePrice(c.Item.EnteredPrice, c.Change.PurchaseVatTreatment,
                        c.Change.InputVatDeductible, _settings.VatStatus, rate);
                    string? error = null;
                    try { PurchaseVatRules.Validate(c.Change.PurchaseVatTreatment, c.Change.InputVatDeductible, _settings.VatStatus); }
                    catch (PricingValidationException ex) { error = ex.Message; }
                    return new { kind = c.Item.Kind, id = c.Item.Id, effectivePrice = price, state, error };
                }).ToList(),
            };
        }

        /// <summary>
        /// Saves ONLY the listed items, all or nothing, and only when the caller explicitly confirmed. Ids the user
        /// does not own are rejected exactly like missing ids.
        /// </summary>
        public async Task<object> ApplyAsync(IReadOnlyList<Change> changes, bool confirmed)
        {
            if (!confirmed)
                throw new PricingValidationException("יש לאשר את השינויים לפני השמירה");
            if (changes.Count == 0)
                throw new PricingValidationException("לא נבחרו פריטים לעדכון");
            if (changes.Any(c => c.PurchaseVatTreatment == null))
                throw new PricingValidationException("לכל פריט שנבחר יש לציין אם המחיר כולל מע\"מ");

            var items = await LoadAsync();
            Resolve(items, changes, validate: true);

            // Track the rows themselves (the review list is read without tracking).
            foreach (var change in changes)
            {
                IPurchasePriced row = change.Kind switch
                {
                    Ingredient => await _db.Ingredients.SingleAsync(i => i.Id == change.Id),
                    Packaging => await _db.Packagings.SingleAsync(p => p.Id == change.Id),
                    _ => await _db.OverheadItems.SingleAsync(o => o.Id == change.Id),
                };
                row.PurchaseVatTreatment = change.PurchaseVatTreatment;
                row.InputVatDeductible = change.InputVatDeductible;
            }
            await _db.SaveChangesAsync();   // one save: every listed item or none
            return Describe(await LoadAsync());
        }

        private List<(ReviewItem Item, Change Change)> Resolve(List<ReviewItem> items, IReadOnlyList<Change> changes, bool validate)
        {
            if (changes.GroupBy(c => (c.Kind, c.Id)).Any(g => g.Count() > 1))
                throw new PricingValidationException("פריט מופיע יותר מפעם אחת");
            var byKey = items.ToDictionary(i => (i.Kind, i.Id));
            var result = new List<(ReviewItem, Change)>();
            foreach (var change in changes)
            {
                if (!byKey.TryGetValue((change.Kind, change.Id), out var item))
                    throw new PricingValidationException("אחד או יותר מהפריטים שנבחרו אינם קיימים");
                if (validate)
                    PurchaseVatRules.Validate(change.PurchaseVatTreatment, change.InputVatDeductible, _settings.VatStatus);
                result.Add((item, change));
            }
            return result;
        }

        private async Task<List<ReviewItem>> LoadAsync()
        {
            var business = _settings.VatStatus;
            var rate = _pricing.TodaysVatRate()?.Rate;
            ReviewItem Item(string kind, IPurchasePriced row, int id, decimal entered, string unit, bool active)
            {
                var (price, state) = PurchaseVatRules.EffectivePrice(entered, row.PurchaseVatTreatment, row.InputVatDeductible, business, rate);
                return new ReviewItem(kind, id, row.Name, entered, unit, row.PurchaseVatTreatment, row.InputVatDeductible, price, state, active);
            }

            // query filters: only the current user's rows
            var ingredients = await _db.Ingredients.AsNoTracking().OrderBy(i => i.Name).ToListAsync();
            var packaging = await _db.Packagings.AsNoTracking().OrderBy(p => p.Name).ToListAsync();
            var overhead = await _db.OverheadItems.AsNoTracking().OrderBy(o => o.Name).ToListAsync();
            return ingredients.Select(i => Item(Ingredient, i, i.Id, i.PricePerKg, "ingredient", true))
                .Concat(packaging.Select(p => Item(Packaging, p, p.Id, p.Cost, "unit", true)))
                .Concat(overhead.Select(o => Item(Overhead, o, o.Id, o.MonthlyCost, "month", o.IsActive)))
                .ToList();
        }

        private object Describe(List<ReviewItem> items)
        {
            var rate = _pricing.TodaysVatRate();
            return new
            {
                vatStatus = _settings.VatStatus,
                vatRate = rate?.Rate,
                vatRateEffectiveFrom = rate?.EffectiveFrom,
                unreviewedCount = items.Count(i => i.State is PurchaseVatState.TreatmentUnknown or PurchaseVatState.DeductibilityUnknown),
                items,
            };
        }
    }

    /// <summary>Turns a PricingValidationException from any controller into 400 { message }.</summary>
    public sealed class PricingValidationExceptionFilter : IExceptionFilter
    {
        public void OnException(ExceptionContext context)
        {
            if (context.Exception is not PricingValidationException ex) return;
            context.Result = new BadRequestObjectResult(new { message = ex.Message });
            context.ExceptionHandled = true;
        }
    }
}
