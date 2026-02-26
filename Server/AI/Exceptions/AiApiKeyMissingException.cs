using System;

namespace BakeryWeb.Server.AI.Exceptions
{
    public class AiApiKeyMissingException : Exception
    {
        public AiApiKeyMissingException()
            : base("AI API key is missing from configuration.")
        {
        }

        public AiApiKeyMissingException(string message)
            : base(message)
        {
        }
    }
}
