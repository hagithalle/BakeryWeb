using BakeryWeb.Server.AI.Client;
using BakeryWeb.Server.Services;

namespace BakeryWeb.Server.AI.Tasks
{
    public class AiTaskRunner
    {
        private readonly AiClient _aiClient;
        private readonly LogManager _logManager;

        public AiTaskRunner(AiClient aiClient, LogManager logManager)
        {
            _aiClient = aiClient;
            _logManager = logManager;
        }

        public async Task<string> RunTaskAsync(AiTaskDefinition task, string prompt)
        {
            _logManager.Log(LogType.Info, nameof(AiTaskRunner), nameof(RunTaskAsync), $"Running AI task: {task.Name}");
            var result = await _aiClient.SendPromptAsync(task.Endpoint, prompt);
            _logManager.Log(LogType.Info, nameof(AiTaskRunner), nameof(RunTaskAsync), "AI task completed");
            return result;
        }
    }
}
