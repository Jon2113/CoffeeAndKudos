namespace CoffeeAndKudos.Model.Entities;

public class User
{
    public User()
    {
    }

    public User(Guid id)
    {
        Id = id;
    }

    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CountLent { get; set; }
    public int CountBorrowed { get; set; }
    public int FavorsGiven { get; set; }
    public int FavorsTaken { get; set; }
}
