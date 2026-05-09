// ============================================================================
// INFRASTRUCTURE MODELS - Aligned with Backend API
// ============================================================================

export interface VMInstance {
  id: string;
  name: string;
  status: 'running' | 'suspended' | 'stopped' | 'warning';
  location: string;
  datacenter: string;
  cpu: {
    cores: number;
    usage_percent: number;
    frequency_ghz: number;
  };
  memory: {
    total_gb: number;
    used_gb: number;
    usage_percent: number;
  };
  storage: {
    total_gb: number;
    used_gb: number;
  };
  network: {
    inbound_mbps: number;
    outbound_mbps: number;
  };
  carbon_intensity_g_per_kwh: number;
  power_consumption_watts: number;
  co2_emission_g_per_hour: number;
  os: string;
  uptime_seconds: number;
  created_at: string;
  containers_count: number;
  applications: string[];
}

export interface ContainerInstance {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'paused' | 'stopped' | 'error';
  vm_id: string;
  vm_name: string;
  cpu_percent: number;
  memory_usage_mb: number;
  memory_limit_mb: number;
  restart_count: number;
  ports: string[];
  created_at: string;
  service_type: 'api' | 'worker' | 'database' | 'cache' | 'frontend';
}

export interface ApplicationDeployment {
  id: string;
  name: string;
  version: string;
  replicas: number;
  desired_replicas: number;
  containers: string[];
  status: 'healthy' | 'degraded' | 'scaling' | 'error';
  requests_per_minute: number;
  avg_response_time_ms: number;
  error_rate_percent: number;
  last_deployed_at: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  source: 'vsphere' | 'docker' | 'kubernetes' | 'application' | 'orchestrator';
  component: string;
  vm_name?: string;
  container_name?: string;
  application?: string;
  message: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// METRICS & STATS
// ============================================================================

export interface InfrastructureStatusResponse {
  summary: {
    total_vms: number;
    running_vms: number;
    suspended_vms: number;
    total_containers: number;
    running_containers: number;
    total_applications: number;
    healthy_applications: number;
  };
  resources: {
    total_cpu_cores: number;
    total_memory_gb: number;
    total_storage_gb: number;
    used_cpu_percent: number;
    used_memory_percent: number;
    used_storage_percent: number;
  };
  energy: {
    total_power_consumption_watts: number;
    average_carbon_intensity_g_per_kwh: number;
    co2_emission_kg_per_24h: number;
    co2_emission_kg_per_month: number;
  };
  traffic: {
    requests_per_minute: number;
    avg_response_time_ms: number;
    error_rate_percent: number;
  };
  warm_standby: {
    min_vms_required: number;
    current_suspended_vms: number;
    scale_up_threshold: number;
    scale_down_threshold: number;
  };
  last_updated: string;
}

export interface VMStatusResponse {
  vms: VMInstance[];
  total_count: number;
  running_count: number;
  suspended_count: number;
  stopped_count: number;
}

export interface ContainerStatusResponse {
  containers: ContainerInstance[];
  total_count: number;
  running_count: number;
}

export interface LogsResponse {
  logs: LogEntry[];
  total_count: number;
  has_more: boolean;
}

export interface LogsFilter {
  level?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  source?: 'vsphere' | 'docker' | 'kubernetes' | 'application' | 'orchestrator';
  component?: string;
  vm_name?: string;
  container_name?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}
