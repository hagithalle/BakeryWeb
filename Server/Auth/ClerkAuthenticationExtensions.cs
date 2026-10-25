using Microsoft.AspNetCore.Authentication;

namespace Server.Auth
{
    public static class ClerkAuthenticationExtensions
    {
        /// <summary>
        /// Registers Clerk as the only authentication scheme, plus the services it depends on.
        /// Used by Program.cs and by the integration tests so both run the same wiring.
        /// </summary>
        public static IServiceCollection AddClerkAuthentication(this IServiceCollection services, ClerkSettings settings)
        {
            services.AddSingleton(settings);
            services.AddSingleton(TimeProvider.System);

            services.AddHttpClient(ClerkJwksKeyProvider.HttpClientName, client => client.Timeout = TimeSpan.FromSeconds(10));
            services.AddSingleton<IClerkSigningKeyProvider, ClerkJwksKeyProvider>();
            services.AddSingleton<IClerkTokenValidator, ClerkTokenValidator>();
            services.AddHttpClient<IClerkUserClient, ClerkUserClient>(client =>
            {
                client.BaseAddress = ClerkUserClient.BackendApiBaseAddress;
                client.Timeout = TimeSpan.FromSeconds(10);
            });
            services.AddScoped<IUserProvisioningService, UserProvisioningService>();

            services.AddAuthentication(ClerkAuthenticationHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, ClerkAuthenticationHandler>(ClerkAuthenticationHandler.SchemeName, null);
            services.AddAuthorization();

            return services;
        }
    }
}
