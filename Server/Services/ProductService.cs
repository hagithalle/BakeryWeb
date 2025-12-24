using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Server.Services
{
    public class ProductService : IProductService
    {
        private readonly BakeryDbContext _db;

        public ProductService(BakeryDbContext db)
        {
            _db = db;
        }

        public async Task<Product> CreateAsync(Product product)
        {
            _db.Products.Add(product);
            await _db.SaveChangesAsync();
            return product;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _db.Products.FindAsync(id);
            if (existing == null) return false;
            _db.Products.Remove(existing);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Product>> GetAllAsync()
        {
            return await _db.Products
                .Include(p => p.Recipe)
                .ToListAsync();
        }

        public async Task<Product?> GetByIdAsync(int id)
        {
            return await _db.Products
                .Include(p => p.Recipe)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<bool> UpdateAsync(int id, Product product)
        {
            var existing = await _db.Products.FindAsync(id);
            if (existing == null) return false;

            existing.Name = product.Name;
            existing.RecipeId = product.RecipeId;

            await _db.SaveChangesAsync();
            return true;
        }
    }
}
