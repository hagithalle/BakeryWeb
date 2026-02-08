namespace Server.Models
{    public class Ingredient : InventoryItem
    {
        public decimal PricePerKg { get; set; }
        public int StockQuantity { get; set; }
        public UnitOfMeasure Unit { get; set; }
        public UnitOfMeasure StockUnit { get; set; }
        public IngredientCategory Category { get; set; }
    }
}
