import { useMemo, useState } from 'react';
import { Badge, Button, Divider, Group, Paper, SegmentedControl, Stack, Tabs, Text, Title } from '@mantine/core';
import { IconPencil, IconRadar2 } from '@tabler/icons-react';
import { Device, DeviceNetworkLink, Host, LatestScanJobSummary, Network, ScanJob } from '../../api/client';
import { ErrorAlert } from '../common/ErrorAlert';
import { HostForm, HostFormValues } from '../hosts/HostForm';
import { HostTable } from '../hosts/HostTable';
import { ScanHistoryList } from '../scan-jobs/ScanHistoryList';
import { ScanJobBadge } from '../scan-jobs/ScanJobBadge';
import { NetworkConnectionsEditor } from './NetworkConnectionsEditor';
import { getLayoutModeLabel, getNetworkBadgeColor, getNetworkKindLabel, getNetworkRoleLabels } from './networkPresentation';

type ConnectionPayload = {
  role?: 'origin' | 'member';
  ip_address?: string | null;
  label?: string | null;
  color?: string | null;
  device_anchor?: 'auto' | 'top' | 'right' | 'bottom' | 'left' | null;
  network_anchor?: 'auto' | 'top' | 'right' | 'bottom' | 'left' | null;
};

type NetworkDetailPanelProps = {
  network: Network;
  devices: Device[];
  links: DeviceNetworkLink[];
  hosts: Host[];
  scanJobs: ScanJob[];
  activeScanJob?: ScanJob | LatestScanJobSummary;
  editingHost: Host | null;
  hostSaveLoading?: boolean;
  hostDeleteLoading?: boolean;
  hostBulkDeleteLoading?: boolean;
  deletingHostId?: string | null;
  hostError?: string | null;
  scanLoading?: boolean;
  connectionLoading?: boolean;
  onEditNetwork: () => void;
  onScan: () => void;
  onEditHost: (host: Host) => void;
  onDeleteHost: (host: Host) => void;
  onDeleteReviewHosts: (hosts: Host[]) => void;
  onSaveHost: (values: HostFormValues) => void;
  onUpsertConnection: (deviceId: string, values: ConnectionPayload) => void;
  onRemoveConnection: (deviceId: string) => void;
};

function SummaryBadgeRow({ network, links, hosts }: { network: Network; links: DeviceNetworkLink[]; hosts: Host[] }) {
  const roleLabels = getNetworkRoleLabels(network.network_kind);
  const originCount = links.filter((link) => link.role === 'origin').length;
  const memberCount = links.filter((link) => link.role === 'member').length;

  return (
    <Group gap="xs" wrap="wrap">
      <Badge variant="light" color="gray">
        {network.cidr}
      </Badge>
      <Badge variant="light" color={getNetworkBadgeColor(network.network_kind)}>
        {getNetworkKindLabel(network.network_kind)}
      </Badge>
      {network.network_kind === 'segment' ? (
        <Badge variant={network.layout_mode === 'container' ? 'filled' : 'light'} color="cyan">
          {getLayoutModeLabel(network.layout_mode)}
        </Badge>
      ) : null}
      {network.vlan_tag ? <Badge variant="outline">VLAN {network.vlan_tag}</Badge> : null}
      {network.color ? <Badge variant="dot" color={network.color}>tint</Badge> : null}
      <Badge variant="outline" color="blue">{originCount} {roleLabels.origin.toLowerCase()}</Badge>
      <Badge variant="outline" color="teal">{memberCount} {roleLabels.member.toLowerCase()}</Badge>
      {network.network_kind === 'segment' ? <Badge variant="outline" color="gray">{hosts.length} hosts</Badge> : null}
    </Group>
  );
}

function OverviewMetric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'blue' | 'teal' | 'orange' }) {
  const background =
    tone === 'blue'
      ? 'rgba(228, 242, 255, 0.9)'
      : tone === 'teal'
        ? 'rgba(231, 250, 243, 0.9)'
        : tone === 'orange'
          ? 'rgba(255, 244, 230, 0.9)'
          : 'rgba(248, 249, 250, 0.95)';

  return (
    <Paper withBorder p="sm" radius="md" style={{ background }}>
      <Stack gap={2}>
        <Text size="xs" c="dimmed">{label}</Text>
        <Text fw={700} size="sm">{value}</Text>
      </Stack>
    </Paper>
  );
}

export function NetworkDetailPanel({
  network,
  devices,
  links,
  hosts,
  scanJobs,
  activeScanJob,
  editingHost,
  hostSaveLoading,
  hostDeleteLoading,
  hostBulkDeleteLoading,
  deletingHostId,
  hostError,
  scanLoading,
  connectionLoading,
  onEditNetwork,
  onScan,
  onEditHost,
  onDeleteHost,
  onDeleteReviewHosts,
  onSaveHost,
  onUpsertConnection,
  onRemoveConnection,
}: NetworkDetailPanelProps) {
  const isSegment = network.network_kind === 'segment';
  const roleLabels = getNetworkRoleLabels(network.network_kind);
  const [hostFilter, setHostFilter] = useState<'all' | 'needs-review'>('all');

  const filteredHosts = useMemo(
    () => hosts.filter((host) => (hostFilter === 'needs-review' ? host.needs_review : true)),
    [hostFilter, hosts],
  );

  const reviewCount = hosts.filter((host) => host.needs_review).length;

  return (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Title order={4}>{network.name}</Title>
              <SummaryBadgeRow network={network} links={links} hosts={hosts} />
            </Stack>
            <Button variant="light" leftSection={<IconPencil size={16} />} onClick={onEditNetwork}>
              Edit network
            </Button>
          </Group>
          {network.notes ? <Text size="sm" c="dimmed">{network.notes}</Text> : null}
        </Stack>
      </Paper>

      <Tabs defaultValue="overview" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="connections">Connections</Tabs.Tab>
          {isSegment ? <Tabs.Tab value="hosts">Hosts</Tabs.Tab> : null}
          {isSegment ? <Tabs.Tab value="scan">Scan</Tabs.Tab> : null}
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Stack gap="md">
            <Group grow align="stretch">
              <OverviewMetric label={roleLabels.origin} value={`${links.filter((link) => link.role === 'origin').length} linked`} tone="blue" />
              <OverviewMetric label={roleLabels.member} value={`${links.filter((link) => link.role === 'member').length} linked`} tone="teal" />
              {isSegment ? (
                <OverviewMetric label="Host review queue" value={reviewCount ? `${reviewCount} need review` : 'Clear'} tone={reviewCount ? 'orange' : 'default'} />
              ) : (
                <OverviewMetric label="Shared peers" value={`${links.length} total`} tone="default" />
              )}
            </Group>

            <Paper withBorder p="md" radius="md" bg="gray.0">
              <Stack gap="xs">
                <Text fw={600} size="sm">{isSegment ? 'LAN summary' : 'Link summary'}</Text>
                {isSegment ? (
                  <Group gap="xs" wrap="wrap">
                    <Badge variant="outline" color={network.dhcp_enabled ? 'teal' : 'gray'}>
                      DHCP {network.dhcp_enabled ? 'on' : 'off'}
                    </Badge>
                    {network.gateway_ip ? <Badge variant="outline" color="blue">Gateway {network.gateway_ip}</Badge> : null}
                    {network.dns_servers.map((dnsServer) => (
                      <Badge key={dnsServer} variant="outline" color="grape">
                        DNS {dnsServer}
                      </Badge>
                    ))}
                    {!network.gateway_ip && !network.dns_servers.length ? (
                      <Text size="sm" c="dimmed">Gateway and DNS are not set.</Text>
                    ) : null}
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed">
                    Keep primary peers on the uplink side and use anchor overrides only when the edge needs a clearer path through the map.
                  </Text>
                )}
              </Stack>
            </Paper>

            {activeScanJob && isSegment ? (
              <Paper withBorder p="md" radius="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={2}>
                    <Text fw={600} size="sm">Latest scan activity</Text>
                    <Text size="sm" c="dimmed">
                      {'scan_profile' in activeScanJob ? activeScanJob.scan_profile : 'ping_sweep'} - {activeScanJob.hosts_found_count} hosts found
                    </Text>
                  </Stack>
                  <ScanJobBadge status={activeScanJob.status} />
                </Group>
              </Paper>
            ) : null}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="connections" pt="md">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Stack gap={2}>
                <Title order={5}>{isSegment ? 'Connection map' : 'Peer map'}</Title>
                <Text size="sm" c="dimmed">
                  Inline edits keep the common fields visible, while advanced edge settings stay tucked away until needed.
                </Text>
              </Stack>
              <Group gap="xs" wrap="wrap">
                <Badge variant="outline" color="blue">{roleLabels.origin}</Badge>
                <Badge variant="outline" color="teal">{roleLabels.member}</Badge>
              </Group>
            </Group>

            <NetworkConnectionsEditor
              network={network}
              devices={devices}
              links={links}
              loading={connectionLoading}
              onUpsertConnection={onUpsertConnection}
              onRemoveConnection={onRemoveConnection}
            />
          </Stack>
        </Tabs.Panel>

        {isSegment ? (
          <Tabs.Panel value="hosts" pt="md">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                  <Title order={5}>Discovered hosts</Title>
                  <Text size="sm" c="dimmed">
                    Review hosts directly from the inspector instead of drilling through scan history first.
                  </Text>
                </Stack>
                <Stack gap="xs" align="flex-end">
                  <SegmentedControl
                    value={hostFilter}
                    onChange={(value) => setHostFilter(value as 'all' | 'needs-review')}
                    data={[
                      { label: `All (${hosts.length})`, value: 'all' },
                      { label: `Needs review (${reviewCount})`, value: 'needs-review' },
                    ]}
                  />
                  {reviewCount ? (
                    <Button color="red" variant="light" loading={hostBulkDeleteLoading} onClick={() => onDeleteReviewHosts(hosts.filter((host) => host.needs_review))}>
                      Remove all needs review
                    </Button>
                  ) : null}
                </Stack>
              </Group>

              {hostError ? <ErrorAlert message={hostError} /> : null}

              <HostTable hosts={filteredHosts} onEdit={onEditHost} onDelete={onDeleteHost} deletingHostId={hostDeleteLoading ? deletingHostId : null} />

              {editingHost ? (
                <>
                  <Divider label="Edit host" />
                  <HostForm initialValue={editingHost} loading={hostSaveLoading} onSubmit={onSaveHost} />
                </>
              ) : null}
            </Stack>
          </Tabs.Panel>
        ) : null}

        {isSegment ? (
          <Tabs.Panel value="scan" pt="md">
            <Stack gap="md">
              <Paper withBorder p="md" radius="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={4}>
                    <Text fw={600}>Active scan</Text>
                    {activeScanJob ? (
                      <Text size="sm" c="dimmed">
                        {'scan_profile' in activeScanJob ? activeScanJob.scan_profile : 'ping_sweep'} - {activeScanJob.hosts_found_count} hosts found so far
                      </Text>
                    ) : (
                      <Text size="sm" c="dimmed">No scans have run for this network yet.</Text>
                    )}
                  </Stack>
                  {activeScanJob ? <ScanJobBadge status={activeScanJob.status} /> : null}
                </Group>
                <Button
                  mt="md"
                  leftSection={<IconRadar2 size={16} />}
                  loading={scanLoading}
                  disabled={activeScanJob?.status === 'pending' || activeScanJob?.status === 'running'}
                  onClick={onScan}
                >
                  Scan network
                </Button>
              </Paper>

              <Stack gap="xs">
                <Text fw={600} size="sm">Recent runs</Text>
                <ScanHistoryList scanJobs={scanJobs} />
              </Stack>
            </Stack>
          </Tabs.Panel>
        ) : null}
      </Tabs>
    </Stack>
  );
}
