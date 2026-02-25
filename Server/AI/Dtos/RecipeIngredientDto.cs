public class RecipeIngredientDto
{
    public int IngredientId { get; set; }
    public double Quantity { get; set; }
    public int Unit { get; set; }   // enum של יחידות (גרם, מ"ל, יחידות...)
}