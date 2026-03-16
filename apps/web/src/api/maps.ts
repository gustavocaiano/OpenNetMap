import { GraphPayload, MapItem, request } from './client';

export function listMaps() {
  return request<MapItem[]>('/maps');
}

export function createMap(payload: Pick<MapItem, 'name' | 'description'>) {
  return request<MapItem>('/maps', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMap(mapId: string, payload: Pick<MapItem, 'name' | 'description'>) {
  return request<MapItem>(`/maps/${mapId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteMap(mapId: string) {
  return request<void>(`/maps/${mapId}`, {
    method: 'DELETE',
  });
}

export function getMap(mapId: string) {
  return request<MapItem>(`/maps/${mapId}`);
}

export function getMapGraph(mapId: string) {
  return request<GraphPayload>(`/maps/${mapId}/graph`);
}
