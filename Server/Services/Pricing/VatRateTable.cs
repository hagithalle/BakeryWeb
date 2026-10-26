using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Microsoft.Extensions.Configuration;

namespace Server.Services.Pricing
{
    /// <summary>
    /// Israeli VAT rates by the date they took effect, from configuration ("Vat:Rates"), e.g.
    /// [{ "EffectiveFrom": "2015-10-01", "Rate": 0.17 }, { "EffectiveFrom": "2025-01-01", "Rate": 0.18 }].
    /// A new rate is a configuration change, never a code change.
    /// </summary>
    public sealed class VatRateTable
    {
        public const string ConfigSection = "Vat:Rates";

        public sealed record Entry(DateOnly EffectiveFrom, decimal Rate);

        public IReadOnlyList<Entry> Entries { get; }

        public VatRateTable(IEnumerable<Entry> entries)
        {
            var list = entries.OrderBy(e => e.EffectiveFrom).ToList();
            if (list.Count == 0)
                throw new InvalidOperationException($"No VAT rates are configured ({ConfigSection}).");
            if (list.Any(e => e.Rate < 0 || e.Rate >= 1))
                throw new InvalidOperationException($"Every VAT rate in {ConfigSection} must be a fraction between 0 and 1 (e.g. 0.18).");
            if (list.Select(e => e.EffectiveFrom).Distinct().Count() != list.Count)
                throw new InvalidOperationException($"{ConfigSection} contains two rates for the same date.");
            Entries = list;
        }

        /// <summary>The rate in force on <paramref name="date"/>, or null before the first configured date.</summary>
        public Entry? RateOn(DateOnly date) => Entries.LastOrDefault(e => e.EffectiveFrom <= date);

        public static VatRateTable FromConfiguration(IConfiguration configuration)
        {
            var entries = configuration.GetSection(ConfigSection).GetChildren().Select(child =>
            {
                var from = child["EffectiveFrom"];
                var rate = child["Rate"];
                if (!DateOnly.TryParseExact(from, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)
                    || !decimal.TryParse(rate, NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
                    throw new InvalidOperationException(
                        $"Invalid entry in {ConfigSection}: EffectiveFrom must be yyyy-MM-dd and Rate a number (e.g. 0.18).");
                return new Entry(date, value);
            });
            return new VatRateTable(entries);
        }

        /// <summary>Today's date in Israel (prices are quoted for today).</summary>
        public static DateOnly TodayInIsrael(TimeProvider time)
        {
            TimeZoneInfo zone;
            try { zone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Jerusalem"); }
            catch (TimeZoneNotFoundException) { zone = TimeZoneInfo.FindSystemTimeZoneById("Israel Standard Time"); }
            return DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(time.GetUtcNow(), zone).DateTime);
        }
    }
}
