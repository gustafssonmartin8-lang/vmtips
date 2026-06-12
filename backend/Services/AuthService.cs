using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using VmTips.Models;

namespace VmTips.Services;

public class AuthService(IConfiguration config)
{
    public string HashPassword(string password, string salt)
    {
        var saltBytes = Convert.FromBase64String(salt);
        return Convert.ToBase64String(KeyDerivation.Pbkdf2(
            password, saltBytes,
            KeyDerivationPrf.HMACSHA256,
            iterationCount: 100_000,
            numBytesRequested: 32));
    }

    public string GenerateSalt() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));

    public bool VerifyPassword(string password, string hash, string salt) =>
        HashPassword(password, salt) == hash;

    public string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("isAdmin", user.IsAdmin.ToString()),
        };
        var token = new JwtSecurityToken(
            issuer: "vmtips",
            audience: "vmtips",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
