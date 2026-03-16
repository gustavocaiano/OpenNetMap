import { ActionIcon, Badge, Group, Paper, ScrollArea, Table, Text, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { Host } from '../../api/client';

type HostTableProps = {
  hosts: Host[];
  onEdit: (host: Host) => void;
  onDelete: (host: Host) => void;
  deletingHostId?: string | null;
};

export function HostTable({ hosts, onEdit, onDelete, deletingHostId }: HostTableProps) {
  return (
    <ScrollArea>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>IP</Table.Th>
            <Table.Th>Hostname</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Review</Table.Th>
            <Table.Th>Source</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {hosts.map((host) => (
            <Table.Tr key={host.id}>
              <Table.Td>
                <Paper p="xs" bg="gray.0" radius="sm">
                  <Text fw={700}>{host.ip_address}</Text>
                </Paper>
              </Table.Td>
              <Table.Td>{host.hostname ?? host.detected_hostname ?? '-'}</Table.Td>
              <Table.Td>{host.type}</Table.Td>
              <Table.Td>{host.needs_review ? <Badge color="yellow">Needs review</Badge> : <Text size="sm">No</Text>}</Table.Td>
              <Table.Td>
                <Badge variant="light" color={host.discovery_source === 'manual' ? 'teal' : 'gray'}>
                  {host.discovery_source}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group justify="flex-end">
                  <Tooltip label="Edit host">
                    <ActionIcon variant="subtle" onClick={() => onEdit(host)}>
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete host">
                    <ActionIcon color="red" variant="subtle" loading={deletingHostId === host.id} onClick={() => onDelete(host)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
