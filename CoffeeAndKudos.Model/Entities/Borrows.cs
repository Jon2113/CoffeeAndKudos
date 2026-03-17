namespace CoffeeAndKudos.Model.Entities;

public class Borrow
{
    public Borrow()
    {
    }

    public Borrow(Guid id)
    {
        Id = id;
    }

    public Guid Id { get; set; } = Guid.NewGuid();
    public string ItemName { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReturnedAt { get; set; }
    public Guid LenderId { get; set; }
    public Guid BorrowerId { get; set; }
}
