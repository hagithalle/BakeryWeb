using System;
using System.Collections.Generic;
using System.IO;
using BakeryWeb.Server.Services;

namespace BakeryWeb.Server.Services
{
    public class ConsoleLogger : ILogger
    {
        public void Log(LogEntry entry)
        {
            Console.WriteLine($"[{entry.Timestamp:yyyy-MM-dd HH:mm:ss}] [{entry.Type}] [{entry.Source}.{entry.Function}] {entry.Message}");
        }
    }

    public class FileLogger : ILogger
    {
        private readonly string _filePath;
        public FileLogger(string filePath)
        {
            _filePath = filePath;
        }
        public void Log(LogEntry entry)
        {
            var logLine = $"[{entry.Timestamp:yyyy-MM-dd HH:mm:ss}] [{entry.Type}] [{entry.Source}.{entry.Function}] {entry.Message}";
            File.AppendAllText(_filePath, logLine + Environment.NewLine);
        }
    }

    public class LogManager
    {
        private readonly List<LogEntry> _logs = new List<LogEntry>();
        private readonly List<ILogger> _loggers = new List<ILogger>();

        public LogManager(Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            var logOutputs = configuration.GetSection("Logging:LogOutputs").Get<string[]>() ?? new[] { "Console" };
            foreach (var output in logOutputs)
            {
                switch (output.ToLower())
                {
                    case "console":
                        _loggers.Add(new ConsoleLogger());
                        break;
                    case "file":
                        var logFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app.log");
                        _loggers.Add(new FileLogger(logFilePath));
                        break;
                    // ניתן להוסיף כאן סוגי לוגרים נוספים בקלות
                }
            }
        }

        public void AddLogger(ILogger logger)
        {
            _loggers.Add(logger);
        }

        public void Log(LogType type, string source, string function, string message)
        {
            var entry = new LogEntry
            {
                Type = type,
                Source = source,
                Function = function,
                Message = message,
                Timestamp = DateTime.Now
            };
            _logs.Add(entry);
            foreach (var logger in _loggers)
            {
                logger.Log(entry);
            }
        }

        public void LogError(string source, string function, string message)
        {
            Log(LogType.Error, source, function, message);
        }

        public void LogSuccess(string source, string function, string message)
        {
            Log(LogType.Info, source, function, message);
        }

        public void LogWarning(string source, string function, string message)
        {
            Log(LogType.Warning, source, function, message);
        }

        public void LogDebug(string source, string function, string message)
        {
            Log(LogType.Debug, source, function, message);
        }

        public IReadOnlyList<LogEntry> GetLogs()
        {
            return _logs.AsReadOnly();
        }
    }
}
