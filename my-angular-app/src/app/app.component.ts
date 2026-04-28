import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Root shell — just hosts the router outlet. All page logic lives in child components.
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {}
