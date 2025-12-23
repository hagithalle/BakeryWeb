using Server.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Server.Services
{
    public interface IRecipeService
    {
        Task<IEnumerable<Recipe>> GetAllAsync();
        Task<Recipe?> GetByIdAsync(int id);
        Task<Recipe> CreateAsync(Recipe recipe);
        Task<bool> UpdateAsync(int id, Recipe recipe);
        Task<bool> DeleteAsync(int id);
    }
}
