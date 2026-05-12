import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

// Blocks navigation to protected routes when no valid JWT token is present.
// Returns a UrlTree to /login so Angular handles the redirect cleanly
// and the original URL is not added to the browser history.
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isLoggedIn() ? true : router.createUrlTree(['/login']);
};
