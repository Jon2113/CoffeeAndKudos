namespace CoffeeAndKudos.Model.Entities;

public class Favor
{
    public Favor()
    {
    }

    public Favor(Guid favorId)
    {
        FavorId = favorId;
    }

    public Guid FavorId { get; set; } = Guid.NewGuid();
    public Guid DebtorId { get; set; }
    public Guid CreditorId { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsSettled { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
