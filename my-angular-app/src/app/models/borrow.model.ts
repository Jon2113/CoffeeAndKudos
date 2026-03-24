export interface Borrow {
  borrowId: string;
  lenderId: string;
  borrowerId: string;
  itemName: string;
  dueDate: string | null;
  returnedAt: string | null;
  createdAt: string;
}

export interface CreateBorrowRequest {
  lenderId: string;
  borrowerId: string;
  itemName: string;
  dueDate: string | null;
  returnedAt: string | null;
  createdAt: string;
}
