namespace Server.Models
{    public class Ingredient : InventoryItem
    {
        public decimal PricePerKg { get; set; }
        public int StockQuantity { get; set; }
        public required string Unit { get; set; } // e.g., "kg", "pieces", "liters"
        public IngredientCategory Category { get; set; }
    }
}
