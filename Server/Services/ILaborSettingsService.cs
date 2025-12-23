using System.Threading.Tasks;
using Server.Models;

namespace Server.Services
{
    public interface ILaborSettingsService
    {
        Task<LaborSettings?> GetAsync();
        Task<LaborSettings> UpsertAsync(LaborSettings settings);
    }
}