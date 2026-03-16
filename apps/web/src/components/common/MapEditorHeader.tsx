import { Badge, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconActivityHeartbeat, IconNetwork, IconPlus, IconSearch } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { LatestScanJobSummary, Network, ScanJob } from '../../api/client';
import { ScanJobBadge } from '../scan-jobs/ScanJobBadge';

type ActiveNetworkScan = {
  network: Network;
  job: ScanJob | LatestScanJobSummary;
};

type MapEditorHeaderProps = {
  mapName: string;
  activeScans: ActiveNetworkScan[];
  onCreateNetwork: () => void;
  onSelectNetwork: (networkId: string) => void;
};

function getScanDetail(job: ScanJob | LatestScanJobSummary) {
  if ('scan_profile' in job) {
    return `${job.scan_profile} scan`;
  }

  return 'recent scan';
}

export function MapEditorHeader({ mapName, activeScans, onCreateNetwork, onSelectNetwork }: MapEditorHeaderProps) {
  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={3}>{mapName}</Title>
          <Text c="dimmed" size="sm">
            Map devices, segments, and transit links without losing sight of live scan work or the current topology shape.
          </Text>
        </Stack>
        <Group>
          <Button leftSection={<IconPlus size={16} />} variant="light" onClick={onCreateNetwork}>
            Create network
          </Button>
          <Button component={Link} to="/" variant="default">
            Back to maps
          </Button>
        </Group>
      </Group>

      <Paper
        withBorder
        p="sm"
        radius="md"
        style={{
          background: 'linear-gradient(180deg, rgba(248, 249, 250, 0.92), rgba(255, 255, 255, 0.98))',
        }}
      >
        <Group justify="space-between" align="flex-start" gap="md">
          <Group gap="xs" align="flex-start">
            <Paper radius="md" p={8} bg="blue.0" c="blue.7" style={{ lineHeight: 0 }}>
              <IconActivityHeartbeat size={16} />
            </Paper>
            <Stack gap={2}>
              <Text fw={600} size="sm">
                Scan activity
              </Text>
              <Text size="xs" c="dimmed">
                {activeScans.length
                  ? `${activeScans.length} network${activeScans.length === 1 ? '' : 's'} currently scanning or queued.`
                  : 'No active scans right now.'}
              </Text>
            </Stack>
          </Group>

          <Group gap="xs" wrap="wrap" justify="flex-end">
            {activeScans.length ? (
              activeScans.map(({ network, job }) => (
                <Button
                  key={network.id}
                  variant="light"
                  color={job.status === 'running' ? 'blue' : 'yellow'}
                  leftSection={<IconSearch size={14} />}
                  rightSection={<ScanJobBadge status={job.status} />}
                  onClick={() => onSelectNetwork(network.id)}
                >
                  {network.name}
                </Button>
              ))
            ) : (
              <Badge variant="light" color="gray" leftSection={<IconNetwork size={12} />}>
                Ready for topology work
              </Badge>
            )}
          </Group>
        </Group>

        {activeScans.length ? (
          <Group mt="sm" gap="xs" wrap="wrap">
            {activeScans.map(({ network, job }) => (
              <Badge
                key={`${network.id}-detail`}
                variant="outline"
                color={job.status === 'running' ? 'blue' : 'yellow'}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectNetwork(network.id)}
              >
                {network.cidr} - {getScanDetail(job)}
              </Badge>
            ))}
          </Group>
        ) : null}
      </Paper>
    </Stack>
  );
}
