using System.Collections.Generic;
using System.Threading.Tasks;
using Server.Models;

namespace Server.Services
{
    public interface IPackagingService
    {
        Task<List<Packaging>> GetAllAsync();
        Task<Packaging?> GetByIdAsync(int id);
        Task<Packaging> CreateAsync(Packaging packaging);
        Task<bool> UpdateAsync(int id, Packaging packaging);
        Task<bool> DeleteAsync(int id);
    }
}
