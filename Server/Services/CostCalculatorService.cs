using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services
{
    /// <summary>
    /// The single place where recipe and product costs are calculated.
    ///
    /// Costs never depend on what the caller happened to load: the calculator reads the current user's recipes
    /// (with ingredient lines and sub-recipe lines), ingredients, packaging, labor settings and overhead itself,
    /// once per request scope (and again after every save). All queries go through the per-user query filters.
    ///
    /// Formulas are unchanged from the previous version:
    /// - ingredient line   = price per kg x quantity converted to kg (see ConvertToKilogram)
    /// - sub-recipe line   = sub-recipe cost per output unit x quantity (the line's unit is not used yet)
    /// - recipe labor      = (prep + bake minutes) / 60 x hourly labor cost
    /// - recipe overhead   = sum of active monthly overhead / 30, once per recipe batch
    /// - cost per unit     = batch total / output units (1 when not set)
    /// - single product    = recipe cost per unit x recipe units + packaging + packaging-time labor and overhead
    /// - box               = sum of (recipe cost per unit x quantity) + packaging + packaging-time labor and overhead
    ///
    /// Breakdowns are "flattened": a sub-recipe's share is split into its ingredients, labor and overhead, so the
    /// ingredients + labor + overhead (+ packaging) columns always add up to the total and nothing is counted twice.
    /// Problems in the data (unknown units, zero prices, missing references...) never change a value silently:
    /// the value is calculated exactly as before and a warning explains why it may be wrong.
    /// </summary>
    public class CostCalculatorService
    {
        private readonly BakeryDbContext _context;
        private CostData? _data;

        public CostCalculatorService(BakeryDbContext context)
        {
            _context = context;
            // Anything saved in this request (new recipe, changed price...) must be visible to later calculations.
            _context.SavedChanges += (_, _) => _data = null;
        }

        private CostData Data => _data ??= LoadData();

        private sealed class CostData
        {
            public required Dictionary<int, Recipe> Recipes { get; init; }
            public required Dictionary<int, Ingredient> Ingredients { get; init; }
            public required Dictionary<int, decimal> PackagingCosts { get; init; }
            public required bool HasLaborSettings { get; init; }
            public required decimal HourlyLabor { get; init; }
            public required decimal HourlyOverhead { get; init; }
            public required decimal BatchOverhead { get; init; }
            public Dictionary<int, RecipeCostBreakdown> RecipeCosts { get; } = new();
        }

        private CostData LoadData()
        {
            // Read-only snapshots of the current user's rows (query filters apply); never tracked, never saved.
            var recipes = _context.Recipes.AsNoTracking()
                .Include(r => r.Ingredients)
                .Include(r => r.BaseRecipes)
                .ToList();
            var ingredients = _context.Ingredients.AsNoTracking().ToList();
            var packaging = _context.Packagings.AsNoTracking().Select(p => new { p.Id, p.Cost }).ToList();
            // The current user's own settings (the query filter limits LaborSettings to their single row)
            var labor = _context.LaborSettings.AsNoTracking().FirstOrDefault();
            var activeOverhead = _context.OverheadItems.AsNoTracking()
                .Where(x => x.IsActive)
                .Select(x => x.MonthlyCost)
                .ToList();

            decimal hourlyLabor = 0, hourlyOverhead = 0;
            if (labor != null)
            {
                var monthlyTotal = labor.DesiredMonthlySalary *
                    (1 + labor.PensionPercent + labor.KerenHishtalmutPercent + labor.OtherEmployerCostsPercent);
                var monthlyHours = labor.WorkingDaysPerMonth * labor.WorkingHoursPerDay;
                hourlyLabor = monthlyHours == 0 ? 0 : monthlyTotal / monthlyHours;
                hourlyOverhead = monthlyHours == 0 ? 0 : activeOverhead.Sum() / monthlyHours;
            }

            return new CostData
            {
                Recipes = recipes.ToDictionary(r => r.Id),
                Ingredients = ingredients.ToDictionary(i => i.Id),
                PackagingCosts = packaging.ToDictionary(p => p.Id, p => p.Cost),
                HasLaborSettings = labor != null,
                HourlyLabor = hourlyLabor,
                HourlyOverhead = hourlyOverhead,
                // Daily overhead (monthly / 30) charged once per recipe batch - the existing method, kept as is.
                BatchOverhead = activeOverhead.Sum(m => m / 30m),
            };
        }

        public decimal GetHourlyLaborCost() => Data.HourlyLabor;

        public decimal GetHourlyOverheadCost() => Data.HourlyOverhead;

        // המרת כל יחידה לקילו (או ליטר עבור נוזלים)
        private static decimal ConvertToKilogram(decimal quantity, UnitOfMeasure unit)
        {
            return unit switch
            {
                UnitOfMeasure.Kilogram => quantity,
                UnitOfMeasure.Gram => quantity / 1000,
                UnitOfMeasure.Liter => quantity,  // נוזלים - נשמור בליטר
                UnitOfMeasure.Milliliter => quantity / 1000,
                UnitOfMeasure.Unit => quantity,  // יחידות - נשמור כמות
                UnitOfMeasure.Dozen => quantity * 12,  // תריסר לגרם (הנחה: ביצה = 50 גרם)
                UnitOfMeasure.Package => quantity,  // חבילה - יחידה
                UnitOfMeasure.Teaspoon => quantity * 0.005m,  // כפית ≈ 5 גרם
                UnitOfMeasure.Tablespoon => quantity * 0.015m,  // כף ≈ 15 גרם
                UnitOfMeasure.Cup => quantity * 0.240m,  // כוס ≈ 240 מ"ל (ליטר)
                _ => quantity
            };
        }

        private enum UnitKind { Unknown, Mass, Volume, Count }

        private static UnitKind KindOf(UnitOfMeasure unit) => unit switch
        {
            UnitOfMeasure.Kilogram or UnitOfMeasure.Gram => UnitKind.Mass,
            UnitOfMeasure.Liter or UnitOfMeasure.Milliliter or UnitOfMeasure.Teaspoon
                or UnitOfMeasure.Tablespoon or UnitOfMeasure.Cup => UnitKind.Volume,
            UnitOfMeasure.Unit or UnitOfMeasure.Dozen or UnitOfMeasure.Package => UnitKind.Count,
            _ => UnitKind.Unknown
        };

        // ------------------------------------------------------------------ ingredient lines

        /// <summary>Cost of one ingredient line (price of the user's ingredient row, not of whatever was loaded).</summary>
        public decimal CalculateIngredientCost(RecipeIngredient line) => IngredientLine(line, null).Cost;

        private (decimal Cost, List<CostWarning> Warnings) IngredientLine(RecipeIngredient line, int? recipeId)
        {
            var warnings = new List<CostWarning>();
            if (!Data.Ingredients.TryGetValue(line.IngredientId, out var ingredient))
            {
                warnings.Add(CostWarning.MissingIngredient(recipeId, line.Id));
                return (0, warnings);
            }

            var unit = (UnitOfMeasure)line.Unit;
            if (!Enum.IsDefined(unit))
                warnings.Add(CostWarning.UnknownLineUnit(recipeId, line.Id, ingredient.Name));
            else if (!Enum.IsDefined(ingredient.Unit))
                warnings.Add(CostWarning.UnknownIngredientUnit(recipeId, line.Id, ingredient.Name));
            else
            {
                var lineKind = KindOf(unit);
                var priceKind = KindOf(ingredient.Unit);
                if (lineKind == UnitKind.Count && priceKind != UnitKind.Count || lineKind != UnitKind.Count && priceKind == UnitKind.Count)
                    warnings.Add(CostWarning.UnitMismatch(recipeId, line.Id, ingredient.Name));
                else if (lineKind != priceKind)
                    warnings.Add(CostWarning.ApproximateConversion(recipeId, line.Id, ingredient.Name));
            }

            if (ingredient.PricePerKg == 0)
                warnings.Add(CostWarning.ZeroPrice(recipeId, line.Id, ingredient.Name));

            return (ingredient.PricePerKg * ConvertToKilogram(line.Quantity, unit), warnings);
        }

        // ------------------------------------------------------------------ recipes

        /// <summary>
        /// Cost of a recipe. A saved recipe is always calculated from the database (complete with nested
        /// sub-recipes); an unsaved one from the object passed in.
        /// </summary>
        public RecipeCostBreakdown CalculateRecipeCost(Recipe recipe)
        {
            if (recipe == null)
                return new RecipeCostBreakdown();
            if (recipe.Id > 0 && Data.Recipes.TryGetValue(recipe.Id, out var stored))
                return RecipeCost(stored, new HashSet<int>());
            return Compute(recipe, new HashSet<int>());
        }

        private RecipeCostBreakdown RecipeCost(Recipe recipe, HashSet<int> path)
        {
            if (Data.RecipeCosts.TryGetValue(recipe.Id, out var known))
                return known;
            var result = Compute(recipe, path);
            Data.RecipeCosts[recipe.Id] = result;
            return result;
        }

        private RecipeCostBreakdown Compute(Recipe recipe, HashSet<int> path)
        {
            var recipeId = recipe.Id > 0 ? recipe.Id : (int?)null;
            if (recipeId != null) path.Add(recipeId.Value);
            var warnings = new List<CostWarning>();

            // Own ingredient lines
            var lineCosts = new Dictionary<int, decimal>();
            decimal ingredientsCost = 0;
            foreach (var line in recipe.Ingredients ?? new List<RecipeIngredient>())
            {
                var (cost, lineWarnings) = IngredientLine(line, recipeId);
                ingredientsCost += cost;
                if (line.Id > 0) lineCosts[line.Id] = cost;
                warnings.AddRange(lineWarnings);
            }

            // Sub-recipe lines: each contributes its proportional share of the sub-recipe's ingredients, labor and
            // overhead (which already include ITS sub-recipes), so every cost is counted exactly once.
            var subLines = new Dictionary<int, (decimal CostPerUnit, decimal Total)>();
            decimal subIngredients = 0, subLabor = 0, subOverhead = 0;
            foreach (var line in recipe.BaseRecipes ?? new List<RecipeItem>())
            {
                if (path.Contains(line.BaseRecipeId))
                {
                    warnings.Add(CostWarning.Cycle(recipeId, line.Id));
                    continue;
                }
                if (!Data.Recipes.TryGetValue(line.BaseRecipeId, out var baseRecipe))
                {
                    warnings.Add(CostWarning.MissingSubRecipe(recipeId, line.Id));
                    continue;
                }
                if (line.Unit != UnitOfMeasure.Unit)
                    warnings.Add(CostWarning.SubRecipeUnitIgnored(recipeId, line.Id, baseRecipe.Name));

                var b = RecipeCost(baseRecipe, new HashSet<int>(path));
                var units = b.OutputUnits;
                var shareIngredients = b.TotalIngredientsCost / units * line.Quantity;
                var shareLabor = b.TotalLaborCost / units * line.Quantity;
                var shareOverhead = b.TotalOverheadCost / units * line.Quantity;
                subIngredients += shareIngredients;
                subLabor += shareLabor;
                subOverhead += shareOverhead;
                if (line.Id > 0) subLines[line.Id] = (b.CostPerUnit, shareIngredients + shareLabor + shareOverhead);
                warnings.AddRange(b.Warnings.Where(w => !warnings.Contains(w)));
            }

            // עלות עבודה (הכנה + אפייה בלבד)
            var totalTime = (recipe.PrepTime ?? 0) + (recipe.BakeTime ?? 0);
            var laborCost = (totalTime / 60m) * Data.HourlyLabor;
            // עלויות תקורה למנה (חודשי / 30)
            var overheadCost = Data.BatchOverhead;

            if (recipe.OutputUnits <= 0) warnings.Add(CostWarning.MissingYield(recipeId, recipe.Name));
            if ((recipe.Ingredients?.Count ?? 0) == 0 && (recipe.BaseRecipes?.Count ?? 0) == 0)
                warnings.Add(CostWarning.NoIngredients(recipeId, recipe.Name));
            if (!Data.HasLaborSettings) warnings.Add(CostWarning.NoLaborSettings());

            var totalIngredients = ingredientsCost + subIngredients;
            var totalLabor = laborCost + subLabor;
            var totalOverhead = overheadCost + subOverhead;
            var totalCost = totalIngredients + totalLabor + totalOverhead;
            var outputUnits = recipe.OutputUnits > 0 ? recipe.OutputUnits : 1;

            if (recipeId != null) path.Remove(recipeId.Value);
            return new RecipeCostBreakdown
            {
                IngredientsCost = ingredientsCost,
                BaseRecipesCost = subIngredients + subLabor + subOverhead,
                LaborCost = laborCost,
                OverheadCost = overheadCost,
                PackagingCost = 0, // אריזה מטופלת ברמת המוצר
                TotalIngredientsCost = totalIngredients,
                TotalLaborCost = totalLabor,
                TotalOverheadCost = totalOverhead,
                TotalCost = totalCost,
                CostPerUnit = totalCost / outputUnits,
                OutputUnits = outputUnits,
                IngredientLineCosts = lineCosts,
                SubRecipeLineCosts = subLines,
                Warnings = warnings.Distinct().ToList(),
            };
        }

        /// <summary>Calculates the recipe's costs and writes them onto the recipe and its lines (for the API response).</summary>
        public RecipeCostBreakdown ApplyRecipeCosts(Recipe recipe)
        {
            var costs = CalculateRecipeCost(recipe);
            recipe.IngredientsCost = costs.IngredientsCost;
            recipe.BaseRecipesCost = costs.BaseRecipesCost;
            recipe.LaborCost = costs.LaborCost;
            recipe.OverheadCost = costs.OverheadCost;
            recipe.PackagingCost = costs.PackagingCost;
            recipe.TotalCost = costs.TotalCost;
            recipe.CostPerUnit = costs.CostPerUnit;
            recipe.CostWarnings = costs.Warnings;
            foreach (var line in recipe.Ingredients ?? new List<RecipeIngredient>())
                line.Cost = costs.IngredientLineCosts.TryGetValue(line.Id, out var c) ? c : IngredientLine(line, null).Cost;
            foreach (var line in recipe.BaseRecipes ?? new List<RecipeItem>())
            {
                if (!costs.SubRecipeLineCosts.TryGetValue(line.Id, out var c)) continue;
                line.CostPerUnit = c.CostPerUnit;
                line.TotalCost = c.Total;
            }
            return costs;
        }

        // ------------------------------------------------------------------ products

        /// <summary>
        /// Costs of a product (single or box). Uses the product's own fields and lines (RecipeId, PackageItems,
        /// PackagingId, AdditionalPackaging); recipes and packaging prices always come from the database.
        /// </summary>
        public ProductCostBreakdown CalculateProductCost(Product product)
        {
            if (product == null)
                return new ProductCostBreakdown();

            var warnings = new List<CostWarning>();
            var unitConversionRate = product.UnitConversionRate > 0 ? product.UnitConversionRate : 1;
            decimal recipeIngredientsCost = 0, recipeLaborCost = 0, recipeOverheadCost = 0, recipeTotalCost = 0;

            void AddRecipe(int? recipeId, decimal quantity)
            {
                if (recipeId == null || !Data.Recipes.TryGetValue(recipeId.Value, out var recipe))
                {
                    warnings.Add(CostWarning.MissingProductRecipe());
                    return;
                }
                var cost = RecipeCost(recipe, new HashSet<int>());
                recipeIngredientsCost += cost.TotalIngredientsCost / cost.OutputUnits * quantity;
                recipeLaborCost += cost.TotalLaborCost / cost.OutputUnits * quantity;
                recipeOverheadCost += cost.TotalOverheadCost / cost.OutputUnits * quantity;
                recipeTotalCost += cost.CostPerUnit * quantity;
                warnings.AddRange(cost.Warnings);
            }

            if (product.ProductType == ProductType.Package)
            {
                foreach (var item in product.PackageItems ?? new List<PackageItem>())
                    AddRecipe(item.RecipeId, item.Quantity > 0 ? item.Quantity : 1);
            }
            else
            {
                AddRecipe(product.RecipeId, unitConversionRate);
            }

            // עלות אריזה ספציפית + אריזה נוספת
            decimal PackagingCost(int id)
            {
                if (Data.PackagingCosts.TryGetValue(id, out var cost)) return cost;
                warnings.Add(CostWarning.MissingPackaging());
                return 0;
            }
            var basePackagingCost = product.PackagingId is int packagingId ? PackagingCost(packagingId) : 0;
            var extraPackagingCost = (product.AdditionalPackaging ?? new List<ProductAdditionalPackaging>())
                .Sum(p => PackagingCost(p.PackagingId) * (p.Quantity > 0 ? p.Quantity : 1));
            var packagingCost = basePackagingCost + extraPackagingCost;

            // עלות עבודת אריזה ותקורה על זמן האריזה
            var packagingTime = product.PackagingTimeMinutes ?? 0;
            var packagingLaborCost = (packagingTime / 60m) * Data.HourlyLabor;
            var packagingOverheadCost = (packagingTime / 60m) * Data.HourlyOverhead;
            if (packagingTime > 0 && !Data.HasLaborSettings) warnings.Add(CostWarning.NoLaborSettings());

            return new ProductCostBreakdown
            {
                RecipeIngredientsCost = recipeIngredientsCost,
                RecipeLaborCost = recipeLaborCost,
                RecipeOverheadCost = recipeOverheadCost,
                RecipeCost = recipeTotalCost,
                PackagingCost = packagingCost,
                PackagingLaborCost = packagingLaborCost,
                PackagingOverheadCost = packagingOverheadCost,
                UnitConversionRate = unitConversionRate,
                TotalCost = recipeTotalCost + packagingCost + packagingLaborCost + packagingOverheadCost,
                Warnings = warnings.Distinct().ToList(),
            };
        }

        /// <summary>Calculates the product's costs and writes them onto the product (for the API response).</summary>
        public ProductCostBreakdown ApplyProductCosts(Product product)
        {
            var costs = CalculateProductCost(product);
            product.RecipeIngredientsCost = costs.RecipeIngredientsCost;
            product.RecipeLaborCost = costs.RecipeLaborCost;
            product.RecipeOverheadCost = costs.RecipeOverheadCost;
            product.PackagingCost = costs.PackagingCost;
            product.PackagingLaborCost = costs.PackagingLaborCost;
            product.PackagingOverheadCost = costs.PackagingOverheadCost;
            product.TotalCost = costs.TotalCost;
            product.CostWarnings = costs.Warnings;
            return costs;
        }
    }

    // מודל לתוצאות חישוב מתכון
    public class RecipeCostBreakdown
    {
        /// <summary>The recipe's own ingredient lines.</summary>
        public decimal IngredientsCost { get; set; }
        /// <summary>Proportional cost of the sub-recipes used (their ingredients, labor and overhead).</summary>
        public decimal BaseRecipesCost { get; set; }  // עלות מתכונים בסיסיים
        /// <summary>The recipe's own labor (prep + bake time).</summary>
        public decimal LaborCost { get; set; }
        /// <summary>The recipe's own overhead (one batch).</summary>
        public decimal OverheadCost { get; set; }
        public decimal PackagingCost { get; set; }
        /// <summary>Own ingredients + the ingredients inside the sub-recipe shares.</summary>
        public decimal TotalIngredientsCost { get; set; }
        public decimal TotalLaborCost { get; set; }
        public decimal TotalOverheadCost { get; set; }
        /// <summary>= TotalIngredientsCost + TotalLaborCost + TotalOverheadCost = Ingredients + BaseRecipes + Labor + Overhead.</summary>
        public decimal TotalCost { get; set; }
        public decimal CostPerUnit { get; set; }
        public int OutputUnits { get; set; } = 1;
        public IReadOnlyDictionary<int, decimal> IngredientLineCosts { get; set; } = new Dictionary<int, decimal>();
        public IReadOnlyDictionary<int, (decimal CostPerUnit, decimal Total)> SubRecipeLineCosts { get; set; } =
            new Dictionary<int, (decimal, decimal)>();
        public IReadOnlyList<CostWarning> Warnings { get; set; } = Array.Empty<CostWarning>();
    }

    /// <summary>Cost-preview response: the cost breakdown plus the selling price, VAT and profit.</summary>
    public class ProductCostPreview : ProductCostBreakdown
    {
        public ProductPricing? Pricing { get; set; }

        public static ProductCostPreview From(ProductCostBreakdown c, ProductPricing pricing) => new()
        {
            RecipeIngredientsCost = c.RecipeIngredientsCost,
            RecipeLaborCost = c.RecipeLaborCost,
            RecipeOverheadCost = c.RecipeOverheadCost,
            RecipeCost = c.RecipeCost,
            PackagingCost = c.PackagingCost,
            PackagingLaborCost = c.PackagingLaborCost,
            PackagingOverheadCost = c.PackagingOverheadCost,
            UnitConversionRate = c.UnitConversionRate,
            TotalCost = c.TotalCost,
            Warnings = c.Warnings,
            Pricing = pricing,
        };
    }

    // מודל לתוצאות חישוב מוצר סופי
    public class ProductCostBreakdown
    {
        // עלויות מהמתכון (כולל החלק היחסי של מתכוני הבסיס)
        public decimal RecipeIngredientsCost { get; set; }
        public decimal RecipeLaborCost { get; set; }
        public decimal RecipeOverheadCost { get; set; }
        /// <summary>Recipe part of the product (= ingredients + labor + overhead columns above).</summary>
        public decimal RecipeCost { get; set; }

        // עלויות ספציפיות למוצר
        public decimal PackagingCost { get; set; }
        public decimal PackagingLaborCost { get; set; }
        public decimal PackagingOverheadCost { get; set; }

        // פרטים נוספים
        public int UnitConversionRate { get; set; }

        // סה"כ
        public decimal TotalCost { get; set; }

        public IReadOnlyList<CostWarning> Warnings { get; set; } = Array.Empty<CostWarning>();
    }
}
