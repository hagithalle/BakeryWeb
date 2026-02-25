namespace BakeryWeb.Server.AI.Tasks
{
    public class AiTaskDefinition
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Endpoint { get; set; } = string.Empty;
        public Dictionary<string, object>? Parameters { get; set; }
    }
}
