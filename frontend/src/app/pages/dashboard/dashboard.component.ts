import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, timeout } from 'rxjs';

import { ActivityLogComponent } from '../../components/activity-log/activity-log.component';
import { CreateEntryComponent } from '../../components/create-entry/create-entry.component';
import { ScaleComponent } from '../../components/scale/scale.component';
import { Borrow } from '../../models/borrow.model';
import { ActivityEntry, EntryDirection, ScaleFilterKey, ScaleStats } from '../../models/dashboard.model';
import { Favor } from '../../models/favor.model';
import { User } from '../../models/user.model';
import { BorrowService } from '../../services/borrow.service';
import { FavorService } from '../../services/favor.service';
import { UserService } from '../../services/user.service';

// Main dashboard page: loads the current user's borrows/favors, computes scale stats,
// and coordinates the scale card, activity log, and create-entry composer components.
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, ScaleComponent, ActivityLogComponent, CreateEntryComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Used to detect when all 4 cards are selected so we treat that as "no filter".
  private static readonly ALL_SCALE_FILTERS: ScaleFilterKey[] = [
    'countLent',
    'countBorrowed',
    'favorsGiven',
    'favorsTaken',
  ];

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
  activeScaleFilters: ScaleFilterKey[] = [];
  errorMessage = '';
  private hardTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly userService: UserService,
    private readonly borrowService: BorrowService,
    private readonly favorService: FavorService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
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
      ? `Showing only the history between you and ${this.selectedOtherUserName}.`
      : 'Your complete overview — every borrow and favor connected to you.';
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

  onScaleFilterSelected(filterKey: ScaleFilterKey): void {
    const currentlyActive = this.activeScaleFilters.includes(filterKey);
    const nextFilters = currentlyActive
      ? this.activeScaleFilters.filter((entry) => entry !== filterKey)
      : [...this.activeScaleFilters, filterKey];

    // Selecting all 4 cards is equivalent to selecting none — clear to avoid confusion.
    this.activeScaleFilters =
      nextFilters.length === DashboardComponent.ALL_SCALE_FILTERS.length ? [] : nextFilters;
  }

  clearScaleFilter(): void {
    this.activeScaleFilters = [];
  }

  switchUser(): void {
    this.userService.logout();
    void this.router.navigate(['/login']);
  }

  refreshDashboard(): void {
    if (!this.currentUserId) {
      return;
    }

    this.clearHardTimeout();
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    // Hard timeout as a last-resort guard; the RxJS timeout(10000) below fires first.
    this.hardTimeoutHandle = setTimeout(() => {
      if (this.isLoading) {
        this.errorMessage =
          'Dashboard timeout: please check API, database, or stuck borrow/favor requests.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }, 12000);

    forkJoin({
      users: this.userService.getUsers(),
      currentUser: this.userService.getCurrentUser(),
      borrows: this.borrowService.getBorrows(this.selectedOtherUserId || undefined),
      favors: this.favorService.getFavors(this.selectedOtherUserId || undefined),
    })
      .pipe(timeout(10000))
      .subscribe({
        next: ({ users, currentUser, borrows, favors }) => {
          this.clearHardTimeout();
          this.users = users;
          this.currentUser = currentUser;
          this.otherUsers = users.filter((user) => user.userId !== this.currentUserId);

          // Validate the selected filter — the user may have been deleted since the last load.
          const validFilter = this.otherUsers.some(
            (user) => user.userId === this.selectedOtherUserId,
          )
            ? this.selectedOtherUserId
            : '';

          if (this.selectedOtherUserId && !validFilter) {
            this.selectedOtherUserId = '';
          }

          // Always compute from live data so counters stay accurate after returns/settles.
          this.scaleStats = validFilter
            ? this.userService.build1on1Scales(this.currentUserId, validFilter, borrows, favors)
            : this.userService.buildGlobalScales(this.currentUserId, borrows, favors);

          this.activityEntries = this.buildActivityEntries(borrows, favors, users);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.clearHardTimeout();
          const maybeHttpError = error as { status?: number; name?: string };
          if (maybeHttpError?.name === 'TimeoutError') {
            this.errorMessage = 'Request timed out — at least one API call did not respond in time.';
          } else if (maybeHttpError?.status) {
            this.errorMessage = `Could not load dashboard (HTTP ${maybeHttpError.status}).`;
          } else {
            this.errorMessage = 'Could not load dashboard. Please check the API, database, and proxy.';
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  ngOnDestroy(): void {
    this.clearHardTimeout();
  }

  // Merges borrows and favors into a unified ActivityEntry list, sorted newest-first.
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
      const direction: EntryDirection = isOutgoing ? 'outgoing' : 'incoming';

      return {
        id: borrow.borrowId,
        type: 'borrow' as const,
        direction,
        title: borrow.itemName,
        counterpartyName: userLookup.get(counterpartyId) ?? 'Unknown user',
        createdAt: borrow.createdAt,
        dueDate: borrow.dueDate,
        isCompleted: Boolean(borrow.returnedAt),
        statusText: borrow.returnedAt
          ? `Returned on ${this.formatDate(borrow.returnedAt)}`
          : borrow.dueDate
            ? `Due on ${this.formatDate(borrow.dueDate)}`
            : 'Open',
        directionText: isOutgoing ? 'You lent this' : 'You borrowed this',
        actionText: 'Mark as returned',
        accent: 'borrow' as const,
      };
    });

    const favorEntries = favors.map((favor) => {
      const counterpartyId =
        favor.creditorId === this.currentUserId ? favor.debtorId : favor.creditorId;
      const isOutgoing = favor.creditorId === this.currentUserId;
      const direction: EntryDirection = isOutgoing ? 'outgoing' : 'incoming';

      return {
        id: favor.favorId,
        type: 'favor' as const,
        direction,
        title: favor.description,
        counterpartyName: userLookup.get(counterpartyId) ?? 'Unknown user',
        createdAt: favor.createdAt,
        dueDate: null,
        isCompleted: favor.isSettled,
        statusText: favor.isSettled ? 'Settled' : 'Open',
        directionText: isOutgoing ? 'You did this favor' : 'You received this favor',
        actionText: 'Mark as settled',
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
      : new Intl.DateTimeFormat('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(date);
  }

  private clearHardTimeout(): void {
    if (this.hardTimeoutHandle) {
      clearTimeout(this.hardTimeoutHandle);
      this.hardTimeoutHandle = null;
    }
  }
}
