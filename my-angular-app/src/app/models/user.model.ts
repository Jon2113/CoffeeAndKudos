// User profile as returned by the API.
// Note: the counter fields (countLent etc.) are stored on the DB row but are NOT kept in sync
// automatically — the dashboard always recomputes scale stats from live borrow/favor data.
export interface User {
  userId: string;
  username: string;
  email: string;
  createdAt: string;
  countLent: number;
  countBorrowed: number;
  favorsGiven: number;
  favorsTaken: number;
}
