import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { timeout } from 'rxjs';

import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';

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
  newUsername = '';
  newEmail = '';
  createInfoMessage = '';
  createErrorMessage = '';
  errorMessage = '';
  private hardTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Avoid stale localStorage sessions blocking the login screen.
    // We always let the user reselect identity from the list.
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

  toggleCreatePanel(): void {
    this.isCreatePanelOpen = !this.isCreatePanelOpen;
    this.createErrorMessage = '';
    this.createInfoMessage = '';
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
          this.createInfoMessage = 'User created successfully. You can now select the new profile.';
          this.loadUsers(false);
          this.cdr.detectChanges();
        },
        error: () => {
          this.isCreatingUser = false;
          this.createErrorMessage =
            'The user could not be created. Please verify API and database connectivity.';
          this.cdr.detectChanges();
        },
      });
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
          'The request is taking too long. Please verify the frontend proxy and API are running.';
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
            'Timeout while loading users. Please check API, proxy, and database connectivity.';
        } else if (maybeHttpError?.status) {
          this.errorMessage = `User list could not be loaded (HTTP ${maybeHttpError.status}).`;
        } else {
          this.errorMessage =
            'User list could not be loaded. Please verify the API is running on http://localhost:5175.';
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
