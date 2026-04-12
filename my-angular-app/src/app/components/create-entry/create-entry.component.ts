import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { forkJoin } from 'rxjs';

import { CreateBorrowRequest } from '../../models/borrow.model';
import { EntryDirection, EntryType } from '../../models/dashboard.model';
import { CreateFavorRequest } from '../../models/favor.model';
import { User } from '../../models/user.model';
import { BorrowService } from '../../services/borrow.service';
import { FavorService } from '../../services/favor.service';

@Component({
  selector: 'app-create-entry',
  standalone: false,
  templateUrl: './create-entry.component.html',
  styleUrls: ['./create-entry.component.css'],
})
export class CreateEntryComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() users: User[] = [];
  @Input() currentUserId = '';
  @Input() selectedOtherUserId: string | null = null;

  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  entryType: EntryType = 'favor';
  direction: EntryDirection = 'outgoing';
  title = '';
  selectedUserIds: string[] = [];
  createdOn = this.getTodayValue();
  dueDate = '';
  isSaving = false;
  errorMessage = '';

  constructor(
    private readonly borrowService: BorrowService,
    private readonly favorService: FavorService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
    }
  }

  get canSave(): boolean {
    return (
      !this.isSaving &&
      Boolean(this.currentUserId) &&
      this.selectedUserIds.length > 0 &&
      Boolean(this.createdOn) &&
      Boolean(this.title.trim())
    );
  }

  get modalTitle(): string {
    return this.entryType === 'borrow' ? 'Create borrows' : 'Create favors';
  }

  get titleLabel(): string {
    return this.entryType === 'borrow' ? 'Title or item' : 'Description';
  }

  get titlePlaceholder(): string {
    return this.entryType === 'borrow'
      ? 'e.g. Book, To-Go cup, Charging cable'
      : 'e.g. Bought drinks';
  }

  get firstDirectionLabel(): string {
    return this.entryType === 'borrow' ? 'I lent this item' : 'I did the favor';
  }

  get secondDirectionLabel(): string {
    return this.entryType === 'borrow' ? 'I borrowed this item' : 'I owe a favor';
  }

  get selectedUsersSummary(): string {
    if (this.selectedUserIds.length === 0) {
      return 'Select at least one person to continue.';
    }

    if (this.selectedUserIds.length === 1) {
      const name = this.resolveUserName(this.selectedUserIds[0]);
      return `1 person selected: ${name}.`;
    }

    return `${this.selectedUserIds.length} people selected. One entry will be created for each person.`;
  }

  get summaryText(): string {
    if (this.selectedUserIds.length === 0) {
      return 'Pick one or more people to preview how this entry will be stored.';
    }

    const recipientLabel =
      this.selectedUserIds.length === 1
        ? this.resolveUserName(this.selectedUserIds[0])
        : `${this.selectedUserIds.length} selected people`;

    if (this.entryType === 'borrow') {
      return this.direction === 'outgoing'
        ? `This will save borrows where ${recipientLabel} borrowed from you.`
        : `This will save borrows where you borrowed from ${recipientLabel}.`;
    }

    return this.direction === 'outgoing'
      ? `This will save favors where ${recipientLabel} owe(s) you.`
      : `This will save favors where you owe ${recipientLabel}.`;
  }

  chooseType(type: EntryType): void {
    this.entryType = type;
    this.errorMessage = '';
  }

  chooseDirection(direction: EntryDirection): void {
    this.direction = direction;
    this.errorMessage = '';
  }

  toggleUserSelection(userId: string): void {
    if (this.isSaving) {
      return;
    }

    if (this.selectedUserIds.includes(userId)) {
      this.selectedUserIds = this.selectedUserIds.filter((id) => id !== userId);
    } else {
      this.selectedUserIds = [...this.selectedUserIds, userId];
    }
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUserIds.includes(userId);
  }

  saveEntry(): void {
    if (!this.canSave) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const requests = this.selectedUserIds.map((otherUserId) =>
      this.entryType === 'borrow'
        ? this.borrowService.createBorrow(this.buildBorrowPayload(otherUserId))
        : this.favorService.createFavor(this.buildFavorPayload(otherUserId)),
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.isSaving = false;
        this.saved.emit();
      },
      error: () => {
        this.errorMessage =
          'The entry could not be saved. Please verify API and database connectivity.';
        this.isSaving = false;
      },
    });
  }

  closePanel(): void {
    if (this.isSaving) {
      return;
    }

    this.closed.emit();
  }

  stopPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  private buildBorrowPayload(otherUserId: string): CreateBorrowRequest {
    const isOutgoing = this.direction === 'outgoing';

    return {
      lenderId: isOutgoing ? this.currentUserId : otherUserId,
      borrowerId: isOutgoing ? otherUserId : this.currentUserId,
      itemName: this.title.trim(),
      dueDate: this.dueDate || null,
      returnedAt: null,
      createdAt: this.toIsoTimestamp(this.createdOn),
    };
  }

  private buildFavorPayload(otherUserId: string): CreateFavorRequest {
    const isOutgoing = this.direction === 'outgoing';

    return {
      creditorId: isOutgoing ? this.currentUserId : otherUserId,
      debtorId: isOutgoing ? otherUserId : this.currentUserId,
      description: this.title.trim(),
      isSettled: false,
      createdAt: this.toIsoTimestamp(this.createdOn),
    };
  }

  private resetForm(): void {
    this.entryType = 'favor';
    this.direction = 'outgoing';
    this.title = '';
    this.selectedUserIds =
      this.selectedOtherUserId && this.users.some((user) => user.userId === this.selectedOtherUserId)
        ? [this.selectedOtherUserId]
        : [];
    this.createdOn = this.getTodayValue();
    this.dueDate = '';
    this.isSaving = false;
    this.errorMessage = '';
  }

  private resolveUserName(userId: string): string {
    return this.users.find((user) => user.userId === userId)?.username ?? 'Unknown person';
  }

  private getTodayValue(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private toIsoTimestamp(dateValue: string): string {
    return new Date(`${dateValue}T12:00:00`).toISOString();
  }
}
