import { NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, timeout } from 'rxjs';

import { Borrow } from '../../models/borrow.model';
import { Favor } from '../../models/favor.model';
import { User } from '../../models/user.model';
import { BorrowService } from '../../services/borrow.service';
import { FavorService } from '../../services/favor.service';
import { UserService } from '../../services/user.service';

// Computed active-only metrics for a single user, shown on their profile card.
interface UserCardMetrics {
  countLent: number;
  favorsGiven: number;
}

// Login page: lists all users and lets the visitor pick an identity.
// Also handles user creation, inline editing, and deletion.
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, UpperCasePipe],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  users: User[] = [];
  // Keyed by userId; computed from live borrows/favors so values stay accurate.
  userMetrics = new Map<string, UserCardMetrics>();

  isLoading = true;
  isCreatePanelOpen = false;
  isCreatingUser = false;
  isSavingUserChanges = false;
  busyDeleteUserId = '';
  editingUserId = '';
  editUsername = '';
  editEmail = '';
  newUsername = '';
  newEmail = '';
  createInfoMessage = '';
  createErrorMessage = '';
  manageInfoMessage = '';
  manageErrorMessage = '';
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
    // Always clear any existing session so the user must explicitly reselect their identity.
    if (this.userService.getCurrentUserId()) {
      this.userService.logout();
    }

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.clearHardTimeout();
  }

  selectUser(userId: string): void {
    this.userService.login(userId);
    void this.router.navigate(['/dashboard']);
  }

  trackByUserId(_index: number, user: User): string {
    return user.userId;
  }

  // Returns live-computed metrics for a user card, falling back to zeros if not yet loaded.
  getMetrics(userId: string): UserCardMetrics {
    return this.userMetrics.get(userId) ?? { countLent: 0, favorsGiven: 0 };
  }

  get canCreateUser(): boolean {
    return (
      !this.isCreatingUser &&
      Boolean(this.newUsername.trim()) &&
      Boolean(this.newEmail.trim())
    );
  }

  get canSaveUserEdit(): boolean {
    return (
      !this.isSavingUserChanges &&
      Boolean(this.editingUserId) &&
      Boolean(this.editUsername.trim()) &&
      Boolean(this.editEmail.trim())
    );
  }

  toggleCreatePanel(): void {
    this.isCreatePanelOpen = !this.isCreatePanelOpen;
    this.createErrorMessage = '';
    this.createInfoMessage = '';
    this.manageErrorMessage = '';
    this.manageInfoMessage = '';
  }

  createUser(): void {
    if (!this.canCreateUser) {
      return;
    }

    this.isCreatingUser = true;
    this.createErrorMessage = '';
    this.createInfoMessage = '';

    this.userService
      .createUser({
        username: this.newUsername,
        email: this.newEmail,
      })
      .subscribe({
        next: () => {
          this.isCreatingUser = false;
          this.newUsername = '';
          this.newEmail = '';
          this.createInfoMessage = 'Profile created — select it below to open your dashboard.';
          this.manageErrorMessage = '';
          this.manageInfoMessage = '';
          this.loadUsers(false);
          this.cdr.detectChanges();
        },
        error: () => {
          this.isCreatingUser = false;
          this.createErrorMessage = 'Could not create profile. Please check API and database connectivity.';
          this.cdr.detectChanges();
        },
      });
  }

  startUserEdit(user: User): void {
    if (this.isSavingUserChanges || this.busyDeleteUserId) {
      return;
    }

    this.editingUserId = user.userId;
    this.editUsername = user.username;
    this.editEmail = user.email;
    this.manageErrorMessage = '';
    this.manageInfoMessage = '';
  }

  cancelUserEdit(): void {
    if (this.isSavingUserChanges) {
      return;
    }

    this.editingUserId = '';
    this.editUsername = '';
    this.editEmail = '';
  }

  saveUserEdit(user: User): void {
    if (!this.canSaveUserEdit || this.editingUserId !== user.userId) {
      return;
    }

    this.isSavingUserChanges = true;
    this.manageErrorMessage = '';
    this.manageInfoMessage = '';

    this.userService
      .updateUser({
        ...user,
        username: this.editUsername.trim(),
        email: this.editEmail.trim(),
      })
      .subscribe({
        next: () => {
          this.isSavingUserChanges = false;
          this.manageInfoMessage = 'Profile updated successfully.';
          this.manageErrorMessage = '';
          this.cancelUserEdit();
          this.loadUsers(false);
          this.cdr.detectChanges();
        },
        error: () => {
          this.isSavingUserChanges = false;
          this.manageErrorMessage = 'Could not update profile. Please check API and database connectivity.';
          this.cdr.detectChanges();
        },
      });
  }

  deleteUser(user: User): void {
    if (this.isSavingUserChanges || this.busyDeleteUserId) {
      return;
    }

    const isConfirmed = window.confirm(`Remove "${user.username}"? This cannot be undone.`);

    if (!isConfirmed) {
      return;
    }

    this.busyDeleteUserId = user.userId;
    this.manageErrorMessage = '';
    this.manageInfoMessage = '';

    this.userService.deleteUser(user.userId).subscribe({
      next: () => {
        this.busyDeleteUserId = '';
        if (this.editingUserId === user.userId) {
          this.cancelUserEdit();
        }
        this.manageInfoMessage = 'Profile removed.';
        this.manageErrorMessage = '';
        this.loadUsers(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.busyDeleteUserId = '';
        this.manageErrorMessage = 'Could not remove profile. Please check API and database connectivity.';
        this.cdr.detectChanges();
      },
    });
  }

  isEditingUser(userId: string): boolean {
    return this.editingUserId === userId;
  }

  private loadUsers(showLoadingState = true): void {
    this.clearHardTimeout();
    this.errorMessage = '';
    if (showLoadingState) {
      this.isLoading = true;
    }

    // Hard timeout as a last-resort guard in case the RxJS timeout fires too late.
    this.hardTimeoutHandle = setTimeout(() => {
      if (this.isLoading) {
        this.errorMessage =
          'This is taking longer than expected. Please check that the API and frontend proxy are running.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }, 12000);

    // Load users, borrows, and favors in parallel so we can compute accurate per-user metrics.
    forkJoin({
      users: this.userService.getUsers(),
      borrows: this.borrowService.getAllBorrows(),
      favors: this.favorService.getAllFavors(),
    })
      .pipe(timeout(10000))
      .subscribe({
        next: ({ users, borrows, favors }) => {
          this.clearHardTimeout();
          this.users = users;
          this.userMetrics = this.buildUserMetrics(users, borrows, favors);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.clearHardTimeout();
          const maybeHttpError = error as { status?: number; name?: string };
          if (maybeHttpError?.name === 'TimeoutError') {
            this.errorMessage = 'Request timed out — please check API, proxy, and database connectivity.';
          } else if (maybeHttpError?.status) {
            this.errorMessage = `Could not load profiles (HTTP ${maybeHttpError.status}).`;
          } else {
            this.errorMessage = 'Could not load profiles. Please check that the API is running.';
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // Computes active borrow/favor counts per user from live data so the login page
  // never shows stale DB-stored counter values.
  private buildUserMetrics(
    users: User[],
    borrows: Borrow[],
    favors: Favor[],
  ): Map<string, UserCardMetrics> {
    const metrics = new Map<string, UserCardMetrics>();

    for (const user of users) {
      const countLent = borrows.filter(
        (b) => !b.returnedAt && b.lenderId === user.userId,
      ).length;

      const favorsGiven = favors.filter(
        (f) => !f.isSettled && f.creditorId === user.userId,
      ).length;

      metrics.set(user.userId, { countLent, favorsGiven });
    }

    return metrics;
  }

  private clearHardTimeout(): void {
    if (this.hardTimeoutHandle) {
      clearTimeout(this.hardTimeoutHandle);
      this.hardTimeoutHandle = null;
    }
  }
}
