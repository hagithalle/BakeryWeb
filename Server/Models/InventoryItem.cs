namespace Server.Models
{
    public abstract class InventoryItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Cost { get; set; }
    }
}
