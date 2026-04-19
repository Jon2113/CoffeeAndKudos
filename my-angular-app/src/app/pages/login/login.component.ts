import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { timeout } from 'rxjs';

import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';

// Login page: lists all users and lets the visitor pick an identity.
// Also handles user creation, inline editing, and deletion.
@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  users: User[] = [];
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

    const isConfirmed = window.confirm(
      `Remove "${user.username}"? This cannot be undone.`,
    );

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

    this.hardTimeoutHandle = setTimeout(() => {
      if (this.isLoading) {
        this.errorMessage =
          'This is taking longer than expected. Please check that the API and frontend proxy are running.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }, 12000);

    this.userService.getUsers().pipe(timeout(10000)).subscribe({
      next: (users) => {
        this.clearHardTimeout();
        this.users = users;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.clearHardTimeout();
        const maybeHttpError = error as { status?: number; name?: string };
        if (maybeHttpError?.name === 'TimeoutError') {
          this.errorMessage =
            'Request timed out — please check API, proxy, and database connectivity.';
        } else if (maybeHttpError?.status) {
          this.errorMessage = `Could not load profiles (HTTP ${maybeHttpError.status}).`;
        } else {
          this.errorMessage =
            'Could not load profiles. Please check that the API is running.';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private clearHardTimeout(): void {
    if (this.hardTimeoutHandle) {
      clearTimeout(this.hardTimeoutHandle);
      this.hardTimeoutHandle = null;
    }
  }
}
