import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { Borrow, CreateBorrowRequest } from '../models/borrow.model';
import { CURRENT_USER_STORAGE_KEY } from './session.constants';

@Injectable({
  providedIn: 'root',
})
export class BorrowService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Borrows`;

  constructor(private readonly http: HttpClient) {}

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
