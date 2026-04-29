import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { UserService } from './user.service';

// Blocks navigation to protected routes when no user session is active.
// Returns a UrlTree to /login so Angular handles the redirect cleanly
// and the original URL is not added to the browser history.
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const userService = inject(UserService);

  return userService.getCurrentUserId() ? true : router.createUrlTree(['/login']);
};
