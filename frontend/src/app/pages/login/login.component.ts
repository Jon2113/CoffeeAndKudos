import { UpperCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

// Login page: email+password sign-in form plus user management (create, edit, delete).
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, UpperCasePipe, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  users: User[] = [];

  // Sign-in form with email and password.
  readonly signInForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  isSigningIn = false;
  signInError = '';

  // Reactive form for creating a new user profile.
  readonly createForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  isLoading = true;
  isCreatePanelOpen = false;
  isCreatingUser = false;
  isSavingUserChanges = false;
  busyDeleteUserId = '';
  pendingDeleteUserId = '';
  editingUserId = '';
  editUsername = '';
  editEmail = '';
  errorMessage = '';
  private hardTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Always clear any existing session so the user must explicitly sign in again.
    if (this.authService.isLoggedIn()) {
      this.authService.logout();
    }

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.clearHardTimeout();
  }

  signIn(): void {
    if (this.isSigningIn || this.signInForm.invalid) return;

    this.isSigningIn = true;
    this.signInError = '';

    const { email, password } = this.signInForm.value;
    this.authService.login(email ?? '', password ?? '').subscribe({
      next: () => {
        this.isSigningIn = false;
        void this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isSigningIn = false;
        this.signInError = 'Invalid email or password.';
        this.cdr.detectChanges();
      },
    });
  }

  trackByUserId(_index: number, user: User): string {
    return user.userId;
  }

  get canCreateUser(): boolean {
    return !this.isCreatingUser && this.createForm.valid;
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
    if (!this.isCreatePanelOpen) {
      this.createForm.reset();
    }
  }

  createUser(): void {
    if (!this.canCreateUser) {
      return;
    }

    this.isCreatingUser = true;

    const { username, email } = this.createForm.value;

    this.userService
      .createUser({ username: username ?? '', email: email ?? '' })
      .subscribe({
        next: () => {
          this.isCreatingUser = false;
          this.createForm.reset();
          this.snackBar.open('Profile created successfully.', 'Close', { duration: 3000 });
          this.loadUsers(false);
          this.cdr.detectChanges();
        },
        error: () => {
          this.isCreatingUser = false;
          this.snackBar.open('Could not create profile. Please check API and database connectivity.', 'Close', { duration: 4000 });
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

    this.userService
      .updateUser({
        ...user,
        username: this.editUsername.trim(),
        email: this.editEmail.trim(),
      })
      .subscribe({
        next: () => {
          this.isSavingUserChanges = false;
          this.snackBar.open('Profile updated successfully.', 'Close', { duration: 3000 });
          this.cancelUserEdit();
          this.loadUsers(false);
          this.cdr.detectChanges();
        },
        error: () => {
          this.isSavingUserChanges = false;
          this.snackBar.open('Could not update profile. Please check API and database connectivity.', 'Close', { duration: 4000 });
          this.cdr.detectChanges();
        },
      });
  }

  deleteUser(user: User): void {
    if (this.isSavingUserChanges || this.busyDeleteUserId) {
      return;
    }
    this.pendingDeleteUserId = user.userId;
  }

  confirmDeleteUser(user: User): void {
    if (this.isSavingUserChanges || this.busyDeleteUserId) {
      return;
    }

    this.busyDeleteUserId = user.userId;
    this.pendingDeleteUserId = '';

    this.userService.deleteUser(user.userId).subscribe({
      next: () => {
        this.busyDeleteUserId = '';
        if (this.editingUserId === user.userId) {
          this.cancelUserEdit();
        }
        this.snackBar.open('Profile removed.', 'Close', { duration: 3000 });
        this.loadUsers(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.busyDeleteUserId = '';
        this.snackBar.open('Could not remove profile. Please check API and database connectivity.', 'Close', { duration: 4000 });
        this.cdr.detectChanges();
      },
    });
  }

  cancelDeleteUser(): void {
    this.pendingDeleteUserId = '';
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

    this.userService
      .getUsers()
      .subscribe({
        next: (users) => {
          this.clearHardTimeout();
          this.users = users;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.clearHardTimeout();
          const maybeHttpError = error as { status?: number; name?: string };
          if (maybeHttpError?.status) {
            this.errorMessage = `Could not load profiles (HTTP ${maybeHttpError.status}).`;
          } else {
            this.errorMessage = 'Could not load profiles. Please check that the API is running.';
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
