import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';

// Global page header — displays the current date and the app name.
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css'],
})
export class AppHeaderComponent {
  readonly today = new Date();
}
