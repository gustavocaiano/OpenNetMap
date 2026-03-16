import { ActionIcon, Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { Device } from '../../api/client';
import { getDeviceVisual } from './deviceVisuals';

type DeviceListProps = {
  devices: Device[];
  selectedDeviceId?: string | null;
  onSelect: (deviceId: string) => void;
  onEdit: (deviceId: string) => void;
  onDelete: (deviceId: string) => void;
};

export function DeviceList({ devices, selectedDeviceId, onSelect, onEdit, onDelete }: DeviceListProps) {
  return (
    <Stack gap="xs">
      {devices.map((device) => {
        const visual = getDeviceVisual(device.type);
        const Icon = visual.icon;

        return (
          <Paper
            key={device.id}
            withBorder
            p="sm"
            radius="md"
            style={{
              cursor: 'pointer',
              borderColor: selectedDeviceId === device.id ? visual.color : undefined,
            }}
            onClick={() => onSelect(device.id)}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="xs" wrap="nowrap">
                <Paper radius="md" p={6} style={{ backgroundColor: visual.softColor, color: visual.color, lineHeight: 0 }}>
                  <Icon size={16} />
                </Paper>
                <Stack gap={2}>
                  <Text fw={600} size="sm">
                    {device.name}
                  </Text>
                  <Group gap="xs">
                    <Badge size="sm" variant="light" color={visual.color}>
                      {visual.label}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {device.network_ids.length} linked
                    </Text>
                  </Group>
                  {device.notes ? (
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {device.notes}
                    </Text>
                  ) : null}
                </Stack>
              </Group>
              <Group gap={4}>
                <ActionIcon variant="subtle" onClick={(event) => {
                  event.stopPropagation();
                  onEdit(device.id);
                }}>
                  <IconPencil size={16} />
                </ActionIcon>
                <ActionIcon color="red" variant="subtle" onClick={(event) => {
                  event.stopPropagation();
                  onDelete(device.id);
                }}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}
