import { Component, Input } from '@angular/core';

import { ScaleStats } from '../../models/dashboard.model';

interface ScaleCardView {
  label: string;
  value: number;
  detail: string;
  tone: 'amber' | 'clay' | 'teal' | 'olive';
}

@Component({
  selector: 'app-scale',
  standalone: false,
  templateUrl: './scale.component.html',
  styleUrls: ['./scale.component.css'],
})
export class ScaleComponent {
  @Input() stats: ScaleStats | null = null;
  @Input() currentUserName = '';
  @Input() otherUserName = '';

  get heading(): string {
    return this.otherUserName
      ? `${this.currentUserName} and ${this.otherUserName} in direct comparison`
      : `${this.currentUserName} overview`;
  }

  get subline(): string {
    return this.otherUserName
      ? 'All values include only your direct one-on-one relationship.'
      : 'Global scale values come from user counters in the backend.';
  }

  get cards(): ScaleCardView[] {
    const stats = this.stats ?? {
      countLent: 0,
      countBorrowed: 0,
      favorsGiven: 0,
      favorsTaken: 0,
    };

    return [
      {
        label: 'Lent',
        value: stats.countLent,
        detail: 'Active borrows where you are the lender.',
        tone: 'amber',
      },
      {
        label: 'Borrowed',
        value: stats.countBorrowed,
        detail: 'Active borrows where you borrowed from others.',
        tone: 'clay',
      },
      {
        label: 'Favors given',
        value: stats.favorsGiven,
        detail: 'Open favors where you helped someone else.',
        tone: 'teal',
      },
      {
        label: 'Favors received',
        value: stats.favorsTaken,
        detail: 'Open favors you still owe to someone else.',
        tone: 'olive',
      },
    ];
  }
}
