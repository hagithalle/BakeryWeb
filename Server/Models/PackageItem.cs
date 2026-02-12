using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    public class PackageItem
    {
        public int Id { get; set; }

        public int ProductId { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public Product? Product { get; set; }

        // המוצר/מתכון שנמצא בתוך המארז
        public int ItemProductId { get; set; }
        public Product? ItemProduct { get; set; }

        // כמות של המוצר/מתכון במארז
        public int Quantity { get; set; }

        // עלות מחושבת (לא נשמר בDB)
        [NotMapped]
        public decimal Cost { get; set; }
    }
}
