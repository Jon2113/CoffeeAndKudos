using System.Text.Json.Serialization;

namespace CoffeeAndKudos.Model.Entities;

public class User
{
    public User() { }

    // Used when loading an existing user from the database, preserving the stored ID.
    public User(Guid userId)
    {
        UserId = userId;
    }

    public Guid UserId { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "user";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int CountLent { get; set; }
    public int CountBorrowed { get; set; }
    public int FavorsGiven { get; set; }
    public int FavorsTaken { get; set; }

    // Never serialised to JSON responses — only used internally for authentication.
    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;
}
