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
      ? `${this.currentUserName} und ${this.otherUserName} im Direktvergleich`
      : `${this.currentUserName} im Gesamtueberblick`;
  }

  get subline(): string {
    return this.otherUserName
      ? 'Alle Werte zeigen nur eure direkte 1-on-1 Beziehung.'
      : 'Die globale Scale nutzt die Zaehler aus dem User-Backend.';
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
        label: 'Verliehen',
        value: stats.countLent,
        detail: 'Aktive Borrows, die von dir rausgegeben wurden.',
        tone: 'amber',
      },
      {
        label: 'Geliehen',
        value: stats.countBorrowed,
        detail: 'Aktive Borrows, die du von anderen hast.',
        tone: 'clay',
      },
      {
        label: 'Gefallen gegeben',
        value: stats.favorsGiven,
        detail: 'Offene Favors, bei denen du geholfen hast.',
        tone: 'teal',
      },
      {
        label: 'Gefallen erhalten',
        value: stats.favorsTaken,
        detail: 'Offene Favors, die du noch schuldig bist.',
        tone: 'olive',
      },
    ];
  }
}
