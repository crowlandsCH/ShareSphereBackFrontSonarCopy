
// File: Services/IAuthService.cs
namespace ShareSphere.Api.Services
{
    public sealed class RegisterResult
    {
        public bool Succeeded { get; init; }
        public string? Token { get; init; }
        public string[] Errors { get; init; } = Array.Empty<string>();
    }

    public interface IAuthService
    {
        Task<RegisterResult> RegisterAsync(string userName, string displayName, string password, string email, string[] roles);
        Task<string?> LoginAsync(string userName, string password);
    }
}
