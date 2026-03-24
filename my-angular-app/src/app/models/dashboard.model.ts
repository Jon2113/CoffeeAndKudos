export interface ScaleStats {
  countLent: number;
  countBorrowed: number;
  favorsGiven: number;
  favorsTaken: number;
}

export interface ActivityEntry {
  id: string;
  type: 'borrow' | 'favor';
  title: string;
  counterpartyName: string;
  createdAt: string;
  dueDate: string | null;
  isCompleted: boolean;
  statusText: string;
  directionText: string;
  actionText: string;
  accent: 'borrow' | 'favor';
}

export type EntryType = 'borrow' | 'favor';
export type EntryDirection = 'outgoing' | 'incoming';
