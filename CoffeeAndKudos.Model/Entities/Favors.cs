namespace CoffeeAndKudos.Model.Entities;

public class Favor
{
    public Favor()
    {
    }

    public Favor(Guid id)
    {
        Id = id;
    }

    public Guid Id { get; set; } = Guid.NewGuid();
    public string Description { get; set; } = string.Empty;
    public bool IsSettled { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreditorId { get; set; }
    public Guid DebtorId { get; set; }
}
