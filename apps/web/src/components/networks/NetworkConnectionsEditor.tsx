import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Collapse,
  ColorInput,
  Group,
  Paper,
  ScrollArea,
  Select,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconPlus, IconTrash } from '@tabler/icons-react';
import { AnchorPreference, Device, DeviceNetworkLink, Network } from '../../api/client';
import { getDeviceVisual } from '../devices/deviceVisuals';
import { getNetworkRoleLabels } from './networkPresentation';

type ConnectionDraft = {
  role: 'origin' | 'member';
  ip_address: string;
  label: string;
  color: string;
  device_anchor: AnchorPreference;
  network_anchor: AnchorPreference;
};

type ConnectionPayload = {
  role?: 'origin' | 'member';
  ip_address?: string | null;
  label?: string | null;
  color?: string | null;
  device_anchor?: AnchorPreference | null;
  network_anchor?: AnchorPreference | null;
};

type NetworkConnectionsEditorProps = {
  network: Network;
  devices: Device[];
  links: DeviceNetworkLink[];
  loading?: boolean;
  onUpsertConnection: (deviceId: string, values: ConnectionPayload) => void;
  onRemoveConnection: (deviceId: string) => void;
};

const anchorOptions = [
  { value: 'auto', label: 'Auto' },
  { value: 'top', label: 'Top' },
  { value: 'right', label: 'Right' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
] as const;

function createDraft(link?: DeviceNetworkLink, role: 'origin' | 'member' = 'member'): ConnectionDraft {
  return {
    role: link?.role ?? role,
    ip_address: link?.ip_address ?? '',
    label: link?.label ?? '',
    color: link?.color ?? '',
    device_anchor: link?.device_anchor ?? 'auto',
    network_anchor: link?.network_anchor ?? 'auto',
  };
}

function toPayload(draft: ConnectionDraft): ConnectionPayload {
  return {
    role: draft.role,
    ip_address: draft.ip_address.trim() || null,
    label: draft.label.trim() || null,
    color: draft.color.trim() || null,
    device_anchor: draft.device_anchor,
    network_anchor: draft.network_anchor,
  };
}

function getRoleBadgeColor(role: 'origin' | 'member') {
  return role === 'origin' ? 'blue' : 'teal';
}

function getAnchorSummary(anchor: AnchorPreference) {
  return anchor === 'auto' ? 'Auto' : anchor;
}

export function NetworkConnectionsEditor({ network, devices, links, loading, onUpsertConnection, onRemoveConnection }: NetworkConnectionsEditorProps) {
  const [drafts, setDrafts] = useState<Record<string, ConnectionDraft>>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [newDeviceId, setNewDeviceId] = useState<string | null>(null);
  const [newDraft, setNewDraft] = useState<ConnectionDraft>(createDraft(undefined, 'member'));

  useEffect(() => {
    setDrafts(Object.fromEntries(links.map((link) => [link.device_id, createDraft(link)])));
  }, [links]);

  const devicesById = useMemo(() => new Map(devices.map((device) => [device.id, device])), [devices]);
  const connectedDeviceIds = new Set(links.map((link) => link.device_id));
  const availableDeviceOptions = devices
    .filter((device) => !connectedDeviceIds.has(device.id))
    .map((device) => ({ value: device.id, label: `${device.name} (${getDeviceVisual(device.type).label})` }));
  const roleLabels = getNetworkRoleLabels(network.network_kind);
  const originCount = links.filter((link) => link.role === 'origin').length;
  const memberCount = links.filter((link) => link.role === 'member').length;

  return (
    <Stack gap="md">
      <Paper withBorder p="sm" radius="md" bg="gray.0">
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Text fw={600} size="sm">
                Attach device
              </Text>
              <Text size="xs" c="dimmed">
                Add the device first, then open advanced options only when a link needs custom color or anchors.
              </Text>
            </Stack>
            <Group gap="xs">
              <Badge variant="light" color="blue">
                {originCount} {roleLabels.origin.toLowerCase()}
              </Badge>
              <Badge variant="light" color="teal">
                {memberCount} {roleLabels.member.toLowerCase()}
              </Badge>
            </Group>
          </Group>

          <Group align="flex-end" wrap="wrap">
            <Select
              style={{ flex: '1 1 220px' }}
              label="Device"
              data={availableDeviceOptions}
              value={newDeviceId}
              onChange={setNewDeviceId}
              placeholder={availableDeviceOptions.length ? 'Select a device' : 'All devices already linked'}
              searchable
              disabled={!availableDeviceOptions.length}
            />
            <SegmentedControl
              value={newDraft.role}
              onChange={(value) => setNewDraft((current) => ({ ...current, role: value as 'origin' | 'member' }))}
              data={[
                { label: roleLabels.origin, value: 'origin' },
                { label: roleLabels.member, value: 'member' },
              ]}
            />
            <TextInput
              style={{ flex: '1 1 140px' }}
              label="Label"
              placeholder={network.network_kind === 'segment' ? 'Gateway, access switch' : 'WAN handoff'}
              value={newDraft.label}
              onChange={(event) => setNewDraft((current) => ({ ...current, label: event.currentTarget.value }))}
            />
            <TextInput
              style={{ flex: '1 1 140px' }}
              label="IP"
              placeholder={newDraft.role === 'origin' ? '192.168.10.1' : '192.168.10.25'}
              value={newDraft.ip_address}
              onChange={(event) => setNewDraft((current) => ({ ...current, ip_address: event.currentTarget.value }))}
            />
            <Button
              leftSection={<IconPlus size={16} />}
              loading={loading}
              disabled={!newDeviceId}
              onClick={() => {
                if (!newDeviceId) {
                  return;
                }

                onUpsertConnection(newDeviceId, toPayload(newDraft));
                setNewDeviceId(null);
                setNewDraft(createDraft(undefined, 'member'));
              }}
            >
              Add
            </Button>
          </Group>

          <Collapse in={Boolean(newDeviceId)}>
            <Group grow mt="sm" align="flex-start">
              <ColorInput
                label="Color override"
                placeholder="#1971c2"
                value={newDraft.color}
                onChange={(value) => setNewDraft((current) => ({ ...current, color: value }))}
                swatches={['#1971c2', '#0b7285', '#099268', '#c92a2a', '#f08c00', '#7c2d12']}
              />
              <Select
                label="Device anchor"
                data={anchorOptions as unknown as { value: string; label: string }[]}
                value={newDraft.device_anchor}
                onChange={(value) => value && setNewDraft((current) => ({ ...current, device_anchor: value as AnchorPreference }))}
              />
              <Select
                label="Network anchor"
                data={anchorOptions as unknown as { value: string; label: string }[]}
                value={newDraft.network_anchor}
                onChange={(value) => value && setNewDraft((current) => ({ ...current, network_anchor: value as AnchorPreference }))}
              />
            </Group>
          </Collapse>
        </Stack>
      </Paper>

      {links.length ? (
        <ScrollArea>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Device</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Label</Table.Th>
                <Table.Th>IP</Table.Th>
                <Table.Th>Anchors</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {links.map((link) => {
                const device = devicesById.get(link.device_id);
                if (!device) {
                  return null;
                }

                const draft = drafts[link.device_id] ?? createDraft(link);
                const visual = getDeviceVisual(device.type);
                const isExpanded = expandedRow === link.device_id;

                return (
                  <Fragment key={link.device_id}>
                    <Table.Tr key={link.device_id}>
                      <Table.Td>
                        <Stack gap={2}>
                          <Group gap="xs" wrap="nowrap">
                            <Badge size="sm" variant="light" color={visual.color}>
                              {visual.label}
                            </Badge>
                            <Text fw={600} size="sm">
                              {device.name}
                            </Text>
                          </Group>
                          {device.notes ? (
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {device.notes}
                            </Text>
                          ) : null}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Select
                          w={132}
                          data={[
                            { value: 'origin', label: roleLabels.origin },
                            { value: 'member', label: roleLabels.member },
                          ]}
                          value={draft.role}
                          onChange={(value) => value && setDrafts((current) => ({ ...current, [link.device_id]: { ...draft, role: value as 'origin' | 'member' } }))}
                        />
                      </Table.Td>
                      <Table.Td>
                        <TextInput
                          miw={150}
                          placeholder="Optional label"
                          value={draft.label}
                          onChange={(event) => setDrafts((current) => ({ ...current, [link.device_id]: { ...draft, label: event.currentTarget.value } }))}
                        />
                      </Table.Td>
                      <Table.Td>
                        <TextInput
                          miw={135}
                          placeholder="Optional IP"
                          value={draft.ip_address}
                          onChange={(event) => setDrafts((current) => ({ ...current, [link.device_id]: { ...draft, ip_address: event.currentTarget.value } }))}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={2}>
                          <Badge variant="light" color={getRoleBadgeColor(draft.role)}>
                            {draft.role === 'origin' ? roleLabels.origin : roleLabels.member}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {getAnchorSummary(draft.device_anchor)} {'->'} {getAnchorSummary(draft.network_anchor)}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                          <ActionIcon
                            variant="subtle"
                            onClick={() => setExpandedRow(isExpanded ? null : link.device_id)}
                            aria-label={isExpanded ? 'Hide advanced settings' : 'Show advanced settings'}
                          >
                            {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                          </ActionIcon>
                          <Button size="xs" loading={loading} onClick={() => onUpsertConnection(link.device_id, toPayload(draft))}>
                            Save
                          </Button>
                          <ActionIcon color="red" variant="subtle" onClick={() => onRemoveConnection(link.device_id)} aria-label="Remove connection">
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>

                    <Table.Tr>
                      <Table.Td colSpan={6} py={0}>
                        <Collapse in={isExpanded}>
                          <Paper withBorder p="sm" radius="md" my="sm" bg="gray.0">
                            <Group grow align="flex-start">
                              <ColorInput
                                label="Color override"
                                placeholder="#1971c2"
                                value={draft.color}
                                onChange={(value) => setDrafts((current) => ({ ...current, [link.device_id]: { ...draft, color: value } }))}
                                swatches={['#1971c2', '#0b7285', '#099268', '#c92a2a', '#f08c00', '#7c2d12']}
                              />
                              <Select
                                label="Device anchor"
                                data={anchorOptions as unknown as { value: string; label: string }[]}
                                value={draft.device_anchor}
                                onChange={(value) => value && setDrafts((current) => ({ ...current, [link.device_id]: { ...draft, device_anchor: value as AnchorPreference } }))}
                              />
                              <Select
                                label="Network anchor"
                                data={anchorOptions as unknown as { value: string; label: string }[]}
                                value={draft.network_anchor}
                                onChange={(value) => value && setDrafts((current) => ({ ...current, [link.device_id]: { ...draft, network_anchor: value as AnchorPreference } }))}
                              />
                            </Group>
                          </Paper>
                        </Collapse>
                      </Table.Td>
                    </Table.Tr>
                  </Fragment>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      ) : (
        <Paper withBorder p="sm" radius="md" bg="gray.0">
          <Text size="sm" c="dimmed">
            No devices are attached yet. Add the upstream side first, then fill in members as needed.
          </Text>
        </Paper>
      )}
    </Stack>
  );
}
