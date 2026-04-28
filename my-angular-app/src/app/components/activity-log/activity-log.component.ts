import { DatePipe, NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ActivityEntry, ScaleFilterKey } from '../../models/dashboard.model';
import { BorrowService } from '../../services/borrow.service';
import { FavorService } from '../../services/favor.service';

type ActivityTypeFilter = 'all' | 'borrow' | 'favor';
type ActivityDirectionFilter = 'all' | 'outgoing' | 'incoming';
type ActivityStatusFilter = 'all' | 'open' | 'completed';
type ActivityDateWindowFilter = 'all' | 'today' | 'last7' | 'last30';
type ActivityDateSort = 'newest' | 'oldest' | 'dueSoon';

// Shows the combined borrow/favor timeline with local filters, sorting, edit mode,
// and scale-card filter integration from the parent dashboard.
@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, UpperCasePipe, DatePipe],
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.css'],
})
export class ActivityLogComponent implements OnChanges {
  // Maps scale filter keys to human-readable labels shown in the active-filter banner.
  private static readonly FILTER_LABELS: Record<ScaleFilterKey, string> = {
    countLent: 'Items lent by you',
    countBorrowed: 'Items borrowed by you',
    favorsGiven: 'Favors done by you',
    favorsTaken: 'Favors owed to you',
  };

  @Input() entries: ActivityEntry[] = [];
  @Input() scaleFilters: ScaleFilterKey[] = [];
  @Input() selectedOtherUserName = '';

  @Output() entryUpdated = new EventEmitter<void>();
  @Output() clearScaleFilter = new EventEmitter<void>();

  busyEntryId = '';
  busyAction: 'complete' | 'delete' | '' = '';
  actionError = '';
  editError = '';
  editingEntryId = '';
  editTitle = '';
  editCreatedOn = '';
  editDueDate = '';
  isSavingEdit = false;
  isFilterPanelOpen = false;
  isEditMode = false;

  typeFilter: ActivityTypeFilter = 'all';
  directionFilter: ActivityDirectionFilter = 'all';
  statusFilter: ActivityStatusFilter = 'all';
  dateWindowFilter: ActivityDateWindowFilter = 'all';
  dateSort: ActivityDateSort = 'newest';

  constructor(
    private readonly borrowService: BorrowService,
    private readonly favorService: FavorService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Cancel any open inline edit if the entry being edited was deleted externally.
    if (
      changes['entries'] &&
      this.editingEntryId &&
      !this.entries.some((entry) => entry.id === this.editingEntryId)
    ) {
      this.cancelEdit();
    }
  }

  // Applies all active filters in order, then sorts the remaining entries.
  get filteredEntries(): ActivityEntry[] {
    let visibleEntries = [...this.entries];

    visibleEntries = this.applyScaleFilter(visibleEntries);
    visibleEntries = this.applyTypeFilter(visibleEntries);
    visibleEntries = this.applyDirectionFilter(visibleEntries);
    visibleEntries = this.applyStatusFilter(visibleEntries);
    visibleEntries = this.applyDateWindowFilter(visibleEntries);

    return this.applySort(visibleEntries);
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.scaleFilters.length > 0) {
      count += this.scaleFilters.length;
    }
    if (this.typeFilter !== 'all') {
      count += 1;
    }
    if (this.directionFilter !== 'all') {
      count += 1;
    }
    if (this.statusFilter !== 'all') {
      count += 1;
    }
    if (this.dateWindowFilter !== 'all') {
      count += 1;
    }
    if (this.dateSort !== 'newest') {
      count += 1;
    }

    return count;
  }

  get hasAnyLocalFilter(): boolean {
    return (
      this.typeFilter !== 'all' ||
      this.directionFilter !== 'all' ||
      this.statusFilter !== 'all' ||
      this.dateWindowFilter !== 'all' ||
      this.dateSort !== 'newest'
    );
  }

  get hasScaleFilters(): boolean {
    return this.scaleFilters.length > 0;
  }

  get scaleFilterLabel(): string {
    return this.scaleFilters
      .map((key) => ActivityLogComponent.FILTER_LABELS[key])
      .join(', ');
  }

  completeEntry(entry: ActivityEntry): void {
    if (entry.isCompleted || this.busyEntryId || this.isSavingEdit) {
      return;
    }

    this.actionError = '';
    this.busyEntryId = entry.id;
    this.busyAction = 'complete';

    const request$ =
      entry.type === 'borrow'
        ? this.borrowService.returnBorrow(entry.id)
        : this.favorService.settleFavor(entry.id);

    request$.subscribe({
      next: () => {
        this.busyEntryId = '';
        this.busyAction = '';
        this.entryUpdated.emit();
      },
      error: () => {
        this.actionError = 'Could not update entry. Please check that the API is reachable.';
        this.busyEntryId = '';
        this.busyAction = '';
      },
    });
  }

  deleteEntry(entry: ActivityEntry): void {
    if (this.busyEntryId || this.isSavingEdit) {
      return;
    }

    const isConfirmed = window.confirm(`Delete "${entry.title}"? This cannot be undone.`);

    if (!isConfirmed) {
      return;
    }

    this.actionError = '';
    this.busyEntryId = entry.id;
    this.busyAction = 'delete';

    const request$ =
      entry.type === 'borrow'
        ? this.borrowService.deleteBorrow(entry.id)
        : this.favorService.deleteFavor(entry.id);

    request$.subscribe({
      next: () => {
        this.busyEntryId = '';
        this.busyAction = '';
        this.entryUpdated.emit();
      },
      error: () => {
        this.actionError = 'Could not delete entry. Please check that the API is reachable.';
        this.busyEntryId = '';
        this.busyAction = '';
      },
    });
  }

  toggleFilterPanel(): void {
    this.isFilterPanelOpen = !this.isFilterPanelOpen;
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    this.editError = '';
    if (!this.isEditMode) {
      this.cancelEdit();
    }
  }

  clearAllLocalFilters(): void {
    this.typeFilter = 'all';
    this.directionFilter = 'all';
    this.statusFilter = 'all';
    this.dateWindowFilter = 'all';
    this.dateSort = 'newest';
  }

  removeScaleFilter(): void {
    this.clearScaleFilter.emit();
  }

  startEdit(entry: ActivityEntry): void {
    if (!this.isEditMode || this.isSavingEdit || this.busyEntryId) {
      return;
    }

    this.editingEntryId = entry.id;
    this.editTitle = entry.title;
    this.editCreatedOn = this.toDateInputValue(entry.createdAt);
    this.editDueDate = entry.dueDate ? this.toDateInputValue(entry.dueDate) : '';
    this.editError = '';
  }

  cancelEdit(): void {
    if (this.isSavingEdit) {
      return;
    }

    this.editingEntryId = '';
    this.editTitle = '';
    this.editCreatedOn = '';
    this.editDueDate = '';
    this.editError = '';
  }

  saveEdit(entry: ActivityEntry): void {
    if (!this.isEditing(entry.id) || this.isSavingEdit || this.busyEntryId) {
      return;
    }

    const title = this.editTitle.trim();
    if (!title || !this.editCreatedOn) {
      this.editError = 'Please fill in a title and a valid date before saving.';
      return;
    }

    this.editError = '';
    this.actionError = '';
    this.isSavingEdit = true;

    const createdAt = this.toIsoTimestamp(this.editCreatedOn);
    const request$ =
      entry.type === 'borrow'
        ? this.borrowService.updateBorrow(entry.id, {
            itemName: title,
            createdAt,
            dueDate: this.editDueDate || null,
          })
        : this.favorService.updateFavor(entry.id, {
            description: title,
            createdAt,
          });

    request$.subscribe({
      next: () => {
        this.isSavingEdit = false;
        this.cancelEdit();
        this.entryUpdated.emit();
      },
      error: () => {
        this.isSavingEdit = false;
        this.editError = 'Could not save changes. Please check API and database connectivity.';
      },
    });
  }

  isEditing(entryId: string): boolean {
    return this.editingEntryId === entryId;
  }

  trackByEntryId(_index: number, entry: ActivityEntry): string {
    return `${entry.type}-${entry.id}`;
  }

  private applyScaleFilter(entries: ActivityEntry[]): ActivityEntry[] {
    if (this.scaleFilters.length === 0) {
      return entries;
    }

    return entries.filter((entry) =>
      this.scaleFilters.some((filterKey) => this.matchesScaleFilter(entry, filterKey)),
    );
  }

  private matchesScaleFilter(entry: ActivityEntry, filterKey: ScaleFilterKey): boolean {
    switch (filterKey) {
      case 'countLent':
        return entry.type === 'borrow' && entry.direction === 'outgoing';
      case 'countBorrowed':
        return entry.type === 'borrow' && entry.direction === 'incoming';
      case 'favorsGiven':
        return entry.type === 'favor' && entry.direction === 'outgoing';
      case 'favorsTaken':
        return entry.type === 'favor' && entry.direction === 'incoming';
      default:
        return true;
    }
  }

  private applyTypeFilter(entries: ActivityEntry[]): ActivityEntry[] {
    return this.typeFilter === 'all'
      ? entries
      : entries.filter((entry) => entry.type === this.typeFilter);
  }

  private applyDirectionFilter(entries: ActivityEntry[]): ActivityEntry[] {
    return this.directionFilter === 'all'
      ? entries
      : entries.filter((entry) => entry.direction === this.directionFilter);
  }

  private applyStatusFilter(entries: ActivityEntry[]): ActivityEntry[] {
    switch (this.statusFilter) {
      case 'open':
        return entries.filter((entry) => !entry.isCompleted);
      case 'completed':
        return entries.filter((entry) => entry.isCompleted);
      default:
        return entries;
    }
  }

  private applyDateWindowFilter(entries: ActivityEntry[]): ActivityEntry[] {
    if (this.dateWindowFilter === 'all') {
      return entries;
    }

    const now = new Date();

    if (this.dateWindowFilter === 'today') {
      return entries.filter((entry) => {
        const created = new Date(entry.createdAt);
        return (
          created.getFullYear() === now.getFullYear() &&
          created.getMonth() === now.getMonth() &&
          created.getDate() === now.getDate()
        );
      });
    }

    const threshold = new Date();
    threshold.setHours(0, 0, 0, 0);
    threshold.setDate(
      threshold.getDate() - (this.dateWindowFilter === 'last7' ? 7 : 30),
    );

    return entries.filter((entry) => {
      const created = new Date(entry.createdAt);
      return !Number.isNaN(created.getTime()) && created >= threshold;
    });
  }

  private applySort(entries: ActivityEntry[]): ActivityEntry[] {
    switch (this.dateSort) {
      case 'oldest':
        return [...entries].sort(
          (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
        );
      case 'dueSoon':
        return [...entries].sort((left, right) => {
          const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          const rightDue = right.dueDate
            ? new Date(right.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER;
          return leftDue - rightDue;
        });
      default:
        return [...entries].sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        );
    }
  }

  private toDateInputValue(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Uses noon UTC to avoid off-by-one date shifts caused by timezone offsets.
  private toIsoTimestamp(dateValue: string): string {
    return new Date(`${dateValue}T12:00:00`).toISOString();
  }
}
