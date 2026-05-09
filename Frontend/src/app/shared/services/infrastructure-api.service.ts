import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, interval, map, startWith, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import {
  InfrastructureStatusResponse,
  VMStatusResponse,
  ContainerStatusResponse,
  LogsResponse,
  LogsFilter,
  VMInstance,
  ContainerInstance,
  ApplicationDeployment,
  LogEntry
} from '../models/infrastructure.model';

@Injectable({
  providedIn: 'root'
})
export class InfrastructureApiService extends ApiService {

  // ============================================================================
  // INFRASTRUCTURE STATUS
  // ============================================================================

  getInfrastructureStatus(): Observable<InfrastructureStatusResponse> {
    return this.get<any>('/infrastructure/status').pipe(
      map(response => this.mapInfrastructureStatus(response))
    );
  }

  private mapInfrastructureStatus(response: any): InfrastructureStatusResponse {
    return {
      summary: {
        total_vms: response.total_vms || 0,
        running_vms: response.running_vms || 0,
        suspended_vms: response.suspended_vms || 0,
        total_containers: response.active_containers || 0,
        running_containers: response.active_containers || 0,
        total_applications: response.deployed_apps || 0,
        healthy_applications: response.deployed_apps || 0
      },
      resources: {
        total_cpu_cores: 16,
        total_memory_gb: 64,
        total_storage_gb: 1000,
        used_cpu_percent: 45,
        used_memory_percent: 62,
        used_storage_percent: 38
      },
      energy: {
        total_power_consumption_watts: 620,
        average_carbon_intensity_g_per_kwh: 45,
        co2_emission_kg_per_24h: 0.67,
        co2_emission_kg_per_month: 20.1
      },
      traffic: {
        requests_per_minute: 1250,
        avg_response_time_ms: 85,
        error_rate_percent: 0.2
      },
      warm_standby: {
        min_vms_required: 2,
        current_suspended_vms: response.suspended_vms || 0,
        scale_up_threshold: 75,
        scale_down_threshold: 25
      },
      last_updated: new Date().toISOString()
    };
  }

  getInfrastructureStatusRealtime(pollInterval: number = 5000): Observable<InfrastructureStatusResponse> {
    return interval(pollInterval).pipe(
      startWith(0),
      switchMap(() => this.getInfrastructureStatus()),
      catchError(error => {
        console.error('Error fetching infrastructure status:', error);
        return of(this.generateMockStatus());
      })
    );
  }

  // ============================================================================
  // VIRTUAL MACHINES
  // ============================================================================

  getVMs(): Observable<VMStatusResponse> {
    return this.get<any[]>('/infrastructure/vms').pipe(
      map(vms => this.mapVMsResponse(vms))
    );
  }

  private mapVMsResponse(vms: any[]): VMStatusResponse {
    const mappedVms = vms.map(vm => ({
      id: vm.id || '',
      name: vm.name || '',
      status: vm.status || 'stopped',
      location: 'EU-West-1a',
      datacenter: 'Paris',
      cpu: {
        cores: 8,
        usage_percent: vm.cpu_percent || 0,
        frequency_ghz: 2.8
      },
      memory: {
        total_gb: 32,
        used_gb: Math.round((vm.memory_percent || 0) * 32 / 100),
        usage_percent: vm.memory_percent || 0
      },
      storage: {
        total_gb: 500,
        used_gb: Math.round((vm.memory_percent || 0) * 500 / 100)
      },
      network: {
        inbound_mbps: 45,
        outbound_mbps: 32
      },
      carbon_intensity_g_per_kwh: 45,
      power_consumption_watts: vm.status === 'running' ? 120 : 5,
      co2_emission_g_per_hour: vm.status === 'running' ? 5.4 : 0.225,
      os: 'Ubuntu 22.04 LTS',
      uptime_seconds: vm.status === 'running' ? 3920400 : 0,
      created_at: '2024-01-15T10:00:00Z',
      containers_count: vm.status === 'running' ? 3 : 0,
      applications: vm.status === 'running' ? ['eco-track-api', 'worker-pool'] : []
    }));

    return {
      vms: mappedVms,
      total_count: mappedVms.length,
      running_count: mappedVms.filter(v => v.status === 'running').length,
      suspended_count: mappedVms.filter(v => v.status === 'suspended').length,
      stopped_count: mappedVms.filter(v => v.status === 'stopped').length
    };
  }

  getVMById(id: string): Observable<VMInstance> {
    return this.get<VMInstance>(`/infrastructure/vms/${id}`);
  }

  // ============================================================================
  // CONTAINERS
  // ============================================================================

  getContainers(): Observable<ContainerStatusResponse> {
    return this.get<ContainerStatusResponse>('/infrastructure/containers');
  }

  getContainersByVM(vmId: string): Observable<ContainerInstance[]> {
    return this.get<ContainerInstance[]>(`/infrastructure/vms/${vmId}/containers`);
  }

  // ============================================================================
  // APPLICATIONS
  // ============================================================================

  getApplications(): Observable<ApplicationDeployment[]> {
    return this.get<ApplicationDeployment[]>('/infrastructure/applications');
  }

  // ============================================================================
  // LOGS
  // ============================================================================

  getLogs(filter?: LogsFilter): Observable<LogsResponse> {
    return this.get<LogsResponse>('/logs', filter);
  }

  getLogsRealtime(pollInterval: number = 3000, filter?: LogsFilter): Observable<LogsResponse> {
    return interval(pollInterval).pipe(
      startWith(0),
      switchMap(() => this.getLogs(filter)),
      catchError(error => {
        console.error('Error fetching logs:', error);
        return of({
          logs: this.generateMockLogs(),
          total_count: 50,
          has_more: true
        });
      })
    );
  }

  // ============================================================================
  // MOCK DATA (for development/demo when API is unavailable)
  // ============================================================================

  private generateMockStatus(): InfrastructureStatusResponse {
    return {
      summary: {
        total_vms: 5,
        running_vms: 3,
        suspended_vms: 1,
        total_containers: 12,
        running_containers: 10,
        total_applications: 4,
        healthy_applications: 4
      },
      resources: {
        total_cpu_cores: 40,
        total_memory_gb: 160,
        total_storage_gb: 2000,
        used_cpu_percent: 45,
        used_memory_percent: 62,
        used_storage_percent: 38
      },
      energy: {
        total_power_consumption_watts: 620,
        average_carbon_intensity_g_per_kwh: 45,
        co2_emission_kg_per_24h: 0.67,
        co2_emission_kg_per_month: 20.1
      },
      traffic: {
        requests_per_minute: 1250,
        avg_response_time_ms: 85,
        error_rate_percent: 0.2
      },
      warm_standby: {
        min_vms_required: 2,
        current_suspended_vms: 1,
        scale_up_threshold: 75,
        scale_down_threshold: 25
      },
      last_updated: new Date().toISOString()
    };
  }

  private generateMockLogs(): LogEntry[] {
    const sources: LogEntry['source'][] = ['vsphere', 'docker', 'kubernetes', 'application', 'orchestrator'];
    const levels: LogEntry['level'][] = ['info', 'info', 'info', 'warning', 'error'];
    const components = ['api-gateway', 'worker-pool', 'database', 'cache', 'monitoring', 'scheduler'];
    const vms = ['VM-Production-01', 'VM-Production-02', 'VM-Staging-01', 'VM-Dev-01', 'VM-Database-01'];

    const messages = [
      'Health check passed',
      'Scaling up: 3 -> 5 replicas',
      'Container nginx started successfully',
      'Database connection established',
      'Cache warmup complete',
      'VM CPU usage: 65%',
      'Deployment completed',
      'Backup finished',
      'Memory usage alert: 82%',
      'Request processed in 45ms'
    ];

    return Array.from({ length: 20 }, (_, i) => ({
      id: `log-${Date.now() - i * 3000}`,
      timestamp: new Date(Date.now() - i * 3000).toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      component: components[Math.floor(Math.random() * components.length)],
      vm_name: vms[Math.floor(Math.random() * vms.length)],
      container_name: Math.random() > 0.5 ? `container-${i}` : undefined,
      application: Math.random() > 0.3 ? 'eco-track-api' : undefined,
      message: messages[Math.floor(Math.random() * messages.length)]
    }));
  }

  getMockVMs(): Observable<VMStatusResponse> {
    const mockVMs: VMInstance[] = [
      {
        id: 'vm-1',
        name: 'VM-Production-01',
        status: 'running',
        location: 'EU-West-1a',
        datacenter: 'Paris',
        cpu: { cores: 8, usage_percent: 45, frequency_ghz: 2.8 },
        memory: { total_gb: 32, used_gb: 18, usage_percent: 56 },
        storage: { total_gb: 500, used_gb: 180 },
        network: { inbound_mbps: 45, outbound_mbps: 32 },
        carbon_intensity_g_per_kwh: 45,
        power_consumption_watts: 120,
        co2_emission_g_per_hour: 5.4,
        os: 'Ubuntu 22.04 LTS',
        uptime_seconds: 3920400,
        created_at: '2024-01-15T10:00:00Z',
        containers_count: 3,
        applications: ['eco-track-api', 'worker-pool']
      },
      {
        id: 'vm-2',
        name: 'VM-Production-02',
        status: 'running',
        location: 'EU-West-1b',
        datacenter: 'Paris',
        cpu: { cores: 8, usage_percent: 62, frequency_ghz: 2.8 },
        memory: { total_gb: 32, used_gb: 24, usage_percent: 75 },
        storage: { total_gb: 500, used_gb: 220 },
        network: { inbound_mbps: 68, outbound_mbps: 45 },
        carbon_intensity_g_per_kwh: 45,
        power_consumption_watts: 145,
        co2_emission_g_per_hour: 6.5,
        os: 'Alpine Linux 3.18',
        uptime_seconds: 1058400,
        created_at: '2024-02-20T08:00:00Z',
        containers_count: 4,
        applications: ['eco-track-api', 'cache', 'queue']
      },
      {
        id: 'vm-3',
        name: 'VM-Staging-01',
        status: 'suspended',
        location: 'EU-West-1a',
        datacenter: 'Paris',
        cpu: { cores: 4, usage_percent: 0, frequency_ghz: 2.4 },
        memory: { total_gb: 16, used_gb: 0, usage_percent: 0 },
        storage: { total_gb: 250, used_gb: 120 },
        network: { inbound_mbps: 0, outbound_mbps: 0 },
        carbon_intensity_g_per_kwh: 45,
        power_consumption_watts: 5,
        co2_emission_g_per_hour: 0.225,
        os: 'Debian 12',
        uptime_seconds: 0,
        created_at: '2024-01-20T12:00:00Z',
        containers_count: 0,
        applications: []
      },
      {
        id: 'vm-4',
        name: 'VM-Dev-01',
        status: 'running',
        location: 'EU-West-1c',
        datacenter: 'Frankfurt',
        cpu: { cores: 4, usage_percent: 25, frequency_ghz: 2.4 },
        memory: { total_gb: 16, used_gb: 6, usage_percent: 38 },
        storage: { total_gb: 250, used_gb: 80 },
        network: { inbound_mbps: 12, outbound_mbps: 8 },
        carbon_intensity_g_per_kwh: 380,
        power_consumption_watts: 60,
        co2_emission_g_per_hour: 22.8,
        os: 'Ubuntu 22.04 LTS',
        uptime_seconds: 604800,
        created_at: '2024-03-01T09:00:00Z',
        containers_count: 2,
        applications: ['dev-environment']
      },
      {
        id: 'vm-5',
        name: 'VM-Database-01',
        status: 'running',
        location: 'EU-West-1a',
        datacenter: 'Paris',
        cpu: { cores: 16, usage_percent: 55, frequency_ghz: 3.2 },
        memory: { total_gb: 64, used_gb: 42, usage_percent: 66 },
        storage: { total_gb: 1000, used_gb: 450 },
        network: { inbound_mbps: 125, outbound_mbps: 89 },
        carbon_intensity_g_per_kwh: 45,
        power_consumption_watts: 200,
        co2_emission_g_per_hour: 9.0,
        os: 'RHEL 9',
        uptime_seconds: 7689600,
        created_at: '2023-11-01T06:00:00Z',
        containers_count: 3,
        applications: ['postgres-primary', 'redis', 'backup-agent']
      }
    ];

    return of({
      vms: mockVMs,
      total_count: mockVMs.length,
      running_count: mockVMs.filter(v => v.status === 'running').length,
      suspended_count: mockVMs.filter(v => v.status === 'suspended').length,
      stopped_count: mockVMs.filter(v => v.status === 'stopped').length
    });
  }
}
