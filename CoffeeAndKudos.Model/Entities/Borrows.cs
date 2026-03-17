namespace CoffeeAndKudos.Model.Entities;

public class Borrow
{
    public Borrow()
    {
    }

    public Borrow(Guid borrowId)
    {
        BorrowId = borrowId;
    }

    public Guid BorrowId { get; set; } = Guid.NewGuid();
    public Guid LenderId { get; set; }
    public Guid BorrowerId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public DateOnly? DueDate { get; set; }
    public DateTime? ReturnedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
