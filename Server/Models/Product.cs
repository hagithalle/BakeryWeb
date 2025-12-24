namespace Server.Models
{
    public class Product
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        // על איזה מתכון המוצר מבוסס
        public int RecipeId { get; set; }
        public Recipe Recipe { get; set; } = null!;

        // בעתיד נוסיף: PackagingId, WorkHoursPerUnit וכו'
    }
}
