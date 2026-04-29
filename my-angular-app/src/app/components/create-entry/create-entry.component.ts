import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { CreateBorrowRequest } from '../../models/borrow.model';
import { EntryDirection, EntryType } from '../../models/dashboard.model';
import { CreateFavorRequest, Favor } from '../../models/favor.model';
import { User } from '../../models/user.model';
import { BorrowService } from '../../services/borrow.service';
import { FavorService } from '../../services/favor.service';

// Modal panel for creating new borrows or favors.
// Supports multi-user selection: one entry is created per selected user.
@Component({
  selector: 'app-create-entry',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
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

  // Settle existing favors alongside the new entry.
  isSettleExpanded = false;
  settleableFavors: Favor[] = [];
  settleIds: string[] = [];
  isLoadingSettleable = false;

  constructor(
    private readonly borrowService: BorrowService,
    private readonly favorService: FavorService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Reset the form each time the panel is opened so stale values don't persist.
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
    return this.entryType === 'borrow' ? 'New borrow' : 'New favor';
  }

  get titleLabel(): string {
    return this.entryType === 'borrow' ? 'Item name' : 'Description';
  }

  get titlePlaceholder(): string {
    return this.entryType === 'borrow'
      ? 'e.g. Charger, Book, To-go cup'
      : 'e.g. Bought drinks, Covered shift';
  }

  get firstDirectionLabel(): string {
    return this.entryType === 'borrow' ? 'I lent it' : 'I did it';
  }

  get secondDirectionLabel(): string {
    return this.entryType === 'borrow' ? 'I borrowed it' : 'I owe it';
  }

  get selectedUsersSummary(): string {
    if (this.selectedUserIds.length === 0) {
      return 'Pick at least one person to continue.';
    }

    if (this.selectedUserIds.length === 1) {
      return `Selected: ${this.resolveUserName(this.selectedUserIds[0])}.`;
    }

    return `${this.selectedUserIds.length} people selected — one entry per person.`;
  }

  get summaryText(): string {
    if (this.selectedUserIds.length === 0) {
      return 'Select a person above to see a preview of what will be saved.';
    }

    const recipientLabel =
      this.selectedUserIds.length === 1
        ? this.resolveUserName(this.selectedUserIds[0])
        : `${this.selectedUserIds.length} people`;

    if (this.entryType === 'borrow') {
      return this.direction === 'outgoing'
        ? `${recipientLabel} borrowed from you — you are the lender.`
        : `You borrowed from ${recipientLabel} — they are the lender.`;
    }

    return this.direction === 'outgoing'
      ? `You did a favor for ${recipientLabel} — they owe you.`
      : `${recipientLabel} did a favor for you — you owe them.`;
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

    if (this.isSettleExpanded) {
      this.loadSettleableFavors();
    }
  }

  toggleSettleSection(): void {
    this.isSettleExpanded = !this.isSettleExpanded;
    if (this.isSettleExpanded) {
      this.loadSettleableFavors();
    }
  }

  toggleSettleId(favorId: string): void {
    if (this.settleIds.includes(favorId)) {
      this.settleIds = this.settleIds.filter((id) => id !== favorId);
    } else {
      this.settleIds = [...this.settleIds, favorId];
    }
  }

  isSettleSelected(favorId: string): boolean {
    return this.settleIds.includes(favorId);
  }

  getSettleLabel(favor: Favor): string {
    const counterpartyId =
      favor.creditorId === this.currentUserId ? favor.debtorId : favor.creditorId;
    const counterpartyName =
      this.users.find((u) => u.userId === counterpartyId)?.username ?? 'Unknown';
    const youDidIt = favor.creditorId === this.currentUserId;
    return youDidIt
      ? `You did: "${favor.description}" (owed by ${counterpartyName})`
      : `${counterpartyName} did: "${favor.description}" (you owe them)`;
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

    const createRequests = this.selectedUserIds.map((otherUserId) =>
      this.entryType === 'borrow'
        ? this.borrowService.createBorrow(this.buildBorrowPayload(otherUserId))
        : this.favorService.createFavor(this.buildFavorPayload(otherUserId)),
    );
    const settleRequests = this.settleIds.map((id) => this.favorService.settleFavor(id));
    const requests = [...createRequests, ...settleRequests];

    forkJoin(requests).subscribe({
      next: () => {
        this.isSaving = false;
        this.saved.emit();
      },
      error: () => {
        this.errorMessage = 'Could not save entry. Please check API and database connectivity.';
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
    this.isSettleExpanded = false;
    this.settleableFavors = [];
    this.settleIds = [];
    this.isLoadingSettleable = false;
  }

  private loadSettleableFavors(): void {
    this.isLoadingSettleable = true;
    this.settleableFavors = [];
    this.settleIds = [];

    this.favorService.getFavors().subscribe({
      next: (favors) => {
        this.settleableFavors = favors.filter((f) => {
          if (f.isSettled) {
            return false;
          }
          const counterpartyId =
            f.creditorId === this.currentUserId ? f.debtorId : f.creditorId;
          return this.selectedUserIds.includes(counterpartyId);
        });
        this.isLoadingSettleable = false;
      },
      error: () => {
        this.isLoadingSettleable = false;
      },
    });
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
