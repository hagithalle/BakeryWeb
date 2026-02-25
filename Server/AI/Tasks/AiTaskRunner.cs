using BakeryWeb.Server.AI.Client;

namespace BakeryWeb.Server.AI.Tasks
{
    public class AiTaskRunner
    {
        private readonly AiClient _aiClient;

        public AiTaskRunner(AiClient aiClient)
        {
            _aiClient = aiClient;
        }

        public async Task<string> RunTaskAsync(AiTaskDefinition task, string prompt)
        {
            // ניתן להרחיב כאן ל-parsing parameters וכו'
            return await _aiClient.SendPromptAsync(task.Endpoint, prompt);
        }
    }
}
