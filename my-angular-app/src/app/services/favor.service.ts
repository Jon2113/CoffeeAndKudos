import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { CreateFavorRequest, Favor } from '../models/favor.model';
import { CURRENT_USER_STORAGE_KEY } from './session.constants';

@Injectable({
  providedIn: 'root',
})
export class FavorService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Favors`;

  constructor(private readonly http: HttpClient) {}

  getFavors(otherUserId?: string): Observable<Favor[]> {
    return this.getCurrentUserId$().pipe(
      switchMap((currentUserId) =>
        this.http.get<Favor[]>(this.apiUrl).pipe(
          map((favors) =>
            favors
              .filter(
                (favor) =>
                  favor.creditorId === currentUserId || favor.debtorId === currentUserId,
              )
              .filter(
                (favor) =>
                  !otherUserId ||
                  (favor.creditorId === currentUserId && favor.debtorId === otherUserId) ||
                  (favor.debtorId === currentUserId && favor.creditorId === otherUserId),
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

  createFavor(payload: CreateFavorRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, payload);
  }

  updateFavor(
    favorId: string,
    changes: Partial<Pick<Favor, 'description' | 'createdAt'>>,
  ): Observable<void> {
    return this.http.get<Favor>(`${this.apiUrl}/${favorId}`).pipe(
      switchMap((favor) =>
        this.http.put<void>(this.apiUrl, {
          ...favor,
          ...changes,
        }),
      ),
    );
  }

  deleteFavor(favorId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${favorId}`);
  }

  settleFavor(favorId: string): Observable<void> {
    return this.http.get<Favor>(`${this.apiUrl}/${favorId}`).pipe(
      switchMap((favor) =>
        this.http.put<void>(this.apiUrl, {
          ...favor,
          isSettled: true,
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
