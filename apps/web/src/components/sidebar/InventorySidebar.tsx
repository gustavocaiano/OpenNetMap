import { useMemo, useState } from 'react';
import { Badge, Button, Divider, Group, Paper, SegmentedControl, Stack, Text, TextInput } from '@mantine/core';
import { IconCpu, IconPlus, IconSearch, IconTopologyStar3 } from '@tabler/icons-react';
import { Device, Network } from '../../api/client';
import { DeviceList } from '../devices/DeviceList';
import { NetworkList } from '../networks/NetworkList';
import { MapSummaryCard } from './MapSummaryCard';

type InventorySidebarProps = {
  devices: Device[];
  networks: Network[];
  hostCount: number;
  selectedDeviceId?: string | null;
  selectedNetworkId?: string | null;
  onCreateDevice: () => void;
  onCreateNetwork: () => void;
  onSelectDevice: (deviceId: string) => void;
  onSelectNetwork: (networkId: string) => void;
  onEditDevice: (deviceId: string) => void;
  onEditNetwork: (networkId: string) => void;
  onDeleteDevice: (deviceId: string) => void;
  onDeleteNetwork: (networkId: string) => void;
};

export function InventorySidebar(props: InventorySidebarProps) {
  const {
    devices,
    networks,
    hostCount,
    selectedDeviceId,
    selectedNetworkId,
    onCreateDevice,
    onCreateNetwork,
    onSelectDevice,
    onSelectNetwork,
    onEditDevice,
    onEditNetwork,
    onDeleteDevice,
    onDeleteNetwork,
  } = props;

  const [search, setSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<'all' | Device['type']>('all');
  const [networkFilter, setNetworkFilter] = useState<'all' | Network['network_kind']>('all');

  const searchTerm = search.trim().toLowerCase();

  const filteredDevices = useMemo(
    () =>
      devices.filter((device) => {
        const matchesSearch =
          !searchTerm ||
          device.name.toLowerCase().includes(searchTerm) ||
          device.type.toLowerCase().includes(searchTerm) ||
          device.notes?.toLowerCase().includes(searchTerm);
        const matchesType = deviceFilter === 'all' || device.type === deviceFilter;
        return matchesSearch && matchesType;
      }),
    [deviceFilter, devices, searchTerm],
  );

  const filteredNetworks = useMemo(
    () =>
      networks.filter((network) => {
        const matchesSearch =
          !searchTerm ||
          network.name.toLowerCase().includes(searchTerm) ||
          network.cidr.toLowerCase().includes(searchTerm) ||
          network.notes?.toLowerCase().includes(searchTerm);
        const matchesKind = networkFilter === 'all' || network.network_kind === networkFilter;
        return matchesSearch && matchesKind;
      }),
    [networkFilter, networks, searchTerm],
  );

  return (
    <Stack gap="md">
      <MapSummaryCard devices={devices.length} networks={networks.length} hosts={hostCount} />
      <Group grow>
        <Button leftSection={<IconPlus size={16} />} onClick={onCreateDevice}>
          Create device
        </Button>
        <Button leftSection={<IconPlus size={16} />} variant="default" onClick={onCreateNetwork}>
          Create network
        </Button>
      </Group>
      <Paper withBorder p="sm" radius="md">
        <Stack gap="sm">
          <TextInput
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Search devices, CIDRs, notes"
            leftSection={<IconSearch size={16} />}
          />
          <Group gap="xs" wrap="wrap">
            <Badge variant="light" color="gray">
              {filteredDevices.length}/{devices.length} devices
            </Badge>
            <Badge variant="light" color="gray">
              {filteredNetworks.length}/{networks.length} networks
            </Badge>
          </Group>
        </Stack>
      </Paper>
      <Divider />
      <Stack gap="xs">
        <Group justify="space-between" gap="xs">
          <Group gap="xs">
            <IconCpu size={16} />
            <Text fw={600}>Devices</Text>
          </Group>
          <Badge variant="light" color="blue">
            {filteredDevices.length}
          </Badge>
        </Group>
        <SegmentedControl
          fullWidth
          size="xs"
          value={deviceFilter}
          onChange={(value) => setDeviceFilter(value as 'all' | Device['type'])}
          data={[
            { label: 'All', value: 'all' },
            { label: 'Routers', value: 'router' },
            { label: 'Firewalls', value: 'firewall' },
            { label: 'Servers', value: 'server' },
          ]}
        />
        {filteredDevices.length ? (
          <DeviceList
            devices={filteredDevices}
            selectedDeviceId={selectedDeviceId}
            onSelect={onSelectDevice}
            onEdit={onEditDevice}
            onDelete={onDeleteDevice}
          />
        ) : (
          <Paper withBorder p="sm" radius="md" bg="gray.0">
            <Text size="sm" c="dimmed">
              No devices match the current search or type filter.
            </Text>
          </Paper>
        )}
      </Stack>
      <Divider />
      <Stack gap="xs">
        <Group justify="space-between" gap="xs">
          <Group gap="xs">
            <IconTopologyStar3 size={16} />
            <Text fw={600}>Networks</Text>
          </Group>
          <Badge variant="light" color="teal">
            {filteredNetworks.length}
          </Badge>
        </Group>
        <SegmentedControl
          fullWidth
          size="xs"
          value={networkFilter}
          onChange={(value) => setNetworkFilter(value as 'all' | Network['network_kind'])}
          data={[
            { label: 'All', value: 'all' },
            { label: 'Segments', value: 'segment' },
            { label: 'Links', value: 'link' },
          ]}
        />
        {filteredNetworks.length ? (
          <NetworkList
            networks={filteredNetworks}
            selectedNetworkId={selectedNetworkId}
            onSelect={onSelectNetwork}
            onEdit={onEditNetwork}
            onDelete={onDeleteNetwork}
          />
        ) : (
          <Paper withBorder p="sm" radius="md" bg="gray.0">
            <Text size="sm" c="dimmed">
              No networks match the current search or kind filter.
            </Text>
          </Paper>
        )}
      </Stack>
    </Stack>
  );
}
