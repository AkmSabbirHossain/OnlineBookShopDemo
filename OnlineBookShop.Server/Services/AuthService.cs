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

namespace OnlineBookShop.Server.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;
        private readonly IUnitOfWork _unitOfWork;

        public AuthService(
            UserManager<AppUser> userManager,
            IMapper mapper,
            IConfiguration configuration,
            IUnitOfWork unitOfWork)
        {
            _userManager = userManager;
            _mapper = mapper;
            _configuration = configuration;
            _unitOfWork = unitOfWork;
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

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Customer";

            var accessToken = GenerateAccessToken(user, roles);
            var refreshToken = GenerateRefreshToken();

            // Save refresh token
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

        // Revoke Refresh Token (Logout)
        public async Task RevokeRefreshTokenAsync(string refreshToken)
        {
            var storedToken = await _unitOfWork.Repository<RefreshToken>()
                .GetFirstOrDefaultAsync(t => t.Token == refreshToken);

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
