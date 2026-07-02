using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services
{
    public class OverheadItemService : IOverheadItemService
    {
        private readonly BakeryDbContext _context;
        private readonly IHttpContextAccessor _http;

        public OverheadItemService(BakeryDbContext context, IHttpContextAccessor http)
        {
            _context = context;
            _http = http;
        }

        private int? UserId =>
            int.TryParse(_http.HttpContext?.User.FindFirst("userId")?.Value, out var id) ? id : null;

        public async Task<List<OverheadItem>> GetAllAsync()
        {
            var uid = UserId;
            return await _context.OverheadItems
                .Where(x => x.UserId == null || x.UserId == uid)
                .OrderBy(x => x.Name)
                .ToListAsync();
        }

        public async Task<OverheadItem?> GetByIdAsync(int id)
        {
            var uid = UserId;
            return await _context.OverheadItems
                .FirstOrDefaultAsync(x => x.Id == id && (x.UserId == null || x.UserId == uid));
        }

        public async Task<OverheadItem> CreateAsync(OverheadItem item)
        {
            item.UserId = UserId;
            _context.OverheadItems.Add(item);
            await _context.SaveChangesAsync();
            return item;
        }

        public async Task<bool> UpdateAsync(int id, OverheadItem item)
        {
            var uid = UserId;
            var existing = await _context.OverheadItems
                .FirstOrDefaultAsync(x => x.Id == id && (x.UserId == null || x.UserId == uid));
            if (existing == null) return false;

            existing.Name = item.Name;
            existing.MonthlyCost = item.MonthlyCost;
            existing.IsActive = item.IsActive;
            existing.Type = item.Type;
            existing.Category = item.Category;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var uid = UserId;
            var existing = await _context.OverheadItems
                .FirstOrDefaultAsync(x => x.Id == id && (x.UserId == null || x.UserId == uid));
            if (existing == null) return false;

            _context.OverheadItems.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
