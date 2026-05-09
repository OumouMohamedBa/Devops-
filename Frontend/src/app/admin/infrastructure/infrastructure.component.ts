import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfrastructureApiService } from '../../shared/services/infrastructure-api.service';
import { VMInstance, InfrastructureStatusResponse, VMStatusResponse } from '../../shared/models/infrastructure.model';
import { Subscription, interval, startWith, switchMap, catchError, of, finalize } from 'rxjs';

@Component({
  selector: 'app-infrastructure',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto animate-enter">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Infrastructure vSphere</h1>
        <p class="text-gray-600">Gestion des VMs et monitoring de la consommation énergétique</p>
      </div>

      <!-- Location & Carbon Badge -->
      <div class="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white mb-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-emerald-100 text-sm">Datacenter Localisation</p>
              <p class="text-2xl font-bold">EU-West (Paris, FR)</p>
            </div>
          </div>
          <div class="flex items-center gap-6">
            <div class="text-center">
              <p class="text-emerald-100 text-sm">Intensité Carbone</p>
              <p class="text-3xl font-bold">{{ carbonIntensity }} <span class="text-lg">gCO2/kWh</span></p>
            </div>
            <div class="h-12 w-px bg-white/20"></div>
            <div class="text-center">
              <p class="text-emerald-100 text-sm">Source</p>
              <p class="text-lg font-medium">ElectricityMap</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Real-time Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <p class="text-gray-600">VMs Actives</p>
            <span class="status-badge status-online">Live</span>
          </div>
          <p class="text-4xl font-bold text-gray-900">{{ runningVms }}/{{ totalVms }}</p>
          <div class="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full transition-all duration-500"
                 [style.width.%]="(runningVms / (totalVms || 1)) * 100"></div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <p class="text-gray-600">Puissance Totale</p>
            <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <p class="text-4xl font-bold text-gray-900">{{ totalPowerWatts | number:'1.0-0' }} <span class="text-lg font-normal text-gray-500">W</span></p>
          <p class="text-sm text-gray-500 mt-2">≈ {{ dailyKwh | number:'1.2-2' }} kWh/jour</p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <p class="text-gray-600">Empreinte Carbone</p>
            <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
            </svg>
          </div>
          <p class="text-4xl font-bold text-gray-900">{{ co2Per24h | number:'1.2-2' }} <span class="text-lg font-normal text-gray-500">kg/jour</span></p>
          <p class="text-sm text-gray-500 mt-2">CO2 émis en 24h</p>
        </div>
      </div>

      <!-- VMs Grid -->
      <h2 class="text-xl font-bold text-gray-900 mb-6">Machines Virtuelles</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div *ngFor="let vm of vms" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
          <!-- VM Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                {{vm.name.charAt(vm.name.length - 1)}}
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">{{vm.name}}</h3>
                <span class="text-sm text-gray-500">{{vm.os}} • {{vm.cpu.cores}} cœurs</span>
              </div>
            </div>
            <span [class]="'status-badge ' + getStatusClass(vm.status)">
              {{vm.status}}
            </span>
          </div>

          <!-- VM Details -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="p-3 bg-gray-50 rounded-xl">
              <p class="text-xs text-gray-500 mb-1">Localisation</p>
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                <span class="text-sm font-medium text-gray-700">{{vm.location}}</span>
              </div>
            </div>
            <div class="p-3 bg-gray-50 rounded-xl">
              <p class="text-xs text-gray-500 mb-1">Uptime</p>
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-sm font-medium text-gray-700">{{formatUptime(vm.uptime_seconds)}}</span>
              </div>
            </div>
          </div>

          <!-- CPU & Memory -->
          <div class="space-y-3">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-gray-600">CPU ({{vm.cpu.cores}} cœurs &#64; {{vm.cpu.frequency_ghz}}GHz)</span>
                <span class="text-sm font-medium" [class.text-amber-600]="vm.cpu.usage_percent > 80" [class.text-gray-900]="vm.cpu.usage_percent <= 80">
                  {{vm.cpu.usage_percent | number:'1.0-0'}}%
                </span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                     [class.bg-emerald-500]="vm.cpu.usage_percent <= 60"
                     [class.bg-amber-500]="vm.cpu.usage_percent > 60 && vm.cpu.usage_percent <= 80"
                     [class.bg-red-500]="vm.cpu.usage_percent > 80"
                     [style.width.%]="vm.cpu.usage_percent"></div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-gray-600">Mémoire</span>
                <span class="text-sm font-medium text-gray-900">{{vm.memory.used_gb}}/{{vm.memory.total_gb}} GB</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500 rounded-full transition-all duration-500"
                     [style.width.%]="vm.memory.usage_percent"></div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">Intensité:</span>
              <span class="text-sm font-medium" [class.text-emerald-600]="vm.carbon_intensity_g_per_kwh < 100" [class.text-amber-600]="vm.carbon_intensity_g_per_kwh >= 100">
                {{vm.carbon_intensity_g_per_kwh}} gCO2/kWh
              </span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span class="text-sm font-medium text-gray-900">{{vm.power_consumption_watts}} W</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class InfrastructureComponent implements OnInit, OnDestroy {
  vms: VMInstance[] = [];
  status: InfrastructureStatusResponse | null = null;
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

    this.infrastructureApi.getInfrastructureStatus()
      .pipe(
        catchError(err => {
          this.error = 'Failed to load infrastructure data';
          return of(null);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe((status: InfrastructureStatusResponse | null) => {
        if (status) {
          this.status = status;
          this.lastUpdated = new Date(status.last_updated);
        }
      });

    this.infrastructureApi.getVMs()
      .pipe(
        catchError(() => of({ vms: [], total_count: 0, running_count: 0, suspended_count: 0, stopped_count: 0 } as VMStatusResponse))
      )
      .subscribe((response: VMStatusResponse) => {
        this.vms = response.vms;
      });
  }

  startRealtimeUpdates(): void {
    const statusSub = this.infrastructureApi.getInfrastructureStatusRealtime(30000)
      .pipe(
        catchError(error => {
          console.error('Error fetching infrastructure status:', error);
          return of(null);
        })
      )
      .subscribe((status: InfrastructureStatusResponse | null) => {
        if (status) {
          this.status = status;
          this.lastUpdated = new Date(status.last_updated);
        }
      });

    const vmsSub = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.infrastructureApi.getVMs()),
      catchError(() => of({ vms: [], total_count: 0, running_count: 0, suspended_count: 0, stopped_count: 0 } as VMStatusResponse))
    ).subscribe((response: VMStatusResponse) => {
      this.vms = response.vms;
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
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}j ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  get carbonIntensity(): number {
    return this.status?.energy?.average_carbon_intensity_g_per_kwh ?? 45;
  }

  get runningVms(): number {
    return this.status?.summary?.running_vms ?? 0;
  }

  get totalVms(): number {
    return this.status?.summary?.total_vms ?? 0;
  }

  get totalPowerWatts(): number {
    return this.status?.energy?.total_power_consumption_watts ?? 0;
  }

  get co2Per24h(): number {
    return this.status?.energy?.co2_emission_kg_per_24h ?? 0;
  }

  get dailyKwh(): number {
    return (this.totalPowerWatts * 24) / 1000;
  }
}
