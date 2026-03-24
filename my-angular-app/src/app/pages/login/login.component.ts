import { Component, OnDestroy, OnInit } from '@angular/core';
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
  errorMessage = '';
  private hardTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly userService: UserService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    // Avoid stale localStorage sessions blocking the login screen.
    // We always let the user reselect identity from the list.
    if (this.userService.getCurrentUserId()) {
      this.userService.logout();
    }

    this.hardTimeoutHandle = setTimeout(() => {
      if (this.isLoading) {
        this.errorMessage =
          'Die Anfrage dauert zu lange. Bitte pruefe, ob Frontend-Proxy und API wirklich laufen.';
        this.isLoading = false;
      }
    }, 12000);

    this.userService.getUsers().pipe(timeout(10000)).subscribe({
      next: (users) => {
        this.clearHardTimeout();
        this.users = users;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.clearHardTimeout();
        const maybeHttpError = error as { status?: number; name?: string };
        if (maybeHttpError?.name === 'TimeoutError') {
          this.errorMessage =
            'Timeout beim Laden der User-Liste. Bitte pruefe API, Proxy und Datenbankverbindung.';
        } else if (maybeHttpError?.status) {
          this.errorMessage = `Die User-Liste konnte nicht geladen werden (HTTP ${maybeHttpError.status}).`;
        } else {
          this.errorMessage =
            'Die User-Liste konnte nicht geladen werden. Bitte pruefe, ob die API unter http://localhost:5175 laeuft.';
        }
        this.isLoading = false;
      },
    });
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

  private clearHardTimeout(): void {
    if (this.hardTimeoutHandle) {
      clearTimeout(this.hardTimeoutHandle);
      this.hardTimeoutHandle = null;
    }
  }
}
