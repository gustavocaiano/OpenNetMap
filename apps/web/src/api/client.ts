export type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, payload?: ApiErrorPayload) {
    super(payload?.error?.message ?? payload?.message ?? 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = payload?.error?.code;
    this.details = payload?.error?.details;
  }
}

export function getErrorMessage(error: unknown, fallback = 'Request failed') {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export type MapItem = {
  id: string;
  name: string;
  description: string | null;
  device_count: number;
  network_count: number;
  host_count: number;
  created_at: string;
  updated_at: string;
};

export type DeviceType = 'router' | 'firewall' | 'server';

export type HostType = 'unknown' | 'server' | 'vm' | 'workstation';

export type HostDiscoverySource = 'nmap' | 'manual';

export type NetworkKind = 'segment' | 'link';

export type AnchorPreference = 'auto' | 'top' | 'right' | 'bottom' | 'left';

export type Device = {
  id: string;
  map_id: string;
  name: string;
  type: DeviceType;
  notes: string | null;
  pos_x: number | null;
  pos_y: number | null;
  network_ids: string[];
  created_at: string;
  updated_at: string;
};

export type Network = {
  id: string;
  map_id: string;
  name: string;
  cidr: string;
  network_kind: NetworkKind;
  layout_mode: 'node' | 'container' | null;
  color: string | null;
  vlan_tag: number | null;
  notes: string | null;
  dhcp_enabled: boolean;
  gateway_ip: string | null;
  dns_servers: string[];
  pos_x: number | null;
  pos_y: number | null;
  device_ids: string[];
  host_count: number;
  latest_scan_job: LatestScanJobSummary | null;
  created_at: string;
  updated_at: string;
};

export type Host = {
  id: string;
  network_id: string;
  ip_address: string;
  hostname: string | null;
  detected_hostname: string | null;
  type: HostType;
  notes: string | null;
  discovery_source: HostDiscoverySource;
  needs_review: boolean;
  first_seen_at: string | null;
  last_seen_at: string | null;
  last_scan_job_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ScanJobStatus = 'pending' | 'running' | 'succeeded' | 'failed';

export type LatestScanJobSummary = {
  id: string;
  status: ScanJobStatus;
  created_at: string;
  finished_at: string | null;
  hosts_found_count: number;
};

export type ScanJob = {
  id: string;
  network_id: string;
  status: ScanJobStatus;
  scan_profile: 'ping_sweep';
  hosts_found_count: number;
  raw_output_available: boolean;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
};

export type GraphPayload = {
  map: MapItem;
  devices: Device[];
  networks: Network[];
  hosts: Host[];
  device_network_links: DeviceNetworkLink[];
};

export type DeviceNetworkLink = {
  device_id: string;
  network_id: string;
  role: 'origin' | 'member';
  ip_address?: string | null;
  label?: string | null;
  color?: string | null;
  device_anchor?: AnchorPreference | null;
  network_anchor?: AnchorPreference | null;
};

const API_BASE = '/api/v1';

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let payload: ApiErrorPayload | undefined;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = undefined;
    }
    throw new ApiError(response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
