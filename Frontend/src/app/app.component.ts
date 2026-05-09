import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="flex h-screen bg-gray-50">
      <app-sidebar></app-sidebar>
      <main class="flex-1 overflow-y-auto">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: []
})
export class AppComponent {
  title = 'eco-track-dashboard';
}
