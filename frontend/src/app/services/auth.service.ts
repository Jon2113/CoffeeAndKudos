import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { CURRENT_USER_STORAGE_KEY, JWT_TOKEN_KEY } from './session.constants';

export interface LoginResponse {
  token: string;
  userId: string;
  username: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Auth`;

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem(JWT_TOKEN_KEY, res.token);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, res.userId);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(JWT_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(JWT_TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
