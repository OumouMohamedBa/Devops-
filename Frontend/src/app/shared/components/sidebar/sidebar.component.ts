import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="w-72 bg-dark-900 text-white h-screen flex flex-col border-r border-gray-800">
      <!-- Logo -->
      <div class="p-6 border-b border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
            </svg>
          </div>
          <div>
            <h1 class="font-bold text-lg">EcoTrack</h1>
            <p class="text-xs text-gray-400">Carbon Intelligence</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <!-- Client Section -->
        <div class="mb-6">
          <p class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Client</p>
          <a routerLink="/client" routerLinkActive="active" class="nav-item">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <span>Explorer Produits</span>
          </a>
        </div>

        <!-- Admin Section -->
        <div class="mb-6">
          <p class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Administration</p>
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
            <span>Dashboard</span>
          </a>
          <a routerLink="/admin/infrastructure" routerLinkActive="active" class="nav-item">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 01-2 2v4a2 2 0 012 2h14a2 2 0 012-2v-4a2 2 0 01-2-2m-2-4h.01M17 16h.01"/>
            </svg>
            <span>Infrastructure</span>
          </a>
          <a routerLink="/admin/logs" routerLinkActive="active" class="nav-item">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Logs Temps Réel</span>
          </a>
        </div>
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
            A
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">Admin User</p>
            <p class="text-xs text-gray-500 truncate">admin&#64;ecotrack.io</p>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .nav-item {
      @apply flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-200;
    }
    .nav-item.active {
      @apply bg-primary-600/20 text-primary-400 font-medium border border-primary-600/30;
    }
  `]
})
export class SidebarComponent {}
