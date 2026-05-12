using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CoffeeAndKudos.Model.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace CoffeeAndKudos.API.Controllers;

public record LoginRequest(string Email, string Password);
public record LoginResponse(string Token, string UserId, string Username, string Role);

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserRepository _userRepo;
    private readonly IConfiguration _config;

    public AuthController(UserRepository userRepo, IConfiguration config)
    {
        _userRepo = userRepo;
        _config = config;
    }

    // POST /api/Auth/login
    // Verifies email + password via pgcrypto and returns a signed JWT on success.
    [HttpPost("login")]
    public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
    {
        var user = _userRepo.GetUserByEmailAndPassword(request.Email, request.Password);
        if (user == null)
            return Unauthorized("Invalid email or password.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return Ok(new LoginResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            user.UserId.ToString(),
            user.Username,
            user.Role
        ));
    }
}
