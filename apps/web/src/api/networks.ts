import { AnchorPreference, Host, Network, NetworkKind, request } from './client';

export type NetworkCreateInput = {
  name: string;
  cidr: string;
  network_kind: NetworkKind;
  layout_mode?: 'node' | 'container' | null;
  color: string | null;
  vlan_tag: number | null;
  notes: string | null;
  dhcp_enabled: boolean;
  gateway_ip: string | null;
  dns_servers: string[];
  pos_x?: number | null;
  pos_y?: number | null;
};

export type NetworkPatchInput = Partial<Pick<Network, 'name' | 'cidr' | 'network_kind' | 'layout_mode' | 'color' | 'vlan_tag' | 'notes' | 'dhcp_enabled' | 'gateway_ip' | 'dns_servers' | 'pos_x' | 'pos_y'>>;

export type DeviceNetworkLinkInput = {
  role?: 'origin' | 'member';
  ip_address?: string | null;
  label?: string | null;
  color?: string | null;
  device_anchor?: AnchorPreference | null;
  network_anchor?: AnchorPreference | null;
};

export function listNetworks(mapId: string) {
  return request<Network[]>(`/maps/${mapId}/networks`);
}

export function createNetwork(mapId: string, payload: NetworkCreateInput) {
  return request<Network>(`/maps/${mapId}/networks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateNetwork(networkId: string, payload: NetworkPatchInput) {
  return request<Network>(`/networks/${networkId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteNetwork(networkId: string) {
  return request<void>(`/networks/${networkId}`, {
    method: 'DELETE',
  });
}

export function patchNetworkPosition(networkId: string, position: { pos_x: number; pos_y: number }) {
  return updateNetwork(networkId, position);
}

export function linkDeviceToNetwork(deviceId: string, networkId: string, payload?: DeviceNetworkLinkInput) {
  return request<void>(`/devices/${deviceId}/networks/${networkId}`, {
    method: 'PUT',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

export function unlinkDeviceFromNetwork(deviceId: string, networkId: string) {
  return request<void>(`/devices/${deviceId}/networks/${networkId}`, {
    method: 'DELETE',
  });
}

export function listNetworkHosts(networkId: string) {
  return request<Host[]>(`/networks/${networkId}/hosts`);
}
