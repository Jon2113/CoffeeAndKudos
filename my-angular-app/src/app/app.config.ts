import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

// Root application configuration used by bootstrapApplication in main.ts.
// Replaces the old AppModule providers (BrowserModule, HttpClientModule, RouterModule).
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
  ],
};
