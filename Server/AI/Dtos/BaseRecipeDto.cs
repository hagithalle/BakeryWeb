namespace BakeryWeb.Server.AI.Dtos
{
    public class BaseRecipeDto
    {
        public string Name { get; set; } = string.Empty;
        public double Amount { get; set; } = 0;
        public string Unit { get; set; } = string.Empty;
    }
}