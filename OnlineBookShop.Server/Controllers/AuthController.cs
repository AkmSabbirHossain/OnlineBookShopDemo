// =============================================
// AuthController.cs —
// =============================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using System.Web;

namespace OnlineBookShop.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly UserManager<AppUser> _userManager;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;

        public AuthController(
            IAuthService authService,
            UserManager<AppUser> userManager,
            IEmailService emailService,
            IConfiguration config)
        {
            _authService = authService;
            _userManager = userManager;
            _emailService = emailService;
            _config = config;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var user = await _authService.RegisterAsync(dto);
                return Ok(new { Message = "Registration successful", User = user });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] UserLoginDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var authResult = await _authService.LoginAsync(dto);
                return Ok(authResult);
            }
            catch (UnauthorizedAccessException)
            {
                // ⭐ CRITICAL: Use "Error" not "Message" to match frontend
                return Unauthorized(new { Error = "Invalid email or password" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.RefreshToken))
                return BadRequest(new { Error = "Refresh token is required" });

            try
            {
                var authResult = await _authService.RefreshTokenAsync(dto.RefreshToken);
                return Ok(authResult);
            }
            catch (SecurityTokenException ex)
            {
                return Unauthorized(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("revoke")]
        [Authorize]
        public async Task<IActionResult> Revoke([FromBody] RefreshTokenRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.RefreshToken))
                return BadRequest(new { Error = "Refresh token is required" });

            await _authService.RevokeRefreshTokenAsync(dto.RefreshToken);
            return Ok(new { Message = "Refresh token revoked successfully" });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var user = await _authService.GetCurrentUserAsync(userId);
            if (user == null)
            {
                return NotFound(new { Error = "User not found" });
            }

            return Ok(user);
        }
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                // Security: Always return same message (prevent email enumeration)
                return Ok(new { Message = "If this email exists, a reset link has been sent." });
            }

            try
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var encodedToken = HttpUtility.UrlEncode(token);
                var encodedEmail = HttpUtility.UrlEncode(dto.Email);

                var frontendUrl = _config["AppSettings:FrontendUrl"]!;
                var resetLink = $"{frontendUrl}/reset-password?email={encodedEmail}&token={encodedToken}";

                await _emailService.SendPasswordResetEmailAsync(
                    toEmail: user.Email!,
                    userName: user.Name ?? "User",
                    resetLink: resetLink
                );

                Console.WriteLine($"Password reset link generated and email sent for: {dto.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Forgot Password Error for {dto.Email}: {ex.Message}");
                // Production e user ke specific error dewa uchit na
                // return BadRequest(new { Error = "Failed to send reset email. Please try again later." });
            }

            return Ok(new { Message = "If this email exists, a reset link has been sent." });
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
                return BadRequest(new { Message = "Invalid request." });

            var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);

            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToList();
                return BadRequest(new { Message = "Password reset failed.", Errors = errors });
            }

            return Ok(new { Message = "Password reset successfully. You can now log in." });
        }
    }

    public class RefreshTokenRequestDto
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
}

//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.IdentityModel.Tokens;
//using OnlineBookShop.Server.DTOs;
//using OnlineBookShop.Server.Interfaces;
//using System.Security.Claims;

//namespace OnlineBookShop.Server.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class AuthController : ControllerBase
//    {
//        private readonly IAuthService _authService;

//        public AuthController(IAuthService authService)
//        {
//            _authService = authService;
//        }


//        [HttpPost("register")]
//        [AllowAnonymous]
//        public async Task<IActionResult> Register([FromBody] UserRegisterDto dto)
//        {
//            if (!ModelState.IsValid)
//                return BadRequest(ModelState);

//            try
//            {
//                var user = await _authService.RegisterAsync(dto);
//                return Ok(new { Message = "Registration successful", User = user });
//            }
//            catch (Exception ex)
//            {
//                return BadRequest(new { Error = ex.Message });
//            }
//        }

//        /// Login for Jwt Token

//        [HttpPost("login")]
//        [AllowAnonymous]
//        public async Task<IActionResult> Login([FromBody] UserLoginDto dto)
//        {
//            if (!ModelState.IsValid)
//                return BadRequest(ModelState);

//            try
//            {
//                var authResult = await _authService.LoginAsync(dto);
//                return Ok(authResult);
//            }
//            catch (UnauthorizedAccessException)
//            {
//                return Unauthorized(new { Error = "Invalid email or password" });
//            }
//            catch (Exception ex)
//            {
//                return BadRequest(new { Error = ex.Message });
//            }
//        }

//        /// Access token refresh 

//        [HttpPost("refresh")]
//        [AllowAnonymous]
//        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto dto)
//        {
//            if (string.IsNullOrWhiteSpace(dto.RefreshToken))
//                return BadRequest(new { Error = "Refresh token is required" });

//            try
//            {
//                var authResult = await _authService.RefreshTokenAsync(dto.RefreshToken);
//                return Ok(authResult);
//            }
//            catch (SecurityTokenException ex)
//            {
//                return Unauthorized(new { Error = ex.Message });
//            }
//            catch (Exception ex)
//            {
//                return BadRequest(new { Error = ex.Message });
//            }
//        }

//        /// Refresh token revoke 
//        [HttpPost("revoke")]
//        [Authorize]
//        public async Task<IActionResult> Revoke([FromBody] RefreshTokenRequestDto dto)
//        {
//            if (string.IsNullOrWhiteSpace(dto.RefreshToken))
//                return BadRequest(new { Error = "Refresh token is required" });

//            await _authService.RevokeRefreshTokenAsync(dto.RefreshToken);
//            return Ok(new { Message = "Refresh token revoked successfully" });
//        }

//        // Current user login information
//        [HttpGet("me")]
//        [Authorize]
//        public async Task<IActionResult> GetCurrentUser()
//        {
//            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
//            {
//                return Unauthorized();
//            }

//            var user = await _authService.GetCurrentUserAsync(userId);
//            if (user == null)
//            {
//                return NotFound(new { Error = "User not found" });
//            }

//            return Ok(user);
//        }
//    }

//    // Refresh token request DTO
//    public class RefreshTokenRequestDto
//    {
//        public string RefreshToken { get; set; } = string.Empty;
//    }
//}