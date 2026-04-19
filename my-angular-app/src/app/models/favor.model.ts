// Represents a single favor (non-monetary debt) between two users.
export interface Favor {
  favorId: string;
  debtorId: string;
  creditorId: string;
  description: string;
  isSettled: boolean; // false = still open; true = settled
  createdAt: string;
}

// Payload sent to the API when creating a new favor (no favorId yet).
export interface CreateFavorRequest {
  debtorId: string;
  creditorId: string;
  description: string;
  isSettled: boolean;
  createdAt: string;
}
