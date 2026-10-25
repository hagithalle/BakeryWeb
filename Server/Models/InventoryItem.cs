namespace Server.Models
{
    public abstract class InventoryItem : IOwnedEntity
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Cost { get; set; }
        public int? UserId { get; set; }
    }
}
