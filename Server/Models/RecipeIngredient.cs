namespace Server.Models
{
    public class RecipeIngredient
    {
        public int Id { get; set; }

        public int RecipeId { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public Recipe? Recipe { get; set; }

        public int IngredientId { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public Ingredient? Ingredient { get; set; }

        // הכמות במתכון ביחידות של הקמח/סוכר וכו' (למשל ק"ג או יחידות בהתאם ל-Ingredient.Unit)
        public decimal Quantity { get; set; }
    }
}
