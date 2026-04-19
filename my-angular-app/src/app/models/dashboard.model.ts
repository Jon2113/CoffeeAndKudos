// Aggregated counters shown in the four scale cards on the dashboard.
export interface ScaleStats {
  countLent: number;
  countBorrowed: number;
  favorsGiven: number;
  favorsTaken: number;
}

export type ScaleFilterKey = 'countLent' | 'countBorrowed' | 'favorsGiven' | 'favorsTaken';

// Unified view model that merges a Borrow or Favor into a single timeline item.
export interface ActivityEntry {
  id: string;
  type: 'borrow' | 'favor';
  direction: EntryDirection;
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
