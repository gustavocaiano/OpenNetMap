import { Host, request } from './client';

export type HostPatchInput = Pick<Host, 'ip_address' | 'hostname' | 'type' | 'notes' | 'needs_review'>;

export function updateHost(hostId: string, payload: HostPatchInput) {
  return request<Host>(`/hosts/${hostId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteHost(hostId: string) {
  return request<void>(`/hosts/${hostId}`, {
    method: 'DELETE',
  });
}
