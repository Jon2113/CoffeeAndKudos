import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { Borrow } from '../models/borrow.model';
import { ScaleStats } from '../models/dashboard.model';
import { Favor } from '../models/favor.model';
import { User } from '../models/user.model';
import { BorrowService } from './borrow.service';
import { FavorService } from './favor.service';
import { CURRENT_USER_STORAGE_KEY } from './session.constants';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = `${environment.apiBaseUrl}/User`;

  constructor(
    private readonly http: HttpClient,
    private readonly borrowService: BorrowService,
    private readonly favorService: FavorService,
  ) {}

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

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  getCurrentUser(): Observable<User> {
    const currentUserId = this.getCurrentUserId();

    return currentUserId
      ? this.getUserById(currentUserId)
      : throwError(() => new Error('No current user selected.'));
  }

  getGlobalScales(): Observable<ScaleStats> {
    return this.getCurrentUser().pipe(map((user) => this.mapUserToScaleStats(user)));
  }

  get1on1Scales(otherUserId: string): Observable<ScaleStats> {
    const currentUserId = this.getCurrentUserId();

    if (!currentUserId) {
      return throwError(() => new Error('No current user selected.'));
    }

    return forkJoin({
      borrows: this.borrowService.getBorrows(otherUserId),
      favors: this.favorService.getFavors(otherUserId),
    }).pipe(
      map(({ borrows, favors }) =>
        this.build1on1Scales(currentUserId, otherUserId, borrows, favors),
      ),
    );
  }

  mapUserToScaleStats(user: User): ScaleStats {
    return {
      countLent: user.countLent,
      countBorrowed: user.countBorrowed,
      favorsGiven: user.favorsGiven,
      favorsTaken: user.favorsTaken,
    };
  }

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
