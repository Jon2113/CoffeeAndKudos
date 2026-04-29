namespace CoffeeAndKudos.Model.Entities;

public class Favor
{
    public Favor() { }

    // Used when loading an existing favor record from the database, preserving the stored ID.
    public Favor(Guid favorId)
    {
        FavorId = favorId;
    }

    public Guid FavorId { get; set; } = Guid.NewGuid();
    public Guid DebtorId { get; set; }    // the user who owes the favor
    public Guid CreditorId { get; set; }  // the user who is owed the favor
    public string Description { get; set; } = string.Empty;
    public bool IsSettled { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
