using System.Collections.Generic;
using Server.Models;

namespace Server.Services.Costing
{
    /// <summary>
    /// The unit rules used for recipe costing and for checking recipe lines when they are saved.
    ///
    /// Only EXACT conversions are used for cost:
    ///   mass   g, kg                         (1 kg = 1000 g)
    ///   volume ml, L, teaspoon, tablespoon   (metric spoons by definition: 5 ml and 15 ml)
    ///   count  unit, dozen                   (1 dozen = 12 units)
    ///   package                              (only against a price per package)
    /// Everything else needs ingredient-specific information this version does not store yet (planned "R5"):
    ///   - weight <-> volume (density), including "a tablespoon of flour" against a price per kg;
    ///   - pieces <-> weight/volume (e.g. grams per egg);
    ///   - package <-> anything else (package size);
    ///   - cups (240, 250 or 236.6 ml depending on the standard, so never assumed).
    /// Such lines are reported as blocking cost warnings instead of being priced with a guessed factor.
    /// </summary>
    public static class RecipeUnits
    {
        public enum Kind { Unknown, Mass, Volume, Count, Package, Cup }

        public static Kind KindOf(UnitOfMeasure unit) => unit switch
        {
            UnitOfMeasure.Kilogram or UnitOfMeasure.Gram => Kind.Mass,
            UnitOfMeasure.Liter or UnitOfMeasure.Milliliter or UnitOfMeasure.Teaspoon or UnitOfMeasure.Tablespoon => Kind.Volume,
            UnitOfMeasure.Unit or UnitOfMeasure.Dozen => Kind.Count,
            UnitOfMeasure.Package => Kind.Package,
            UnitOfMeasure.Cup => Kind.Cup,
            _ => Kind.Unknown,
        };

        public enum Conversion
        {
            Exact,
            UnknownLineUnit,
            UnknownPriceUnit,
            CupSizeUndefined,       // a cup is not a defined volume here
            PackageSizeUndefined,   // package vs. units/weight/volume
            CountVersusMeasure,     // pieces vs. weight/volume (needs weight per piece)
            WeightVersusVolume,     // needs the ingredient's density (incl. spoons of a weighed ingredient)
        }

        /// <summary>Can a line in <paramref name="lineUnit"/> be priced exactly against a price per <paramref name="priceUnit"/>?</summary>
        public static Conversion Check(int lineUnit, UnitOfMeasure priceUnit)
        {
            if (!System.Enum.IsDefined(typeof(UnitOfMeasure), lineUnit)) return Conversion.UnknownLineUnit;
            if (!System.Enum.IsDefined(priceUnit)) return Conversion.UnknownPriceUnit;
            var line = KindOf((UnitOfMeasure)lineUnit);
            var price = KindOf(priceUnit);
            if (line == Kind.Cup || price == Kind.Cup) return Conversion.CupSizeUndefined;
            if (line == price) return Conversion.Exact;
            if (line == Kind.Package || price == Kind.Package) return Conversion.PackageSizeUndefined;
            if (line == Kind.Count || price == Kind.Count) return Conversion.CountVersusMeasure;
            return Conversion.WeightVersusVolume;
        }

        /// <summary>
        /// A quantity this large in a single recipe line is almost always a unit mistake (e.g. 500 L meant as 500 ml,
        /// 200 kg meant as 200 g). It is never corrected automatically: saving needs an explicit confirmation and the
        /// cost stays blocked for review.
        /// </summary>
        public static readonly IReadOnlyDictionary<UnitOfMeasure, decimal> SuspiciousFrom = new Dictionary<UnitOfMeasure, decimal>
        {
            [UnitOfMeasure.Kilogram] = 20m,
            [UnitOfMeasure.Liter] = 20m,
            [UnitOfMeasure.Gram] = 20_000m,
            [UnitOfMeasure.Milliliter] = 20_000m,
            [UnitOfMeasure.Unit] = 500m,
            [UnitOfMeasure.Dozen] = 50m,
            [UnitOfMeasure.Package] = 100m,
            [UnitOfMeasure.Teaspoon] = 100m,
            [UnitOfMeasure.Tablespoon] = 100m,
            [UnitOfMeasure.Cup] = 50m,
        };

        public static bool IsSuspicious(decimal quantity, int unit) =>
            System.Enum.IsDefined(typeof(UnitOfMeasure), unit)
            && SuspiciousFrom.TryGetValue((UnitOfMeasure)unit, out var limit)
            && quantity >= limit;

        public static string HebrewName(int unit) => unit switch
        {
            1 => "ק\"ג", 2 => "גרם", 3 => "ליטר", 4 => "מ\"ל", 5 => "יחידות", 6 => "תריסר",
            7 => "חבילות", 8 => "כפיות", 9 => "כפות", 10 => "כוסות", _ => $"יחידה {unit}",
        };
    }
}
