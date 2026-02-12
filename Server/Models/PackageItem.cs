using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    public class PackageItem
    {
        public int Id { get; set; }

        public int ProductId { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public Product? Product { get; set; }

        // המתכון שנמצא בתוך המארז
        public int RecipeId { get; set; }
        public Recipe? Recipe { get; set; }

        // כמות של המוצר/מתכון במארז
        public int Quantity { get; set; }

        // עלות מחושבת (לא נשמר בDB)
        [NotMapped]
        public decimal Cost { get; set; }
    }
}
