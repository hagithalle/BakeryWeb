using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services
{
    public class PackagingService : IPackagingService
    {
        private readonly BakeryDbContext _context;
        private readonly IHttpContextAccessor _http;

        public PackagingService(BakeryDbContext context, IHttpContextAccessor http)
        {
            _context = context;
            _http = http;
        }

        private int? UserId =>
            int.TryParse(_http.HttpContext?.User.FindFirst("userId")?.Value, out var id) ? id : null;

        public async Task<List<Packaging>> GetAllAsync()
        {
            var uid = UserId;
            return await _context.Packagings
                .Where(p => p.UserId == null || p.UserId == uid)
                .OrderBy(p => p.Id)
                .ToListAsync();
        }

        public async Task<Packaging?> GetByIdAsync(int id)
        {
            var uid = UserId;
            return await _context.Packagings
                .FirstOrDefaultAsync(p => p.Id == id && (p.UserId == null || p.UserId == uid));
        }

        public async Task<Packaging> CreateAsync(Packaging packaging)
        {
            packaging.UserId = UserId;
            _context.Packagings.Add(packaging);
            await _context.SaveChangesAsync();
            return packaging;
        }

        public async Task<bool> UpdateAsync(int id, Packaging packaging)
        {
            var uid = UserId;
            var existing = await _context.Packagings
                .FirstOrDefaultAsync(p => p.Id == id && (p.UserId == null || p.UserId == uid));
            if (existing == null) return false;

            existing.StockUnits = packaging.StockUnits;
            existing.Name = packaging.Name;
            existing.Cost = packaging.Cost;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var uid = UserId;
            var existing = await _context.Packagings
                .FirstOrDefaultAsync(p => p.Id == id && (p.UserId == null || p.UserId == uid));
            if (existing == null) return false;

            _context.Packagings.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
