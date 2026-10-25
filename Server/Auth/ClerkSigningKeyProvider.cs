using Microsoft.IdentityModel.Tokens;

namespace Server.Auth
{
    public interface IClerkSigningKeyProvider
    {
        /// <summary>
        /// Returns Clerk's public signing keys. <paramref name="forceRefresh"/> re-downloads the key set
        /// (used when a token's key id is unknown, e.g. after Clerk rotates keys).
        /// </summary>
        Task<IReadOnlyList<SecurityKey>> GetSigningKeysAsync(bool forceRefresh, CancellationToken cancellationToken);
    }

    /// <summary>
    /// Downloads and caches Clerk's JWKS (public keys only). Registered as a singleton so the cache is shared.
    /// </summary>
    public sealed class ClerkJwksKeyProvider : IClerkSigningKeyProvider
    {
        public const string HttpClientName = "ClerkJwks";

        private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);
        // Forced refreshes are rate-limited so invalid tokens can't make us hammer Clerk.
        private static readonly TimeSpan MinimumForcedRefreshInterval = TimeSpan.FromMinutes(5);

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ClerkSettings _settings;
        private readonly TimeProvider _time;
        private readonly SemaphoreSlim _refreshLock = new(1, 1);

        private IReadOnlyList<SecurityKey> _keys = Array.Empty<SecurityKey>();
        private DateTimeOffset _fetchedAt = DateTimeOffset.MinValue;

        public ClerkJwksKeyProvider(IHttpClientFactory httpClientFactory, ClerkSettings settings, TimeProvider time)
        {
            _httpClientFactory = httpClientFactory;
            _settings = settings;
            _time = time;
        }

        public async Task<IReadOnlyList<SecurityKey>> GetSigningKeysAsync(bool forceRefresh, CancellationToken cancellationToken)
        {
            if (!NeedsRefresh(forceRefresh))
                return _keys;

            await _refreshLock.WaitAsync(cancellationToken);
            try
            {
                // Another request may have refreshed while we waited.
                if (!NeedsRefresh(forceRefresh))
                    return _keys;

                var client = _httpClientFactory.CreateClient(HttpClientName);
                var json = await client.GetStringAsync(_settings.JwksUri, cancellationToken);

                _keys = new JsonWebKeySet(json).GetSigningKeys().ToList();
                _fetchedAt = _time.GetUtcNow();
                return _keys;
            }
            finally
            {
                _refreshLock.Release();
            }
        }

        private bool NeedsRefresh(bool forceRefresh)
        {
            var age = _time.GetUtcNow() - _fetchedAt;
            return _keys.Count == 0
                || age > CacheDuration
                || (forceRefresh && age > MinimumForcedRefreshInterval);
        }
    }
}
