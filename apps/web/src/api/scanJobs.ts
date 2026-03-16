import { ScanJob, request } from './client';

export function createNetworkScan(networkId: string) {
  return request<ScanJob>(`/networks/${networkId}/scan-jobs`, {
    method: 'POST',
    body: JSON.stringify({ scan_profile: 'ping_sweep' }),
  });
}

export function listNetworkScanJobs(networkId: string) {
  return request<ScanJob[]>(`/networks/${networkId}/scan-jobs`);
}

export function getScanJob(scanJobId: string) {
  return request<ScanJob>(`/scan-jobs/${scanJobId}`);
}
