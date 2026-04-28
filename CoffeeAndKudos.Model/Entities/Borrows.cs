namespace CoffeeAndKudos.Model.Entities;

// Represents a single borrow record, i.e. one person lending something to another
public class Borrow
{
    // Default constructor 
    public Borrow()
    {
    }

    // Constructor used when we already have an ID 
    public Borrow(Guid borrowId)
    {
        BorrowId = borrowId;
    }

    // Unique ID for this borrow record, automatically generated if not provided
    public Guid BorrowId { get; set; } = Guid.NewGuid();

    // The person who is lending the item
    public Guid LenderId { get; set; }

    // The person who is borrowing the item
    public Guid BorrowerId { get; set; }

    // The name of the item being borrowed (e.g. "book", "charger")
    public string ItemName { get; set; } = string.Empty;

    // Optional deadline for when the item should be returned; null means no due date set
    public DateOnly? DueDate { get; set; }

    // The date and time the item was actually returned; null means it hasn't been returned yet
    public DateTime? ReturnedAt { get; set; }

    // The date and time this borrow record was created; automatically set to now (UTC) when created
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}