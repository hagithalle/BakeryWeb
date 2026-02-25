using System.IO;
using System.Reflection;

namespace BakeryWeb.Server.AI.Client
{
    public static class EnvLoader
    {
        public static void LoadEnv(string? envPath = null)
        {
            envPath ??= Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)!, ".env");
            if (!File.Exists(envPath)) return;
            foreach (var line in File.ReadAllLines(envPath))
            {
                var trimmed = line.Trim();
                if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("#")) continue;
                var idx = trimmed.IndexOf('=');
                if (idx < 1) continue;
                var key = trimmed.Substring(0, idx).Trim();
                var value = trimmed.Substring(idx + 1).Trim();
                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }
}
