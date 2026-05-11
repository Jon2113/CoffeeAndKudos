import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppHeaderComponent } from './components/app-header/app-header.component';

// Root shell — renders the global header above every routed page.
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppHeaderComponent],
  template: `
    <app-header></app-header>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {}
