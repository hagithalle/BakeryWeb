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
            var s = _context.LaborSettings.Single(x => x.Id == 1);

            var monthlyTotal =
                s.DesiredMonthlySalary *
                (1 + s.PensionPercent + s.KerenHishtalmutPercent + s.OtherEmployerCostsPercent);

            var monthlyHours = s.WorkingDaysPerMonth * s.WorkingHoursPerDay;

            return monthlyHours == 0 ? 0 : monthlyTotal / monthlyHours;
        }
    }
}