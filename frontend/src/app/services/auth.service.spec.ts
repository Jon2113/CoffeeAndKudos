import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { JWT_TOKEN_KEY, CURRENT_USER_STORAGE_KEY } from './session.constants';
import { AuthService, LoginResponse } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store token and userId in localStorage after successful login', () => {
    const mockResponse: LoginResponse = {
      token: 'fake-jwt-token',
      userId: 'user-123',
      username: 'admin',
      role: 'admin',
    };

    service.login('admin@coffeeandkudos.com', 'Admin123!').subscribe();

    const req = httpMock.expectOne('/api/Auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@coffeeandkudos.com', password: 'Admin123!' });
    req.flush(mockResponse);

    expect(localStorage.getItem(JWT_TOKEN_KEY)).toBe('fake-jwt-token');
    expect(localStorage.getItem(CURRENT_USER_STORAGE_KEY)).toBe('user-123');
  });

  it('should return the stored token from getToken()', () => {
    expect(service.getToken()).toBeNull();
    localStorage.setItem(JWT_TOKEN_KEY, 'my-token');
    expect(service.getToken()).toBe('my-token');
  });

  it('should return true from isLoggedIn() when a token is stored', () => {
    expect(service.isLoggedIn()).toBe(false);
    localStorage.setItem(JWT_TOKEN_KEY, 'my-token');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should remove token and userId from localStorage on logout', () => {
    localStorage.setItem(JWT_TOKEN_KEY, 'my-token');
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, 'user-123');

    service.logout();

    expect(localStorage.getItem(JWT_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(CURRENT_USER_STORAGE_KEY)).toBeNull();
  });
});
