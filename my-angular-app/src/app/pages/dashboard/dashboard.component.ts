import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Borrow } from '../../models/borrow.model';
import { ActivityEntry, ScaleStats } from '../../models/dashboard.model';
import { Favor } from '../../models/favor.model';
import { User } from '../../models/user.model';
import { BorrowService } from '../../services/borrow.service';
import { FavorService } from '../../services/favor.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  currentUserId = '';
  currentUser: User | null = null;
  users: User[] = [];
  otherUsers: User[] = [];
  selectedOtherUserId = '';
  activityEntries: ActivityEntry[] = [];
  scaleStats: ScaleStats = {
    countLent: 0,
    countBorrowed: 0,
    favorsGiven: 0,
    favorsTaken: 0,
  };
  isLoading = true;
  isComposerOpen = false;
  errorMessage = '';

  constructor(
    private readonly userService: UserService,
    private readonly borrowService: BorrowService,
    private readonly favorService: FavorService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const currentUserId = this.userService.getCurrentUserId();

    if (!currentUserId) {
      void this.router.navigate(['/login']);
      return;
    }

    this.currentUserId = currentUserId;
    this.refreshDashboard();
  }

  get selectedOtherUserName(): string {
    return this.otherUsers.find((user) => user.userId === this.selectedOtherUserId)?.username ?? '';
  }

  get viewDescription(): string {
    return this.selectedOtherUserName
      ? `1-on-1 Ansicht mit ${this.selectedOtherUserName}. Die Stat-Scale zeigt nur eure direkte Beziehung.`
      : 'Globale Ansicht ueber alle Borrows und Favors, die deine Person aktuell betreffen.';
  }

  onFilterChange(otherUserId: string): void {
    this.selectedOtherUserId = otherUserId;
    this.refreshDashboard();
  }

  openComposer(): void {
    this.isComposerOpen = true;
  }

  closeComposer(): void {
    this.isComposerOpen = false;
  }

  handleEntrySaved(): void {
    this.isComposerOpen = false;
    this.refreshDashboard();
  }

  switchUser(): void {
    this.userService.logout();
    void this.router.navigate(['/login']);
  }

  refreshDashboard(): void {
    if (!this.currentUserId) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      users: this.userService.getUsers(),
      currentUser: this.userService.getCurrentUser(),
      borrows: this.borrowService.getBorrows(this.selectedOtherUserId || undefined),
      favors: this.favorService.getFavors(this.selectedOtherUserId || undefined),
    }).subscribe({
      next: ({ users, currentUser, borrows, favors }) => {
        this.users = users;
        this.currentUser = currentUser;
        this.otherUsers = users.filter((user) => user.userId !== this.currentUserId);

        const validFilter = this.otherUsers.some(
          (user) => user.userId === this.selectedOtherUserId,
        )
          ? this.selectedOtherUserId
          : '';

        if (this.selectedOtherUserId && !validFilter) {
          this.selectedOtherUserId = '';
        }

        this.scaleStats = validFilter
          ? this.userService.build1on1Scales(this.currentUserId, validFilter, borrows, favors)
          : this.userService.mapUserToScaleStats(currentUser);

        this.activityEntries = this.buildActivityEntries(borrows, favors, users);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage =
          'Das Dashboard konnte nicht geladen werden. Bitte pruefe API, Datenbank und den Proxy in Angular.';
        this.isLoading = false;
      },
    });
  }

  private buildActivityEntries(
    borrows: Borrow[],
    favors: Favor[],
    users: User[],
  ): ActivityEntry[] {
    const userLookup = new Map(users.map((user) => [user.userId, user.username]));

    const borrowEntries = borrows.map((borrow) => {
      const counterpartyId =
        borrow.lenderId === this.currentUserId ? borrow.borrowerId : borrow.lenderId;
      const isOutgoing = borrow.lenderId === this.currentUserId;

      return {
        id: borrow.borrowId,
        type: 'borrow' as const,
        title: borrow.itemName,
        counterpartyName: userLookup.get(counterpartyId) ?? 'Unbekannte Person',
        createdAt: borrow.createdAt,
        dueDate: borrow.dueDate,
        isCompleted: Boolean(borrow.returnedAt),
        statusText: borrow.returnedAt
          ? `Zurueckgegeben am ${this.formatDate(borrow.returnedAt)}`
          : borrow.dueDate
            ? `Faellig am ${this.formatDate(borrow.dueDate)}`
            : 'Noch offen',
        directionText: isOutgoing ? 'Du hast verliehen' : 'Du hast geliehen',
        actionText: 'Rueckgabe markieren',
        accent: 'borrow' as const,
      };
    });

    const favorEntries = favors.map((favor) => {
      const counterpartyId =
        favor.creditorId === this.currentUserId ? favor.debtorId : favor.creditorId;
      const isOutgoing = favor.creditorId === this.currentUserId;

      return {
        id: favor.favorId,
        type: 'favor' as const,
        title: favor.description,
        counterpartyName: userLookup.get(counterpartyId) ?? 'Unbekannte Person',
        createdAt: favor.createdAt,
        dueDate: null,
        isCompleted: favor.isSettled,
        statusText: favor.isSettled ? 'Bereits ausgeglichen' : 'Noch offen',
        directionText: isOutgoing
          ? 'Du hast einen Gefallen gegeben'
          : 'Du hast einen Gefallen erhalten',
        actionText: 'Als erledigt markieren',
        accent: 'favor' as const,
      };
    });

    return [...borrowEntries, ...favorEntries].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('de-DE', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(date);
  }
}
