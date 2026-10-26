using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services.Pricing
{
    /// <summary>
    /// The current user's business settings (the query filter limits BusinessSettings to their own row).
    /// A user without a row has no VAT status yet and the default markup of 15%.
    /// </summary>
    public sealed class BusinessSettingsService
    {
        public const decimal DefaultMarkup = 0.15m;
        public const decimal MaxMarkup = 10m; // 1000%

        private readonly BakeryDbContext _db;
        private BusinessSettings? _own;
        private bool _loaded;

        public BusinessSettingsService(BakeryDbContext db)
        {
            _db = db;
            _db.SavedChanges += (_, _) => _loaded = false;
        }

        /// <summary>The user's row, or null when they never saved settings (read once per request).</summary>
        public BusinessSettings? Current
        {
            get
            {
                if (!_loaded)
                {
                    _own = _db.BusinessSettings.AsNoTracking().FirstOrDefault();
                    _loaded = true;
                }
                return _own;
            }
        }

        public VatStatus? VatStatus => Current?.VatStatus;
        public decimal EffectiveDefaultMarkup => Current?.DefaultMarkupPercent ?? DefaultMarkup;

        public async Task<BusinessSettings> SaveAsync(VatStatus vatStatus, decimal defaultMarkup)
        {
            if (!Enum.IsDefined(vatStatus))
                throw new PricingValidationException("סטטוס מע\"מ לא תקין");
            if (defaultMarkup < 0 || defaultMarkup > MaxMarkup)
                throw new PricingValidationException("אחוז התוספת על העלות חייב להיות בין 0% ל-1000%");

            var row = await _db.BusinessSettings.FirstOrDefaultAsync();
            if (row == null)
            {
                row = new BusinessSettings();   // the owner is stamped by BakeryDbContext
                _db.BusinessSettings.Add(row);
            }
            row.VatStatus = vatStatus;
            row.DefaultMarkupPercent = defaultMarkup;
            await _db.SaveChangesAsync();
            return row;
        }
    }

    /// <summary>A pricing value sent by the client is invalid (reported as 400 with this message).</summary>
    public sealed class PricingValidationException : Exception
    {
        public PricingValidationException(string message) : base(message) { }
    }
}
