// Represents a single item loan between two users.
export interface Borrow {
  borrowId: string;
  lenderId: string;
  borrowerId: string;
  itemName: string;
  dueDate: string | null;
  returnedAt: string | null; // null = still active; set to complete the borrow
  createdAt: string;
}

// Payload sent to the API when creating a new borrow (no borrowId yet).
export interface CreateBorrowRequest {
  lenderId: string;
  borrowerId: string;
  itemName: string;
  dueDate: string | null;
  returnedAt: string | null;
  createdAt: string;
}
