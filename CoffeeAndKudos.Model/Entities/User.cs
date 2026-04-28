namespace CoffeeAndKudos.Model.Entities;

// Represents a single user in the system
public class User
{
    // Default constructor — used when creating a User without a specific ID (ID gets auto-generated)
    public User()
    {
    }

    // Constructor used when we already have an ID — e.g. when loading an existing user from the database
    public User(Guid userId)
    {
        UserId = userId;
    }

    // Unique ID for this user — automatically generated if not provided
    public Guid UserId { get; set; } = Guid.NewGuid();

    // The user's display name
    public string Username { get; set; } = string.Empty;

    // The user's email address
    public string Email { get; set; } = string.Empty;

    // The date and time this user account was created — automatically set to now (UTC) when created
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // How many times this user has lent something to someone else
    public int CountLent { get; set; }

    // How many times this user has borrowed something from someone else
    public int CountBorrowed { get; set; }

    // How many favors this user has done for others
    public int FavorsGiven { get; set; }

    // How many favors this user has received from others
    public int FavorsTaken { get; set; }
}