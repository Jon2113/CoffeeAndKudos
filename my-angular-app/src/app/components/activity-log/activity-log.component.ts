import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ActivityEntry } from '../../models/dashboard.model';
import { BorrowService } from '../../services/borrow.service';
import { FavorService } from '../../services/favor.service';

@Component({
  selector: 'app-activity-log',
  standalone: false,
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.css'],
})
export class ActivityLogComponent {
  @Input() entries: ActivityEntry[] = [];
  @Output() entryUpdated = new EventEmitter<void>();

  busyEntryId = '';
  actionError = '';

  constructor(
    private readonly borrowService: BorrowService,
    private readonly favorService: FavorService,
  ) {}

  completeEntry(entry: ActivityEntry): void {
    if (entry.isCompleted || this.busyEntryId) {
      return;
    }

    this.actionError = '';
    this.busyEntryId = entry.id;

    const request$ =
      entry.type === 'borrow'
        ? this.borrowService.returnBorrow(entry.id)
        : this.favorService.settleFavor(entry.id);

    request$.subscribe({
      next: () => {
        this.busyEntryId = '';
        this.entryUpdated.emit();
      },
      error: () => {
        this.actionError =
          'Der Eintrag konnte nicht aktualisiert werden. Bitte pruefe, ob die API erreichbar ist.';
        this.busyEntryId = '';
      },
    });
  }

  trackByEntryId(_index: number, entry: ActivityEntry): string {
    return `${entry.type}-${entry.id}`;
  }
}
