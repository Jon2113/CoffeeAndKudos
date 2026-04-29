namespace CoffeeAndKudos.Model.Entities;

public class Borrow
{
    public Borrow() { }

    // Used when loading an existing borrow record from the database, preserving the stored ID.
    public Borrow(Guid borrowId)
    {
        BorrowId = borrowId;
    }

    public Guid BorrowId { get; set; } = Guid.NewGuid();
    public Guid LenderId { get; set; }
    public Guid BorrowerId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public DateOnly? DueDate { get; set; }    // null = no due date set
    public DateTime? ReturnedAt { get; set; } // null = item not yet returned
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
