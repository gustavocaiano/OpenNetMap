import { ActionIcon, Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { Network } from '../../api/client';
import { getNetworkBadgeColor, getNetworkKindLabel, getLayoutModeLabel } from './networkPresentation';

type NetworkListProps = {
  networks: Network[];
  selectedNetworkId?: string | null;
  onSelect: (networkId: string) => void;
  onEdit: (networkId: string) => void;
  onDelete: (networkId: string) => void;
};

export function NetworkList({ networks, selectedNetworkId, onSelect, onEdit, onDelete }: NetworkListProps) {
  return (
    <Stack gap="xs">
      {networks.map((network) => (
        <Paper
          key={network.id}
          withBorder
          p="sm"
          radius="md"
          style={{ cursor: 'pointer', borderColor: selectedNetworkId === network.id ? (network.color || 'var(--mantine-color-teal-5)') : undefined }}
          onClick={() => onSelect(network.id)}
        >
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={2}>
              <Text fw={600} size="sm">
                {network.name}
              </Text>
              <Group gap="xs">
                <Badge size="sm" variant="light">
                  {network.cidr}
                </Badge>
                <Badge size="sm" variant="light" color={getNetworkBadgeColor(network.network_kind)}>
                  {getNetworkKindLabel(network.network_kind)}
                </Badge>
                {network.network_kind === 'segment' ? (
                  <Badge size="sm" variant={network.layout_mode === 'container' ? 'filled' : 'light'} color="cyan">
                    {getLayoutModeLabel(network.layout_mode)}
                  </Badge>
                ) : null}
                {network.vlan_tag ? <Badge size="sm">VLAN {network.vlan_tag}</Badge> : null}
                {network.color ? <Badge size="sm" variant="dot" color={network.color}>tint</Badge> : null}
                <Text size="xs" c="dimmed">
                  {network.network_kind === 'segment' ? `${network.host_count} hosts` : `${network.device_ids.length} peers`}
                </Text>
              </Group>
              {network.notes ? (
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {network.notes}
                </Text>
              ) : null}
            </Stack>
            <Group gap={4}>
              <ActionIcon variant="subtle" onClick={(event) => {
                event.stopPropagation();
                onEdit(network.id);
              }}>
                <IconPencil size={16} />
              </ActionIcon>
              <ActionIcon color="red" variant="subtle" onClick={(event) => {
                event.stopPropagation();
                onDelete(network.id);
              }}>
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
