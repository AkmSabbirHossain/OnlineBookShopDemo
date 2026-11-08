using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace OnlineBookShop.Server.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            UserManager<AppUser> userManager,
            IMapper mapper,
            IConfiguration configuration,
            IUnitOfWork unitOfWork,
            IHttpClientFactory httpClientFactory,
            ILogger<AuthService> logger)
        {
            _userManager = userManager;
            _mapper = mapper;
            _configuration = configuration;
            _unitOfWork = unitOfWork;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        // Register User
        public async Task<UserResponseDto> RegisterAsync(UserRegisterDto dto)
        {
            var user = _mapper.Map<AppUser>(dto);
            user.UserName = dto.Email;

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));

            // Default role: Customer
            await _userManager.AddToRoleAsync(user, "Customer");

            return new UserResponseDto
            {
                UserId = user.Id,
                Name = user.Name,
                Email = user.Email!,
                Role = "Customer",
                CreatedAt = user.CreatedAt
            };
        }

        // Login + Generate Access + Refresh Token
        public async Task<AuthResponseDto> LoginAsync(UserLoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
                throw new UnauthorizedAccessException("Invalid email or password");

            return await IssueTokensAsync(user);
        }

        // External login (Google / Facebook) — validates the provider token server-side,
        // links the provider account to a local user and issues the same JWT session.
        public async Task<AuthResponseDto> ExternalLoginAsync(ExternalLoginDto dto)
        {
            var provider = (dto.Provider ?? string.Empty).Trim().ToLowerInvariant() switch
            {
                "google" => "Google",
                "facebook" => "Facebook",
                _ => throw new InvalidOperationException("Unsupported sign-in provider.")
            };

            var externalUser = provider == "Google"
                ? await ValidateGoogleTokenAsync(dto.Token)
                : await ValidateFacebookTokenAsync(dto.Token);

            var user = await _userManager.FindByLoginAsync(provider, externalUser.ProviderKey);

            if (user == null)
            {
                user = await _userManager.FindByEmailAsync(externalUser.Email);

                if (user == null)
                {
                    user = new AppUser
                    {
                        Name = externalUser.Name,
                        Email = externalUser.Email,
                        UserName = externalUser.Email,
                        EmailConfirmed = true,
                        Role = AppUserRole.Customer,
                        CreatedAt = DateTime.UtcNow
                    };

                    var createResult = await _userManager.CreateAsync(user);
                    if (!createResult.Succeeded)
                    {
                        _logger.LogWarning("External sign-in user creation failed for {Provider}", provider);
                        throw new InvalidOperationException("Could not create an account for this sign-in.");
                    }

                    await _userManager.AddToRoleAsync(user, "Customer");
                }
                else if (await _userManager.IsInRoleAsync(user, "Admin") ||
                         await _userManager.IsInRoleAsync(user, "Vendor"))
                {
                    // Never hand an Admin/Vendor session to a third-party identity.
                    throw new InvalidOperationException("This account must sign in with email and password.");
                }

                var linkResult = await _userManager.AddLoginAsync(
                    user, new UserLoginInfo(provider, externalUser.ProviderKey, provider));

                if (!linkResult.Succeeded &&
                    !linkResult.Errors.All(e => e.Code == "LoginAlreadyAssociated"))
                {
                    throw new InvalidOperationException("Could not link this sign-in to your account.");
                }
            }

            return await IssueTokensAsync(user);
        }

        // Shared token issuing for password and external logins.
        private async Task<AuthResponseDto> IssueTokensAsync(AppUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Customer";

            var accessToken = GenerateAccessToken(user, roles);
            var refreshToken = GenerateRefreshToken();

            var refreshTokenEntity = new RefreshToken
            {
                UserId = user.Id,
                Token = refreshToken,
                ExpiryDate = DateTime.UtcNow.AddDays(
                    _configuration.GetValue<int>("Jwt:RefreshTokenExpirationDays"))
            };

            _unitOfWork.Repository<RefreshToken>().Add(refreshTokenEntity);
            await _unitOfWork.SaveChangesAsync();

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                AccessTokenExpiry = DateTime.UtcNow.AddMinutes(
                    _configuration.GetValue<int>("Jwt:AccessTokenExpirationMinutes")),
                RefreshTokenExpiry = refreshTokenEntity.ExpiryDate,
                User = new UserResponseDto
                {
                    UserId = user.Id,
                    Name = user.Name,
                    Email = user.Email!,
                    Role = role,
                    CreatedAt = user.CreatedAt
                }
            };
        }

        private sealed record ExternalUserInfo(string ProviderKey, string Email, string Name);

        private async Task<ExternalUserInfo> ValidateGoogleTokenAsync(string idToken)
        {
            var clientId = _configuration["Authentication:Google:ClientId"];
            if (string.IsNullOrWhiteSpace(clientId))
                throw new InvalidOperationException("Google sign-in is not configured.");

            if (string.IsNullOrWhiteSpace(idToken))
                throw new InvalidOperationException("Google sign-in failed. Please try again.");

            var client = _httpClientFactory.CreateClient();
            using var response = await client.GetAsync(
                "https://oauth2.googleapis.com/tokeninfo?id_token=" + Uri.EscapeDataString(idToken));

            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException("Google sign-in failed. Please try again.");

            using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            var root = json.RootElement;

            var audience = root.TryGetProperty("aud", out var aud) ? aud.GetString() : null;
            if (!string.Equals(audience, clientId, StringComparison.Ordinal))
                throw new InvalidOperationException("Google sign-in failed. Please try again.");

            var issuer = root.TryGetProperty("iss", out var iss) ? iss.GetString() : null;
            if (issuer != "accounts.google.com" && issuer != "https://accounts.google.com")
                throw new InvalidOperationException("Google sign-in failed. Please try again.");

            var emailVerified = root.TryGetProperty("email_verified", out var verified) &&
                (verified.ValueKind == JsonValueKind.True ||
                 string.Equals(verified.GetString(), "true", StringComparison.OrdinalIgnoreCase));

            var email = root.TryGetProperty("email", out var emailEl) ? emailEl.GetString() : null;
            var subject = root.TryGetProperty("sub", out var sub) ? sub.GetString() : null;

            if (string.IsNullOrWhiteSpace(email) || !emailVerified || string.IsNullOrWhiteSpace(subject))
                throw new InvalidOperationException("Your Google account email is not verified.");

            var name = root.TryGetProperty("name", out var nameEl) ? nameEl.GetString() : null;

            return new ExternalUserInfo(subject!, email!, string.IsNullOrWhiteSpace(name) ? email! : name);
        }

        private async Task<ExternalUserInfo> ValidateFacebookTokenAsync(string accessToken)
        {
            var appId = _configuration["Authentication:Facebook:AppId"];
            var appSecret = _configuration["Authentication:Facebook:AppSecret"];

            if (string.IsNullOrWhiteSpace(appId) || string.IsNullOrWhiteSpace(appSecret))
                throw new InvalidOperationException("Facebook sign-in is not configured.");

            if (string.IsNullOrWhiteSpace(accessToken))
                throw new InvalidOperationException("Facebook sign-in failed. Please try again.");

            var client = _httpClientFactory.CreateClient();

            // debug_token proves the token was issued for this app (app_id match).
            using var debugResponse = await client.GetAsync(
                "https://graph.facebook.com/debug_token?input_token=" +
                Uri.EscapeDataString(accessToken) +
                "&access_token=" +
                Uri.EscapeDataString($"{appId}|{appSecret}"));

            if (!debugResponse.IsSuccessStatusCode)
                throw new InvalidOperationException("Facebook sign-in failed. Please try again.");

            using var debugJson = JsonDocument.Parse(await debugResponse.Content.ReadAsStringAsync());
            if (!debugJson.RootElement.TryGetProperty("data", out var data) ||
                !data.TryGetProperty("is_valid", out var valid) || valid.ValueKind != JsonValueKind.True ||
                !data.TryGetProperty("app_id", out var tokenAppId) ||
                !string.Equals(tokenAppId.GetString(), appId, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("Facebook sign-in failed. Please try again.");
            }

            using var profileResponse = await client.GetAsync(
                "https://graph.facebook.com/me?fields=id,name,email&access_token=" +
                Uri.EscapeDataString(accessToken));

            if (!profileResponse.IsSuccessStatusCode)
                throw new InvalidOperationException("Facebook sign-in failed. Please try again.");

            using var profileJson = JsonDocument.Parse(await profileResponse.Content.ReadAsStringAsync());
            var profile = profileJson.RootElement;

            var id = profile.TryGetProperty("id", out var idEl) ? idEl.GetString() : null;
            var email = profile.TryGetProperty("email", out var emailEl) ? emailEl.GetString() : null;
            var name = profile.TryGetProperty("name", out var nameEl) ? nameEl.GetString() : null;

            if (string.IsNullOrWhiteSpace(id))
                throw new InvalidOperationException("Facebook sign-in failed. Please try again.");

            if (string.IsNullOrWhiteSpace(email))
                throw new InvalidOperationException(
                    "Facebook did not share an email address. Please grant email permission and try again.");

            return new ExternalUserInfo(id!, email!, string.IsNullOrWhiteSpace(name) ? email! : name);
        }


        // Refresh Token
        public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
        {
            var storedToken = await _unitOfWork.Repository<RefreshToken>()
                .GetFirstOrDefaultAsync(t => t.Token == refreshToken);

            if (storedToken == null || storedToken.ExpiryDate < DateTime.UtcNow)
                throw new SecurityTokenException("Invalid or expired refresh token");

            var user = await _userManager.FindByIdAsync(storedToken.UserId.ToString());
            if (user == null)
                throw new SecurityTokenException("User not found");

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Customer";

            // Remove old refresh token
            _unitOfWork.Repository<RefreshToken>().Remove(storedToken);

            // Generate new tokens
            var newAccessToken = GenerateAccessToken(user, roles);
            var newRefreshToken = GenerateRefreshToken();

            var newRefreshTokenEntity = new RefreshToken
            {
                UserId = user.Id,
                Token = newRefreshToken,
                ExpiryDate = DateTime.UtcNow.AddDays(
                    _configuration.GetValue<int>("Jwt:RefreshTokenExpirationDays"))
            };

            _unitOfWork.Repository<RefreshToken>().Add(newRefreshTokenEntity);
            await _unitOfWork.SaveChangesAsync();

            return new AuthResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                AccessTokenExpiry = DateTime.UtcNow.AddMinutes(
                    _configuration.GetValue<int>("Jwt:AccessTokenExpirationMinutes")),
                RefreshTokenExpiry = newRefreshTokenEntity.ExpiryDate,
                User = new UserResponseDto
                {
                    UserId = user.Id,
                    Name = user.Name,
                    Email = user.Email!,
                    Role = role,
                    CreatedAt = user.CreatedAt
                }
            };
        }

        // Revoke Refresh Token (Logout) — শুধু টোকেনের মালিকই revoke করতে পারে
        public async Task RevokeRefreshTokenAsync(string refreshToken, int userId)
        {
            var storedToken = await _unitOfWork.Repository<RefreshToken>()
                .GetFirstOrDefaultAsync(t => t.Token == refreshToken && t.UserId == userId);

            if (storedToken != null)
            {
                _unitOfWork.Repository<RefreshToken>().Remove(storedToken);
                await _unitOfWork.SaveChangesAsync();
            }
        }

        // Get Current User
        public async Task<UserResponseDto?> GetCurrentUserAsync(int userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return null;

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Customer";

            return new UserResponseDto
            {
                UserId = user.Id,
                Name = user.Name,
                Email = user.Email!,
                Role = role,
                CreatedAt = user.CreatedAt
            };
        }

        // Generate JWT Access Token (Synchronous, warning-free)
        private string GenerateAccessToken(AppUser user, IList<string> roles)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email!)
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    _configuration.GetValue<int>("Jwt:AccessTokenExpirationMinutes")),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // Generate Refresh Token
        private string GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }
    }
}
