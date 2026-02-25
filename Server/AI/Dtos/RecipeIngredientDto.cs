namespace BakeryWeb.Server.AI.Dtos
{
    public class RecipeIngredientDto
    {
        public string Name { get; set; } = string.Empty;  // שם חומר הגלם, כולל הכמות בטקסט אם צריך
        public decimal Amount { get; set; }               // כמות מספרית (אם יש)
        public string Unit { get; set; } = string.Empty;  // יחידת מידה ("גרם", "כוס", "יח'")
    }
}