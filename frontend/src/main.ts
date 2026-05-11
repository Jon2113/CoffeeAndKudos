import 'zone.js';

import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Entry point — bootstraps the root component with the application config.
bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
