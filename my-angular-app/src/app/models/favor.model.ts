export interface Favor {
  favorId: string;
  debtorId: string;
  creditorId: string;
  description: string;
  isSettled: boolean;
  createdAt: string;
}

export interface CreateFavorRequest {
  debtorId: string;
  creditorId: string;
  description: string;
  isSettled: boolean;
  createdAt: string;
}
