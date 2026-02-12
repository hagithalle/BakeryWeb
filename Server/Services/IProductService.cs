using Server.Models;
using Server.Controllers;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Server.Services
{
    public interface IProductService
    {
        Task<IEnumerable<Product>> GetAllAsync();
        Task<Product?> GetByIdAsync(int id);
        Task<Product> CreateAsync(CreateProductRequest request);
        Task<bool> UpdateAsync(int id, Product product);
        Task<bool> RecalculateSellingPriceAsync(int id);
        Task<bool> DeleteAsync(int id);
    }
}
