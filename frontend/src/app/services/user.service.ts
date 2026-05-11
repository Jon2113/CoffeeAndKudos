import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { Borrow } from '../models/borrow.model';
import { ScaleStats } from '../models/dashboard.model';
import { Favor } from '../models/favor.model';
import { User } from '../models/user.model';
import { CURRENT_USER_STORAGE_KEY } from './session.constants';

// Handles user auth (session storage), user CRUD, and scale stat calculations.
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = `${environment.apiBaseUrl}/User`;

  constructor(private readonly http: HttpClient) {}

  login(userId: string): void {
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, userId);
  }

  logout(): void {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  }

  getCurrentUserId(): string | null {
    return localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // Counter fields are initialised to 0; the dashboard recomputes them live from borrows/favors.
  createUser(payload: { username: string; email: string }): Observable<void> {
    return this.http.post<void>(this.apiUrl, {
      userId: crypto.randomUUID(),
      username: payload.username.trim(),
      email: payload.email.trim(),
      createdAt: new Date().toISOString(),
      countLent: 0,
      countBorrowed: 0,
      favorsGiven: 0,
      favorsTaken: 0,
    });
  }

  updateUser(user: User): Observable<void> {
    return this.http.put<void>(this.apiUrl, {
      ...user,
      username: user.username.trim(),
      email: user.email.trim(),
    });
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  getCurrentUser(): Observable<User> {
    const currentUserId = this.getCurrentUserId();

    return currentUserId
      ? this.getUserById(currentUserId)
      : throwError(() => new Error('No current user selected.'));
  }

  // Computes global scale stats from live borrow/favor arrays (no DB-stored counters).
  // Only counts items that are not yet returned/settled (i.e. still active).
  buildGlobalScales(currentUserId: string, borrows: Borrow[], favors: Favor[]): ScaleStats {
    const activeBorrows = borrows.filter((b) => !b.returnedAt);
    const activeFavors = favors.filter((f) => !f.isSettled);

    return {
      countLent: activeBorrows.filter((b) => b.lenderId === currentUserId).length,
      countBorrowed: activeBorrows.filter((b) => b.borrowerId === currentUserId).length,
      favorsGiven: activeFavors.filter((f) => f.creditorId === currentUserId).length,
      favorsTaken: activeFavors.filter((f) => f.debtorId === currentUserId).length,
    };
  }

  // Computes scale stats scoped to two specific users from already-fetched borrow/favor arrays.
  build1on1Scales(
    currentUserId: string,
    otherUserId: string,
    borrows: Borrow[],
    favors: Favor[],
  ): ScaleStats {
    const activeBorrows = borrows.filter(
      (borrow) =>
        !borrow.returnedAt &&
        ((borrow.lenderId === currentUserId && borrow.borrowerId === otherUserId) ||
          (borrow.borrowerId === currentUserId && borrow.lenderId === otherUserId)),
    );

    const activeFavors = favors.filter(
      (favor) =>
        !favor.isSettled &&
        ((favor.creditorId === currentUserId && favor.debtorId === otherUserId) ||
          (favor.debtorId === currentUserId && favor.creditorId === otherUserId)),
    );

    return {
      countLent: activeBorrows.filter((borrow) => borrow.lenderId === currentUserId).length,
      countBorrowed: activeBorrows.filter((borrow) => borrow.borrowerId === currentUserId).length,
      favorsGiven: activeFavors.filter((favor) => favor.creditorId === currentUserId).length,
      favorsTaken: activeFavors.filter((favor) => favor.debtorId === currentUserId).length,
    };
  }
}
