using System;
using System.Linq;
using Server.Data;
using Server.Models;

namespace Server.Services
{
    public class CostCalculatorService
    {
        private readonly BakeryDbContext _context;

        public CostCalculatorService(BakeryDbContext context)
        {
            _context = context;
        }

        public decimal GetHourlyLaborCost()
        {
            var s = _context.LaborSettings.SingleOrDefault(x => x.Id == 1);
            
            // אם אין הגדרות עבודה, החזר 0
            if (s == null)
                return 0;

            var monthlyTotal =
                s.DesiredMonthlySalary *
                (1 + s.PensionPercent + s.KerenHishtalmutPercent + s.OtherEmployerCostsPercent);

            var monthlyHours = s.WorkingDaysPerMonth * s.WorkingHoursPerDay;

            return monthlyHours == 0 ? 0 : monthlyTotal / monthlyHours;
        }

        // המרת כל יחידה לקילו (או ליטר עבור נוזלים)
        private decimal ConvertToKilogram(decimal quantity, UnitOfMeasure unit)
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

        // חישוב עלות של רכיב אחד במתכון
        public decimal CalculateIngredientCost(RecipeIngredient recipeIngredient)
        {
            if (recipeIngredient?.Ingredient == null)
                return 0;

            var ingredient = recipeIngredient.Ingredient;
            var quantity = recipeIngredient.Quantity;
            var unit = (UnitOfMeasure)recipeIngredient.Unit; // המרה מ-int ל-enum

            // המרה לקילו
            var quantityInKg = ConvertToKilogram(quantity, unit);

            // חישוב העלות: מחיר לק"ג * כמות בק"ג
            return ingredient.PricePerKg * quantityInKg;
        }

        // חישוב עלויות כוללות של מתכון (ללא אריזה)
        public RecipeCostBreakdown CalculateRecipeCost(Recipe recipe)
        {
            if (recipe == null)
                return new RecipeCostBreakdown();

            // עלות חומרים
            var ingredientCosts = recipe.Ingredients?
                .Sum(ri => CalculateIngredientCost(ri)) ?? 0;

            // עלות עבודה (הכנה + אפייה בלבד)
            var totalTime = (recipe.PrepTime ?? 0) + (recipe.BakeTime ?? 0);
            var hourlyLabor = GetHourlyLaborCost();
            var laborCost = (totalTime / 60m) * hourlyLabor;

            // עלויות תקורה ליחידה
            var overheadCost = _context.OverheadItems?
                .Where(x => x.IsActive)
                .Sum(x => x.MonthlyCost / 30m) ?? 0;  // חלוקה ל-30 ימים

            // סה"כ עלויות (ללא אריזה - תתווסף במוצר)
            var totalCost = ingredientCosts + laborCost + overheadCost;

            // עלות ליחידה
            var outputUnits = recipe.OutputUnits > 0 ? recipe.OutputUnits : 1;
            var costPerUnit = totalCost / outputUnits;

            return new RecipeCostBreakdown
            {
                IngredientsCost = ingredientCosts,
                LaborCost = laborCost,
                OverheadCost = overheadCost,
                PackagingCost = 0, // אריזה מטופלת ברמת המוצר
                TotalCost = totalCost,
                CostPerUnit = costPerUnit,
                OutputUnits = outputUnits
            };
        }

        // חישוב עלויות מוצר סופי (כולל אריזה וזמן אריזה)
        public ProductCostBreakdown CalculateProductCost(Product product)
        {
            if (product == null || product.Recipe == null)
                return new ProductCostBreakdown();

            // חישוב עלות המתכון ליחידה
            var recipeCost = CalculateRecipeCost(product.Recipe);
            var recipeUnitsQuantity = product.RecipeUnitsQuantity > 0 ? product.RecipeUnitsQuantity : 1;

            // עלות הבסיס מהמתכון (כמות יחידות × עלות ליחידה)
            var recipeTotalCost = recipeCost.CostPerUnit * recipeUnitsQuantity;

            // עלות אריזה ספציפית
            var packagingCost = product.Packaging?.Cost ?? 0;

            // עלות עבודת אריזה
            var packagingTime = product.PackagingTimeMinutes ?? 0;
            var hourlyLabor = GetHourlyLaborCost();
            var packagingLaborCost = (packagingTime / 60m) * hourlyLabor;

            // סה"כ עלות המוצר
            var totalCost = recipeTotalCost + packagingCost + packagingLaborCost;

            return new ProductCostBreakdown
            {
                // פירוט עלות המתכון
                RecipeIngredientsCost = recipeCost.IngredientsCost * recipeUnitsQuantity / recipeCost.OutputUnits,
                RecipeLaborCost = recipeCost.LaborCost * recipeUnitsQuantity / recipeCost.OutputUnits,
                RecipeOverheadCost = recipeCost.OverheadCost * recipeUnitsQuantity / recipeCost.OutputUnits,
                
                // עלויות נוספות למוצר
                PackagingCost = packagingCost,
                PackagingLaborCost = packagingLaborCost,
                
                // סיכום
                RecipeUnitsQuantity = recipeUnitsQuantity,
                TotalCost = totalCost
            };
        }
    }

    // מודל לתוצאות חישוב מתכון
    public class RecipeCostBreakdown
    {
        public decimal IngredientsCost { get; set; }
        public decimal LaborCost { get; set; }
        public decimal OverheadCost { get; set; }
        public decimal PackagingCost { get; set; }
        public decimal TotalCost { get; set; }
        public decimal CostPerUnit { get; set; }
        public int OutputUnits { get; set; }
    }

    // מודל לתוצאות חישוב מוצר סופי
    public class ProductCostBreakdown
    {
        // עלויות מהמתכון
        public decimal RecipeIngredientsCost { get; set; }
        public decimal RecipeLaborCost { get; set; }
        public decimal RecipeOverheadCost { get; set; }
        
        // עלויות ספציפיות למוצר
        public decimal PackagingCost { get; set; }
        public decimal PackagingLaborCost { get; set; }
        
        // פרטים נוספים
        public int RecipeUnitsQuantity { get; set; }
        
        // סה"כ
        public decimal TotalCost { get; set; }
    }
}