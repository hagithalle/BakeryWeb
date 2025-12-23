using System.Threading.Tasks;
using Server.Models;

namespace Server.Services
{
    public interface IOverheadItemService{
        Task<List<OverheadItem>> GetAllAsync();
        Task<OverheadItem?> GetByIdAsync(int id);
        Task<OverheadItem> CreateAsync(OverheadItem item);
        Task<bool> UpdateAsync(int id, OverheadItem item);
        Task<bool> DeleteAsync(int id);
    }
}
