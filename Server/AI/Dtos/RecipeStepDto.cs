namespace BakeryWeb.Server.AI.Dtos
{
    public class RecipeStepDto
    {
        public int Order { get; set; }                    // 1, 2, 3...
        public required string Description { get; set; } = string.Empty;
    }
}