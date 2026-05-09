import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfrastructureApiService } from '../../shared/services/infrastructure-api.service';
import { LogEntry, LogsResponse, LogsFilter } from '../../shared/models/infrastructure.model';
import { Subscription, interval, startWith, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto animate-enter h-[calc(100vh-2rem)] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Logs Temps Réel</h1>
          <p class="text-gray-600">vSphere, Docker & Kubernetes logs en direct</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span class="text-sm text-gray-600">Streaming actif</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <span class="text-sm font-medium text-gray-700">Filtrer par niveau:</span>
          <button
            (click)="toggleFilter('all')"
            [class.bg-gray-900]="activeFilter === 'all'"
            [class.text-white]="activeFilter === 'all'"
            [class.bg-gray-100]="activeFilter !== 'all'"
            [class.text-gray-700]="activeFilter !== 'all'"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            Tous
          </button>
          <button
            (click)="toggleFilter('info')"
            [class.bg-blue-600]="activeFilter === 'info'"
            [class.text-white]="activeFilter === 'info'"
            [class.bg-blue-100]="activeFilter !== 'info'"
            [class.text-blue-700]="activeFilter !== 'info'"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            Info
          </button>
          <button
            (click)="toggleFilter('warning')"
            [class.bg-amber-500]="activeFilter === 'warning'"
            [class.text-white]="activeFilter === 'warning'"
            [class.bg-amber-100]="activeFilter !== 'warning'"
            [class.text-amber-700]="activeFilter !== 'warning'"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            Warning
          </button>
          <button
            (click)="toggleFilter('error')"
            [class.bg-red-600]="activeFilter === 'error'"
            [class.text-white]="activeFilter === 'error'"
            [class.bg-red-100]="activeFilter !== 'error'"
            [class.text-red-700]="activeFilter !== 'error'"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            Error
          </button>
          <button
            (click)="toggleFilter('critical')"
            [class.bg-purple-600]="activeFilter === 'critical'"
            [class.text-white]="activeFilter === 'critical'"
            [class.bg-purple-100]="activeFilter !== 'critical'"
            [class.text-purple-700]="activeFilter !== 'critical'"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            Critical
          </button>
        </div>
      </div>

      <!-- Logs Container -->
      <div class="flex-1 bg-dark-900 rounded-2xl overflow-hidden shadow-lg flex flex-col">
        <!-- Logs Header -->
        <div class="bg-dark-800 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div class="flex items-center gap-6 text-sm">
            <span class="text-gray-400 w-20">Heure</span>
            <span class="text-gray-400 w-16">Niveau</span>
            <span class="text-gray-400 w-24">Source</span>
            <span class="text-gray-400 w-32">VM/Service</span>
            <span class="text-gray-400 flex-1">Message</span>
          </div>
          <button
            (click)="clearLogs()"
            class="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Effacer
          </button>
        </div>

        <!-- Logs List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
          <div
            *ngFor="let log of filteredLogs; let i = index"
            class="flex items-start gap-6 p-3 rounded-lg hover:bg-white/5 transition-colors animate-slide-up"
            [style.animation-delay]="i * 50 + 'ms'"
          >
            <!-- Timestamp -->
            <span class="text-gray-500 w-20 flex-shrink-0 text-xs">
              {{log.timestamp | date:'HH:mm:ss'}}
            </span>

            <!-- Level Badge -->
            <span
              class="w-16 flex-shrink-0 px-2 py-1 rounded text-xs font-medium text-center"
              [class.bg-blue-600]="log.level === 'info'"
              [class.bg-amber-500]="log.level === 'warning'"
              [class.bg-red-600]="log.level === 'error'"
              [class.text-white]="true"
            >
              {{log.level.toUpperCase()}}
            </span>

            <!-- Source -->
            <span class="text-primary-400 w-24 flex-shrink-0">
              {{log.source}}
            </span>

            <!-- VM Name -->
            <span class="text-purple-400 w-32 flex-shrink-0">
              {{log.vm_name || log.container_name || '-'}}
            </span>

            <!-- Message -->
            <span class="text-gray-300 flex-1 break-all">
              {{log.message}}
            </span>
          </div>

          <!-- Empty State -->
          <div *ngIf="filteredLogs.length === 0" class="text-center py-16">
            <p class="text-gray-500">Aucun log correspondant aux filtres</p>
          </div>
        </div>

        <!-- Logs Stats -->
        <div class="bg-dark-800 px-6 py-3 border-t border-gray-700 flex items-center justify-between text-sm">
          <div class="flex items-center gap-6 text-gray-400">
            <span>Total: <span class="text-white">{{logs.length}}</span></span>
            <span class="text-gray-400">Debug: {{getLogCount('debug')}}</span>
            <span class="text-blue-400">Info: {{getLogCount('info')}}</span>
            <span class="text-amber-400">Warning: {{getLogCount('warning')}}</span>
            <span class="text-red-400">Error: {{getLogCount('error')}}</span>
            <span class="text-purple-400">Critical: {{getLogCount('critical')}}</span>
          </div>
          <div class="flex items-center gap-2 text-gray-400">
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Collecte active...</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class LogsComponent implements OnInit, OnDestroy {
  logs: LogEntry[] = [];
  filteredLogs: LogEntry[] = [];
  activeFilter: 'all' | 'info' | 'warning' | 'error' | 'critical' | 'debug' = 'all';
  loading = false;
  hasMore = false;
  private subscriptions: Subscription[] = [];

  constructor(private infrastructureApi: InfrastructureApiService) {}

  ngOnInit(): void {
    this.loadLogs();
    this.startRealtimeUpdates();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadLogs(): void {
    this.loading = true;

    const filter: LogsFilter = {
      level: this.activeFilter === 'all' ? undefined : this.activeFilter,
      limit: 100
    };

    this.infrastructureApi.getLogs(filter)
      .pipe(
        catchError(() => of({ logs: [], total_count: 0, has_more: false } as LogsResponse))
      )
      .subscribe((response: LogsResponse) => {
        this.logs = response.logs;
        this.hasMore = response.has_more;
        this.filteredLogs = this.logs;
        this.loading = false;
      });
  }

  startRealtimeUpdates(): void {
    const logsSub = interval(5000).pipe(
      startWith(0),
      switchMap(() => {
        const filter: LogsFilter = {
          level: this.activeFilter === 'all' ? undefined : this.activeFilter,
          limit: 100
        };
        return this.infrastructureApi.getLogs(filter).pipe(
          catchError(() => of({ logs: [], total_count: 0, has_more: false } as LogsResponse))
        );
      })
    ).subscribe((response: LogsResponse) => {
      this.logs = response.logs;
      this.hasMore = response.has_more;
      this.filteredLogs = this.logs;
    });

    this.subscriptions.push(logsSub);
  }

  toggleFilter(filter: 'all' | 'info' | 'warning' | 'error' | 'critical' | 'debug'): void {
    this.activeFilter = filter;
    this.loadLogs();
  }

  getLogCount(level: 'info' | 'warning' | 'error' | 'critical' | 'debug'): number {
    return this.logs.filter(log => log.level === level).length;
  }

  clearLogs(): void {
    this.logs = [];
    this.filteredLogs = [];
  }

  getLevelClass(level: string): string {
    switch (level) {
      case 'debug': return 'bg-gray-600';
      case 'info': return 'bg-blue-600';
      case 'warning': return 'bg-amber-500';
      case 'error': return 'bg-red-600';
      case 'critical': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  }
}
