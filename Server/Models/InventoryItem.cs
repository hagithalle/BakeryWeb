namespace Server.Models
{
    public abstract class InventoryItem : IOwnedEntity, IPurchasePriced
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Cost { get; set; }
        public int? UserId { get; set; }

        // מע"מ במחיר הקנייה (ריק = לא נבדק עדיין; המחיר נלקח כפי שהוזן)
        public PurchaseVatTreatment? PurchaseVatTreatment { get; set; }
        public bool? InputVatDeductible { get; set; }
    }
}
