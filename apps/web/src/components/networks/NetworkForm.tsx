import { Alert, Badge, Button, Checkbox, ColorInput, Group, MultiSelect, NumberInput, Paper, SegmentedControl, SimpleGrid, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconInfoCircle } from '@tabler/icons-react';
import { Device, DeviceNetworkLink, Network } from '../../api/client';
import { ErrorAlert } from '../common/ErrorAlert';
import { getLayoutModeLabel, getNetworkKindDescription, getNetworkKindLabel, getNetworkRoleLabels } from './networkPresentation';

export type NetworkFormValues = {
  name: string;
  cidr: string;
  network_kind: 'segment' | 'link';
  layout_mode: 'node' | 'container';
  color: string;
  vlan_tag: number | '';
  notes: string;
  dhcp_enabled: boolean;
  gateway_ip: string;
  dns_servers: string;
  origin_device_ids: string[];
  member_device_ids: string[];
};

type NetworkFormProps = {
  devices: Device[];
  initialValue?: Partial<Network>;
  initialLinks?: DeviceNetworkLink[];
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: NetworkFormValues) => void;
};

function getInitialDeviceIds(links: DeviceNetworkLink[] | undefined, role: 'origin' | 'member') {
  return links?.filter((link) => link.role === role).map((link) => link.device_id) ?? [];
}

export function NetworkForm({ devices, initialValue, initialLinks, loading, error, onSubmit }: NetworkFormProps) {
  const form = useForm<NetworkFormValues>({
    initialValues: {
      name: initialValue?.name ?? '',
      cidr: initialValue?.cidr ?? '',
      network_kind: initialValue?.network_kind ?? 'segment',
      layout_mode: initialValue?.layout_mode ?? 'container',
      color: initialValue?.color ?? '',
      vlan_tag: initialValue?.vlan_tag ?? '',
      notes: initialValue?.notes ?? '',
      dhcp_enabled: initialValue?.dhcp_enabled ?? false,
      gateway_ip: initialValue?.gateway_ip ?? '',
      dns_servers: initialValue?.dns_servers?.join(', ') ?? '',
      origin_device_ids: getInitialDeviceIds(initialLinks, 'origin'),
      member_device_ids: getInitialDeviceIds(initialLinks, 'member'),
    },
  });

  const kindLabels = getNetworkRoleLabels(form.values.network_kind);
  const originOptions = devices
    .filter((device) => !form.values.member_device_ids.includes(device.id))
    .map((device) => ({ value: device.id, label: `${device.name} (${device.type})` }));

  const memberOptions = devices
    .filter((device) => !form.values.origin_device_ids.includes(device.id))
    .map((device) => ({ value: device.id, label: `${device.name} (${device.type})` }));

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap="md">
        {error ? <ErrorAlert message={error} /> : null}
        <Paper withBorder p="md" radius="md">
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Stack gap={2}>
                <Text fw={600}>Network identity</Text>
                <Text size="sm" c="dimmed">
                  Start with the network kind and address range, then attach the right devices.
                </Text>
              </Stack>
              <Badge variant="light" color={form.values.network_kind === 'segment' ? 'cyan' : 'orange'}>
                {getNetworkKindLabel(form.values.network_kind)}
              </Badge>
            </Group>

            <SegmentedControl
              fullWidth
              data={[
                { label: getNetworkKindLabel('segment'), value: 'segment' },
                { label: getNetworkKindLabel('link'), value: 'link' },
              ]}
              {...form.getInputProps('network_kind')}
            />

            <Alert variant="light" color={form.values.network_kind === 'segment' ? 'cyan' : 'orange'} icon={<IconInfoCircle size={16} />}>
              <Stack gap={4}>
                <Text size="sm" fw={600}>{getNetworkKindDescription(form.values.network_kind)}</Text>
                <Text size="sm">
                  {form.values.network_kind === 'segment'
                    ? 'Use this for subnet-style LANs with hosts, DHCP, gateway settings, and a clear upstream/downstream map shape.'
                    : 'Use this for direct or shared connectivity between devices. The map renders it as a compact link chip instead of a large LAN area.'}
                </Text>
              </Stack>
            </Alert>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput label="Name" placeholder="Office LAN" required {...form.getInputProps('name')} />
              <TextInput
                label={form.values.network_kind === 'segment' ? 'CIDR' : 'CIDR or link range'}
                placeholder={form.values.network_kind === 'segment' ? '192.168.10.0/24' : '10.0.0.0/31'}
                required
                {...form.getInputProps('cidr')}
              />
              <ColorInput label="Color" placeholder="#0b7285" {...form.getInputProps('color')} />
              <NumberInput label="VLAN tag" placeholder="10" min={1} max={4094} {...form.getInputProps('vlan_tag')} />
            </SimpleGrid>
          </Stack>
        </Paper>

        {form.values.network_kind === 'segment' ? (
          <Paper withBorder p="md" radius="md">
            <Stack gap="md">
              <Stack gap={2}>
                <Text fw={600}>LAN behavior</Text>
                <Text size="sm" c="dimmed">
                  Keep addressing and discovery settings together so subnet changes are easier to review.
                </Text>
              </Stack>

              <SegmentedControl
                fullWidth
                data={[
                  { label: getLayoutModeLabel('container'), value: 'container' },
                  { label: getLayoutModeLabel('node'), value: 'node' },
                ]}
                {...form.getInputProps('layout_mode')}
              />

              <Checkbox label="DHCP enabled" {...form.getInputProps('dhcp_enabled', { type: 'checkbox' })} />

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput label="Gateway IP" placeholder="192.168.10.1" {...form.getInputProps('gateway_ip')} />
                <TextInput
                  label="DNS servers"
                  description="Comma-separated list"
                  placeholder="1.1.1.1, 8.8.8.8"
                  {...form.getInputProps('dns_servers')}
                />
              </SimpleGrid>
            </Stack>
          </Paper>
        ) : null}

        <Paper withBorder p="md" radius="md">
          <Stack gap="md">
            <Stack gap={2}>
              <Text fw={600}>Attached devices</Text>
              <Text size="sm" c="dimmed">
                Assign the upstream side first, then add downstream members or secondary peers.
              </Text>
            </Stack>

            <MultiSelect
              label={kindLabels.origin}
              description={form.values.network_kind === 'segment' ? 'Devices that feed or originate this LAN.' : 'Optional primary peers for this shared link.'}
              data={originOptions}
              searchable
              {...form.getInputProps('origin_device_ids')}
            />
            <MultiSelect
              label={kindLabels.member}
              description={form.values.network_kind === 'segment' ? 'Devices that sit on this segment.' : 'Other devices attached to this shared link.'}
              data={memberOptions}
              searchable
              {...form.getInputProps('member_device_ids')}
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Notes</Text>
            <Textarea label="Context" placeholder="Purpose, cabling notes, review reminders" minRows={3} {...form.getInputProps('notes')} />
          </Stack>
        </Paper>

        <Button type="submit" loading={loading}>
          Save network
        </Button>
      </Stack>
    </form>
  );
}
