import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ScaleFilterKey, ScaleStats } from '../../models/dashboard.model';

interface ScaleCardView {
  label: string;
  value: number;
  detail: string;
  tone: 'borrow' | 'favor';
  filterKey: ScaleFilterKey;
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
  @Input() activeFilter: ScaleFilterKey | null = null;
  @Output() filterSelected = new EventEmitter<ScaleFilterKey>();

  get heading(): string {
    return this.otherUserName
      ? `${this.currentUserName} and ${this.otherUserName}`
      : `${this.currentUserName} at a glance`;
  }

  get subline(): string {
    return this.otherUserName
      ? 'See what is currently open between both of you, then tap a card to filter the timeline.'
      : 'Here you can see everything you owe and what others currently owe you.';
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
        tone: 'borrow',
        filterKey: 'countLent',
      },
      {
        label: 'Borrowed',
        value: stats.countBorrowed,
        detail: 'Active borrows where you borrowed from others.',
        tone: 'borrow',
        filterKey: 'countBorrowed',
      },
      {
        label: 'Favors given',
        value: stats.favorsGiven,
        detail: 'Open favors where you helped someone else.',
        tone: 'favor',
        filterKey: 'favorsGiven',
      },
      {
        label: 'Favors received',
        value: stats.favorsTaken,
        detail: 'Open favors you still owe to someone else.',
        tone: 'favor',
        filterKey: 'favorsTaken',
      },
    ];
  }

  selectFilter(filterKey: ScaleFilterKey): void {
    this.filterSelected.emit(filterKey);
  }

  isActive(filterKey: ScaleFilterKey): boolean {
    return this.activeFilter === filterKey;
  }
}
