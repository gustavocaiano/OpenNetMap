import { Group, Paper, Stack, Text } from '@mantine/core';
import { ScanJob } from '../../api/client';
import { ScanJobBadge } from './ScanJobBadge';

type ScanHistoryListProps = {
  scanJobs: ScanJob[];
};

export function ScanHistoryList({ scanJobs }: ScanHistoryListProps) {
  return (
    <Stack gap="xs">
      {scanJobs.map((scanJob) => (
        <Paper key={scanJob.id} withBorder p="sm" radius="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Text size="sm" fw={600}>
                {scanJob.created_at ? new Date(scanJob.created_at).toLocaleString() : 'Scan job'}
              </Text>
              <Text size="xs" c="dimmed">
                {scanJob.scan_profile} · {scanJob.hosts_found_count} hosts found
              </Text>
              {scanJob.error_message ? (
                <Text size="xs" c="dimmed">
                  {scanJob.error_message}
                </Text>
              ) : null}
            </Stack>
            <ScanJobBadge status={scanJob.status} />
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
