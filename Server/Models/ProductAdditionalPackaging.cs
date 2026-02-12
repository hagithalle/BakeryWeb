using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    public class ProductAdditionalPackaging
    {
        public int Id { get; set; }

        public int ProductId { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public Product? Product { get; set; }

        public int PackagingId { get; set; }
        public Packaging? Packaging { get; set; }

        // כמות יחידות אריזה
        public int Quantity { get; set; }

        // עלות מחושבת (לא נשמר בDB)
        [NotMapped]
        public decimal Cost { get; set; }
    }
}
