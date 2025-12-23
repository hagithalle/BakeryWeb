using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services
{
    public class LaborSettingsService : ILaborSettingsService
    {
        private readonly BakeryDbContext _context;

        public LaborSettingsService(BakeryDbContext context)
        {
            _context = context;
        }

        public async Task<LaborSettings?> GetAsync()
        {
            return await _context.LaborSettings.SingleOrDefaultAsync(x => x.Id == 1);
        }

        public async Task<LaborSettings> UpsertAsync(LaborSettings settings)
        {
            var existing = await _context.LaborSettings.SingleOrDefaultAsync(x => x.Id == 1);

            if (existing == null)
            {
                settings.Id = 1;
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
