import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { NodeProps } from 'reactflow';
import { getNetworkBadgeColor, getNetworkKindLabel, getLayoutModeLabel } from '../networks/networkPresentation';
import { PerimeterHandles } from './PerimeterHandles';

type NetworkNodeData = {
  label: string;
  cidr: string;
  networkKind: 'segment' | 'link';
  vlanTag?: number | null;
  selected?: boolean;
  layoutMode: 'node' | 'container' | null;
  color?: string | null;
  hostCount: number;
  deviceCount: number;
  originCount: number;
  memberCount: number;
  notes?: string | null;
  dhcpEnabled: boolean;
  gatewayIp?: string | null;
  dnsServers: string[];
  activeHandleIds?: string[];
};

function SegmentNetworkNode({ data, accentColor }: { data: NetworkNodeData; accentColor: string }) {
  const isContainer = data.layoutMode === 'container';

  return (
    <Paper
      withBorder
      radius="lg"
      p={isContainer ? 'md' : 'sm'}
      miw={isContainer ? 300 : 220}
      mih={isContainer ? 140 : undefined}
      style={{
        borderColor: data.selected ? accentColor : `color-mix(in srgb, ${accentColor} 35%, #ced4da)`,
        background: isContainer
          ? `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 10%, white), rgba(255,255,255,0.98))`
          : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))',
      }}
    >
      <PerimeterHandles
        accentColor={accentColor}
        sourceFill={accentColor}
        targetFill="#ffffff"
        size={12}
        activeHandleIds={data.activeHandleIds}
      />
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Text fw={700} size="sm">
              {data.label}
            </Text>
            <Group gap="xs">
              <Badge variant="light" color="gray">
                {data.cidr}
              </Badge>
              <Badge variant={isContainer ? 'filled' : 'light'} color="cyan">
                {getLayoutModeLabel(data.layoutMode)}
              </Badge>
              {data.vlanTag ? <Badge color="cyan">VLAN {data.vlanTag}</Badge> : null}
            </Group>
          </Stack>
          <Badge variant="light" color={getNetworkBadgeColor(data.networkKind)}>
            {getNetworkKindLabel(data.networkKind)}
          </Badge>
        </Group>

        {data.notes ? (
          <Text size="xs" c="dimmed" lineClamp={3}>
            {data.notes}
          </Text>
        ) : null}

        <Group gap={8} wrap="wrap">
          <Badge variant="outline" size="sm" color={data.dhcpEnabled ? 'teal' : 'gray'}>
            DHCP {data.dhcpEnabled ? 'on' : 'off'}
          </Badge>
          {data.gatewayIp ? <Badge variant="outline" size="sm" color="blue">GW {data.gatewayIp}</Badge> : null}
          {data.dnsServers.map((dnsServer) => (
            <Badge key={dnsServer} variant="outline" size="sm" color="grape">
              DNS {dnsServer}
            </Badge>
          ))}
        </Group>

        <Group grow align="stretch" wrap="nowrap">
          <Paper radius="md" p="sm" style={{ border: `1px solid color-mix(in srgb, ${accentColor} 30%, #d0ebff)`, background: 'rgba(238, 242, 255, 0.7)' }}>
            <Stack gap={2}>
              <Text size="xs" tt="uppercase" fw={700} c="blue">Sources / uplinks</Text>
              <Text size="sm" fw={600}>{data.originCount}</Text>
            </Stack>
          </Paper>
          <Paper radius="md" p="sm" style={{ border: `1px solid color-mix(in srgb, ${accentColor} 26%, #c3fae8)`, background: 'rgba(235, 251, 238, 0.7)' }}>
            <Stack gap={2}>
              <Text size="xs" tt="uppercase" fw={700} c="teal">Members</Text>
              <Text size="sm" fw={600}>{data.memberCount}</Text>
            </Stack>
          </Paper>
        </Group>

        <Group justify="space-between" gap="xs">
          <Text size="xs" c="dimmed">
            {data.deviceCount} connected devices
          </Text>
          <Text size="xs" fw={600}>
            {data.hostCount} hosts
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}

function LinkNetworkNode({ data, accentColor }: { data: NetworkNodeData; accentColor: string }) {
  return (
    <Paper
      withBorder
      radius="xl"
      px="md"
      py="sm"
      miw={188}
      style={{
        borderColor: data.selected ? accentColor : `color-mix(in srgb, ${accentColor} 35%, #ced4da)`,
        background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 8%, white), rgba(255,255,255,0.98))`,
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
      }}
    >
      <PerimeterHandles
        accentColor={accentColor}
        sourceFill={accentColor}
        targetFill="#ffffff"
        size={10}
        activeHandleIds={data.activeHandleIds}
      />
      <Stack gap={6}>
        <Group justify="space-between" wrap="nowrap" align="center">
          <Stack gap={1}>
            <Text fw={700} size="sm">
              {data.label}
            </Text>
            <Text size="xs" c="dimmed">
              Shared link node
            </Text>
          </Stack>
          <Badge variant="light" color={getNetworkBadgeColor(data.networkKind)}>
            {getNetworkKindLabel(data.networkKind)}
          </Badge>
        </Group>

        <Group gap={6} wrap="wrap">
          <Badge variant="outline" size="sm" color="gray">
            {data.cidr}
          </Badge>
          <Badge variant="outline" size="sm" color="orange">
            {data.deviceCount} peers
          </Badge>
        </Group>

        {data.notes ? (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {data.notes}
          </Text>
        ) : null}
      </Stack>
    </Paper>
  );
}

export function NetworkNode({ data }: NodeProps<NetworkNodeData>) {
  const accentColor = data.color || (data.networkKind === 'link' ? '#c2410c' : data.layoutMode === 'container' ? '#0b7285' : '#495057');

  if (data.networkKind === 'link') {
    return <LinkNetworkNode data={data} accentColor={accentColor} />;
  }

  return <SegmentNetworkNode data={data} accentColor={accentColor} />;
}
