namespace BakeryWeb.Server.Services
{
    public enum LogType
    {
        Info,
        Warning,
        Error,
        Debug
    }

    public class LogEntry
    {
        public required LogType Type { get; set; }
        public required string Source { get; set; }
        public required string Function { get; set; }
        public required string Message { get; set; }
        public required DateTime Timestamp { get; set; }
    }

    public interface ILogger
    {
        void Log(LogEntry entry);
    }
}
