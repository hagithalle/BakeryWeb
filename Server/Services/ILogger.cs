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
        public LogType Type { get; set; }
        public string Source { get; set; }
        public string Function { get; set; }
        public string Message { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public interface ILogger
    {
        void Log(LogEntry entry);
    }
}
