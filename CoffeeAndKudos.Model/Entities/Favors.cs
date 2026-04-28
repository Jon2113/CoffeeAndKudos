namespace CoffeeAndKudos.Model.Entities;

// Represents a single favor record
public class Favor
{
    // Default constructor 
    public Favor()
    {
    }

    // Constructor used when we already have an ID 
    public Favor(Guid favorId)
    {
        FavorId = favorId;
    }

    // Unique ID for this favor record 
    public Guid FavorId { get; set; } = Guid.NewGuid();

    // The person who owes the favor
    public Guid DebtorId { get; set; }

    // The person who is owed the favor
    public Guid CreditorId { get; set; }

    // A description of what the favor is (e.g. "helped me move", "covered my lunch")
    public string Description { get; set; } = string.Empty;

    // Whether the favor has been settled, false means it's still outstanding, true means it's been repaid
    public bool IsSettled { get; set; }

    // The date and time this favor record was created, automatically set to now (UTC) when created
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}