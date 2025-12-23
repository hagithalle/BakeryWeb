using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services
{
    /// <summary>
    /// Service for managing overhead items (fixed monthly costs) used by the bakery.
    /// Provides CRUD operations for <see cref="OverheadItem"/> entities.
    /// </summary>
    public class OverheadItemService : IOverheadItemService
    {
        private readonly BakeryDbContext _context;

        public OverheadItemService(BakeryDbContext context)
        {
            _context = context;
        }
    /// <summary>
    /// Returns all overhead items ordered by name.
    /// </summary>
    public async Task<List<OverheadItem>> GetAllAsync()
    {
        return await _context.OverheadItems
                        .OrderBy(x=>x.Name)
                        .ToListAsync();  
    }
    /// <summary>
    /// Retrieves an overhead item by its identifier, or null if not found.
    /// </summary>
    public async Task<OverheadItem?> GetByIdAsync(int id)
    {
        return await _context.OverheadItems.FindAsync(id);
    }
    public async Task<OverheadItem> CreateAsync(OverheadItem item)
    {
        _context.OverheadItems.Add(item);
        await  _context.SaveChangesAsync();
        return item;
    }

    /// <summary>
    /// Updates an existing overhead item. Returns true if update succeeded.
    /// </summary>
    public async Task<bool> UpdateAsync(int id, OverheadItem item)
    {
        var existingItem = await _context.OverheadItems.FindAsync(id);
        if (existingItem == null)
            return false;

        existingItem.Name = item.Name;
        existingItem.MonthlyCost = item.MonthlyCost;
        existingItem.IsActive = item.IsActive;

        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Deletes an overhead item by id. Returns true if deletion succeeded.
    /// </summary>
    public async Task<bool> DeleteAsync(int id)
    {
        var existingItem = await _context.OverheadItems.FindAsync(id);
        if (existingItem == null)
            return false;

        _context.OverheadItems.Remove(existingItem);
        await _context.SaveChangesAsync();
        return true;
    }
}
}
