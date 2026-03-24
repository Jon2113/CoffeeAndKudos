import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs';

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
  otherUserId = '';
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
      Boolean(this.otherUserId) &&
      Boolean(this.createdOn) &&
      Boolean(this.title.trim())
    );
  }

  get modalTitle(): string {
    return this.entryType === 'borrow' ? 'Neuen Borrow anlegen' : 'Neuen Favor anlegen';
  }

  get titleLabel(): string {
    return this.entryType === 'borrow' ? 'Titel oder Gegenstand' : 'Beschreibung';
  }

  get titlePlaceholder(): string {
    return this.entryType === 'borrow'
      ? 'z. B. Buch, To-Go Becher, Ladekabel'
      : 'z. B. Kaffee ausgegeben';
  }

  get firstDirectionLabel(): string {
    return this.entryType === 'borrow' ? 'Ich habe verliehen' : 'Ich habe geholfen';
  }

  get secondDirectionLabel(): string {
    return this.entryType === 'borrow' ? 'Ich habe geliehen' : 'Ich bekomme einen Gefallen';
  }

  get summaryText(): string {
    const selectedName =
      this.users.find((user) => user.userId === this.otherUserId)?.username ?? 'die andere Person';

    if (this.entryType === 'borrow') {
      return this.direction === 'outgoing'
        ? `Der Borrow wird so gespeichert, dass ${selectedName} etwas von dir geliehen hat.`
        : `Der Borrow wird so gespeichert, dass du etwas von ${selectedName} geliehen hast.`;
    }

    return this.direction === 'outgoing'
      ? `Der Favor wird so gespeichert, dass ${selectedName} dir einen Gefallen schuldet.`
      : `Der Favor wird so gespeichert, dass du ${selectedName} etwas schuldig bist.`;
  }

  chooseType(type: EntryType): void {
    this.entryType = type;
    this.errorMessage = '';
  }

  chooseDirection(direction: EntryDirection): void {
    this.direction = direction;
    this.errorMessage = '';
  }

  saveEntry(): void {
    if (!this.canSave) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const request$: Observable<void> =
      this.entryType === 'borrow'
        ? this.borrowService.createBorrow(this.buildBorrowPayload())
        : this.favorService.createFavor(this.buildFavorPayload());

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.saved.emit();
      },
      error: () => {
        this.errorMessage =
          'Der Eintrag konnte nicht gespeichert werden. Bitte pruefe, ob die API laeuft und die Datenbank erreichbar ist.';
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

  private buildBorrowPayload(): CreateBorrowRequest {
    const isOutgoing = this.direction === 'outgoing';

    return {
      lenderId: isOutgoing ? this.currentUserId : this.otherUserId,
      borrowerId: isOutgoing ? this.otherUserId : this.currentUserId,
      itemName: this.title.trim(),
      dueDate: this.dueDate || null,
      returnedAt: null,
      createdAt: this.toIsoTimestamp(this.createdOn),
    };
  }

  private buildFavorPayload(): CreateFavorRequest {
    const isOutgoing = this.direction === 'outgoing';

    return {
      creditorId: isOutgoing ? this.currentUserId : this.otherUserId,
      debtorId: isOutgoing ? this.otherUserId : this.currentUserId,
      description: this.title.trim(),
      isSettled: false,
      createdAt: this.toIsoTimestamp(this.createdOn),
    };
  }

  private resetForm(): void {
    this.entryType = 'favor';
    this.direction = 'outgoing';
    this.title = '';
    this.otherUserId = this.selectedOtherUserId ?? '';
    this.createdOn = this.getTodayValue();
    this.dueDate = '';
    this.isSaving = false;
    this.errorMessage = '';
  }

  private getTodayValue(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private toIsoTimestamp(dateValue: string): string {
    return new Date(`${dateValue}T12:00:00`).toISOString();
  }
}
