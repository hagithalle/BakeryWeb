using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services
{
    /// <summary>
    /// Service that provides CRUD operations for `Packaging` entities.
    /// </summary>
    public class PackagingService : IPackagingService
    {
        private readonly BakeryDbContext _context;
        public PackagingService(BakeryDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Returns all packaging records ordered by Id.
        /// </summary>
        public async Task<List<Packaging>> GetAllAsync()
        {
            return await _context.Packagings
                .OrderBy(p => p.Id)
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves a packaging entry by id, or null if not found.
        /// </summary>
        public async Task<Packaging?> GetByIdAsync(int id)
        {
            return await _context.Packagings.FindAsync(id);
        }

        /// <summary>
        /// Creates a new packaging record and persists it.
        /// </summary>
        public async Task<Packaging> CreateAsync(Packaging packaging)
        {
            _context.Packagings.Add(packaging);
            await _context.SaveChangesAsync();
            return packaging;
        }

        /// <summary>
        /// Updates an existing packaging record. Returns true if update succeeded.
        /// </summary>
        public async Task<bool> UpdateAsync(int id, Packaging packaging)
        {
            var existing = await _context.Packagings.FindAsync(id);
            if (existing == null) return false;

            existing.StockUnits = packaging.StockUnits;
            existing.Name = packaging.Name;
            existing.Cost = packaging.Cost;

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Deletes a packaging record by id. Returns true if deletion succeeded.
        /// </summary>
        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _context.Packagings.FindAsync(id);
            if (existing == null) return false;

            _context.Packagings.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
