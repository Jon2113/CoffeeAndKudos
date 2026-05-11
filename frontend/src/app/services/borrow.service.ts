import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { Borrow, CreateBorrowRequest } from '../models/borrow.model';
import { CURRENT_USER_STORAGE_KEY } from './session.constants';

// Manages borrow CRUD. Filtering to the current user happens client-side since the API
// returns all borrows; this avoids a server-side query parameter dependency.
@Injectable({
  providedIn: 'root',
})
export class BorrowService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Borrows`;

  constructor(private readonly http: HttpClient) {}

  // Returns every borrow in the system without user filtering — used by the login page
  // to compute per-user counters before a session has been established.
  getAllBorrows(): Observable<Borrow[]> {
    return this.http.get<Borrow[]>(this.apiUrl);
  }

  // Fetches all borrows, then filters to those involving the current user.
  // Pass otherUserId to further restrict to a specific pair (1-on-1 view).
  getBorrows(otherUserId?: string): Observable<Borrow[]> {
    return this.getCurrentUserId$().pipe(
      switchMap((currentUserId) =>
        this.http.get<Borrow[]>(this.apiUrl).pipe(
          map((borrows) =>
            borrows
              .filter(
                (borrow) =>
                  borrow.lenderId === currentUserId || borrow.borrowerId === currentUserId,
              )
              .filter(
                (borrow) =>
                  !otherUserId ||
                  (borrow.lenderId === currentUserId && borrow.borrowerId === otherUserId) ||
                  (borrow.borrowerId === currentUserId && borrow.lenderId === otherUserId),
              )
              .sort(
                (left, right) =>
                  new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
              ),
          ),
        ),
      ),
    );
  }

  createBorrow(payload: CreateBorrowRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, payload);
  }

  updateBorrow(
    borrowId: string,
    changes: Partial<Pick<Borrow, 'itemName' | 'createdAt' | 'dueDate'>>,
  ): Observable<void> {
    return this.http.get<Borrow>(`${this.apiUrl}/${borrowId}`).pipe(
      switchMap((borrow) =>
        this.http.put<void>(this.apiUrl, {
          ...borrow,
          ...changes,
        }),
      ),
    );
  }

  deleteBorrow(borrowId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${borrowId}`);
  }

  // Marks a borrow as returned by setting returnedAt to now.
  returnBorrow(borrowId: string): Observable<void> {
    return this.http.get<Borrow>(`${this.apiUrl}/${borrowId}`).pipe(
      switchMap((borrow) =>
        this.http.put<void>(this.apiUrl, {
          ...borrow,
          returnedAt: new Date().toISOString(),
        }),
      ),
    );
  }

  private getCurrentUserId$(): Observable<string> {
    const currentUserId = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    return currentUserId
      ? of(currentUserId)
      : throwError(() => new Error('No current user selected.'));
  }
}
