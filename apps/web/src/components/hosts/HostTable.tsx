import { ActionIcon, Badge, Group, Paper, ScrollArea, Table, Text } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import { Host } from '../../api/client';

type HostTableProps = {
  hosts: Host[];
  onEdit: (host: Host) => void;
};

export function HostTable({ hosts, onEdit }: HostTableProps) {
  return (
    <ScrollArea>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>IP</Table.Th>
            <Table.Th>Hostname</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Review</Table.Th>
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
              <Table.Td>{host.hostname ?? '-'}</Table.Td>
              <Table.Td>{host.type ?? '-'}</Table.Td>
              <Table.Td>{host.needs_review ? <Badge color="yellow">Needs review</Badge> : <Text size="sm">No</Text>}</Table.Td>
              <Table.Td>
                <Group justify="flex-end">
                  <ActionIcon variant="subtle" onClick={() => onEdit(host)}>
                    <IconPencil size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
