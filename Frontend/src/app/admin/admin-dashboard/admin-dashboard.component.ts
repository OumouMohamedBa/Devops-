import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InfrastructureApiService } from '../../shared/services/infrastructure-api.service';
import { InfrastructureStatusResponse, VMInstance, VMStatusResponse } from '../../shared/models/infrastructure.model';
import { Subscription, finalize, catchError, of, interval, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-8 max-w-7xl mx-auto animate-enter">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Tableau de Bord Infrastructure</h1>
          <p class="text-gray-600 mt-1">Monitoring vSphere & Empreinte Carbone</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span class="text-sm text-gray-600">Temps réel</span>
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total VMs -->
        <div class="metric-card">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 01-2 2v4a2 2 0 012 2h14a2 2 0 012-2v-4a2 2 0 01-2-2m-2-4h.01M17 16h.01"/>
              </svg>
            </div>
            <span class="status-badge status-online" *ngIf="status?.summary?.running_vms === status?.summary?.total_vms">
              {{status?.summary?.running_vms || 0}}/{{status?.summary?.total_vms || 0}} Active
            </span>
            <span class="status-badge status-warning" *ngIf="status?.summary?.running_vms !== status?.summary?.total_vms">
              {{status?.summary?.running_vms || 0}}/{{status?.summary?.total_vms || 0}} Active
            </span>
          </div>
          <p class="text-sm text-gray-600 mb-1">Machines Virtuelles</p>
          <p class="text-3xl font-bold text-gray-900">{{(status?.summary?.total_vms || 0)}}</p>
        </div>

        <!-- Power Consumption -->
        <div class="metric-card">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
          </div>
          <p class="text-sm text-gray-600 mb-1">Consommation Électrique</p>
          <p class="text-3xl font-bold text-gray-900">{{(status?.energy?.total_power_consumption_watts || 0) | number:'1.0-0'}} <span class="text-lg font-normal text-gray-500">W</span></p>
        </div>

        <!-- Carbon Intensity -->
        <div class="metric-card">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
              </svg>
            </div>
            <span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
              EU Grid
            </span>
          </div>
          <p class="text-sm text-gray-600 mb-1">Intensité Carbone</p>
          <p class="text-3xl font-bold text-gray-900">{{(status?.energy?.average_carbon_intensity_g_per_kwh || 0)}} <span class="text-lg font-normal text-gray-500">gCO2/kWh</span></p>
          <p class="text-xs text-gray-500 mt-2">ADEME / ElectricityMap</p>
        </div>

        <!-- CO2 Emissions -->
        <div class="metric-card">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
              </svg>
            </div>
          </div>
          <p class="text-sm text-gray-600 mb-1">Émissions CO2 (24h)</p>
          <p class="text-3xl font-bold text-gray-900">{{(status?.energy?.co2_emission_kg_per_24h || 0) | number:'1.2-2'}} <span class="text-lg font-normal text-gray-500">kg</span></p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <a routerLink="/admin/infrastructure" class="group bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-semibold mb-2">Infrastructure vSphere</h3>
              <p class="text-primary-100">Gérer les VMs et monitoring temps réel</p>
            </div>
            <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 01-2 2v4a2 2 0 012 2h14a2 2 0 012-2v-4a2 2 0 01-2-2m-2-4h.01M17 16h.01"/>
              </svg>
            </div>
          </div>
        </a>

        <a routerLink="/admin/logs" class="group bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-semibold mb-2">Logs Temps Réel</h3>
              <p class="text-gray-400">vSphere, Docker & K8s logs</p>
            </div>
            <div class="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
          </div>
        </a>
      </div>

      <!-- VM Status Overview -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6">État des Machines Virtuelles</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">VM</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Statut</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Localisation</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">CPU</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Mémoire</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Conso. (W)</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let vm of vms" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="py-4 px-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span class="text-primary-700 font-semibold text-sm">{{vm.name.charAt(0)}}</span>
                    </div>
                    <span class="font-medium text-gray-900">{{vm.name}}</span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span [class]="'status-badge ' + getStatusClass(vm.status)">
                    {{vm.status}}
                  </span>
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span class="text-gray-600 text-sm">{{vm.location}}</span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2">
                    <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full bg-blue-500 rounded-full transition-all duration-500" [style.width.%]="vm.cpu.usage_percent"></div>
                    </div>
                    <span class="text-sm text-gray-600">{{vm.cpu.usage_percent | number:'1.0-0'}}%</span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2">
                    <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full bg-purple-500 rounded-full transition-all duration-500" [style.width.%]="vm.memory.usage_percent"></div>
                    </div>
                    <span class="text-sm text-gray-600">{{vm.memory.used_gb}}/{{vm.memory.total_gb}} GB</span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span class="font-medium text-gray-900">{{vm.power_consumption_watts}} W</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  status: InfrastructureStatusResponse | null = null;
  vms: VMInstance[] = [];
  loading = true;
  error: string | null = null;
  lastUpdated: Date | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private infrastructureApi: InfrastructureApiService) {}

  ngOnInit(): void {
    this.loadData();
    this.startRealtimeUpdates();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    // Load infrastructure status
    this.infrastructureApi.getInfrastructureStatus()
      .pipe(
        catchError(err => {
          this.error = 'Failed to load infrastructure data';
          return of(null);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(status => {
        if (status) {
          this.status = status;
          this.lastUpdated = new Date(status.last_updated);
        }
      });

    // Load VMs
    this.infrastructureApi.getVMs()
      .pipe(
        catchError(() => of({ vms: [], total_count: 0, running_count: 0, suspended_count: 0, stopped_count: 0 } as VMStatusResponse))
      )
      .subscribe(response => {
        this.vms = response.vms.slice(0, 5); // Show only first 5 VMs in dashboard
      });
  }

  startRealtimeUpdates(): void {
    const statusSub = this.infrastructureApi.getInfrastructureStatusRealtime(30000)
      .subscribe((status: InfrastructureStatusResponse) => {
        this.status = status;
        this.lastUpdated = new Date(status.last_updated);
      });

    const vmsSub = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.infrastructureApi.getVMs()),
      catchError(() => of({ vms: [], total_count: 0, running_count: 0, suspended_count: 0, stopped_count: 0 } as VMStatusResponse))
    ).subscribe((response: VMStatusResponse) => {
      this.vms = response.vms.slice(0, 5);
    });

    this.subscriptions.push(statusSub, vmsSub);
  }

  refresh(): void {
    this.loadData();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'running': return 'status-online';
      case 'warning': return 'status-warning';
      case 'suspended': return 'status-warning';
      case 'stopped': return 'status-offline';
      default: return 'status-offline';
    }
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}j ${hours}h`;
    return `${hours}h`;
  }
}
