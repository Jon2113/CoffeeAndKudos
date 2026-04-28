import { NgClass, NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ScaleFilterKey, ScaleStats } from '../../models/dashboard.model';

interface ScaleCardView {
  label: string;
  value: number;
  detail: string;
  tone: 'borrow' | 'favor';
  filterKey: ScaleFilterKey;
}

// Displays 4 stat cards (lent, borrowed, favors given, favors received).
// Cards are clickable to toggle activity-log filters in the parent dashboard.
@Component({
  selector: 'app-scale',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './scale.component.html',
  styleUrls: ['./scale.component.css'],
})
export class ScaleComponent {
  @Input() stats: ScaleStats | null = null;
  @Input() currentUserName = '';
  @Input() otherUserName = '';
  @Input() activeFilters: ScaleFilterKey[] = [];
  @Output() filterSelected = new EventEmitter<ScaleFilterKey>();

  get heading(): string {
    return this.otherUserName
      ? `${this.currentUserName} and ${this.otherUserName}`
      : `${this.currentUserName} at a glance`;
  }

  get subline(): string {
    return this.otherUserName
      ? "What's open between you two. Tap a card to filter the timeline below."
      : 'What you gave and what you are owed — tap a card to filter the timeline.';
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
        detail: "Items you lent that haven't been returned yet.",
        tone: 'borrow',
        filterKey: 'countLent',
      },
      {
        label: 'Borrowed',
        value: stats.countBorrowed,
        detail: "Items you borrowed that you haven't returned yet.",
        tone: 'borrow',
        filterKey: 'countBorrowed',
      },
      {
        label: 'Favors given',
        value: stats.favorsGiven,
        detail: "Favors you've done that haven't been settled yet.",
        tone: 'favor',
        filterKey: 'favorsGiven',
      },
      {
        label: 'Favors received',
        value: stats.favorsTaken,
        detail: 'Favors others did for you that are still open.',
        tone: 'favor',
        filterKey: 'favorsTaken',
      },
    ];
  }

  selectFilter(filterKey: ScaleFilterKey): void {
    this.filterSelected.emit(filterKey);
  }

  get hasActiveFilters(): boolean {
    return this.activeFilters.length > 0;
  }

  isActive(filterKey: ScaleFilterKey): boolean {
    return this.activeFilters.includes(filterKey);
  }

  // A card is muted when filters are active but this card is not one of them.
  isMuted(filterKey: ScaleFilterKey): boolean {
    return this.hasActiveFilters && !this.isActive(filterKey);
  }
}
