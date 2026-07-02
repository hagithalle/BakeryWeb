using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services
{
    public class LaborSettingsService : ILaborSettingsService
    {
        private readonly BakeryDbContext _context;
        private readonly IHttpContextAccessor _http;

        public LaborSettingsService(BakeryDbContext context, IHttpContextAccessor http)
        {
            _context = context;
            _http = http;
        }

        private int? UserId =>
            int.TryParse(_http.HttpContext?.User.FindFirst("userId")?.Value, out var id) ? id : null;

        public async Task<LaborSettings?> GetAsync()
        {
            var uid = UserId;
            return await _context.LaborSettings
                .FirstOrDefaultAsync(x => x.UserId == uid || (uid == null && x.UserId == null));
        }

        public async Task<LaborSettings> UpsertAsync(LaborSettings settings)
        {
            var uid = UserId;
            var existing = await _context.LaborSettings
                .FirstOrDefaultAsync(x => x.UserId == uid || (uid == null && x.UserId == null));

            if (existing == null)
            {
                settings.UserId = uid;
                _context.LaborSettings.Add(settings);
            }
            else
            {
                existing.DesiredMonthlySalary = settings.DesiredMonthlySalary;
                existing.PensionPercent = settings.PensionPercent;
                existing.KerenHishtalmutPercent = settings.KerenHishtalmutPercent;
                existing.OtherEmployerCostsPercent = settings.OtherEmployerCostsPercent;
                existing.WorkingDaysPerMonth = settings.WorkingDaysPerMonth;
                existing.WorkingHoursPerDay = settings.WorkingHoursPerDay;
            }

            await _context.SaveChangesAsync();
            return existing ?? settings;
        }
    }
}
