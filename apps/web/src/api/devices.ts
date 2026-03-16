import { Device, request } from './client';

export type DeviceCreateInput = {
  name: string;
  type: Device['type'];
  notes: string | null;
  pos_x?: number | null;
  pos_y?: number | null;
};

export type DevicePatchInput = Partial<Pick<Device, 'name' | 'type' | 'notes' | 'pos_x' | 'pos_y'>>;

export function listDevices(mapId: string) {
  return request<Device[]>(`/maps/${mapId}/devices`);
}

export function createDevice(mapId: string, payload: DeviceCreateInput) {
  return request<Device>(`/maps/${mapId}/devices`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateDevice(deviceId: string, payload: DevicePatchInput) {
  return request<Device>(`/devices/${deviceId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteDevice(deviceId: string) {
  return request<void>(`/devices/${deviceId}`, {
    method: 'DELETE',
  });
}

export function patchDevicePosition(deviceId: string, position: { pos_x: number; pos_y: number }) {
  return updateDevice(deviceId, position);
}
