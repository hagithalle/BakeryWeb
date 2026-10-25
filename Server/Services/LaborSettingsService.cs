using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services
{
    public class LaborSettingsService : ILaborSettingsService
    {
        private readonly BakeryDbContext _context;
        // Every query below is limited to the current user's rows by BakeryDbContext's query filter,
        // and new rows are stamped with the current user's id when saved.
        public LaborSettingsService(BakeryDbContext context)
        {
            _context = context;
        }

        public async Task<LaborSettings?> GetAsync()
        {
            return await _context.LaborSettings.FirstOrDefaultAsync();
        }

        public async Task<LaborSettings> UpsertAsync(LaborSettings settings)
        {
            var existing = await _context.LaborSettings.FirstOrDefaultAsync();

            if (existing == null)
            {
                settings.Id = 0; // one row per user, created on first save
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
