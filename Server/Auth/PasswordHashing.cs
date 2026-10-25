namespace Server.Auth
{
    /// <summary>
    /// BCrypt helpers that never throw on accounts without a usable password hash
    /// (e.g. users created through Google/Clerk sign-in have an empty hash).
    /// </summary>
    public static class PasswordHashing
    {
        public static string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password);

        public static bool HasPassword(string? passwordHash) => !string.IsNullOrWhiteSpace(passwordHash);

        public static bool Verify(string password, string? passwordHash)
        {
            if (string.IsNullOrEmpty(password) || !HasPassword(passwordHash))
                return false;

            try
            {
                return BCrypt.Net.BCrypt.Verify(password, passwordHash);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                // Malformed hash in the database - treat as a failed login, not a server error.
                return false;
            }
        }
    }
}
