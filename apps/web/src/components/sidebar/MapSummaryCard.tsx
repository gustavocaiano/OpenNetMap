import { Badge, Group, Paper, Stack, Text } from '@mantine/core';

type MapSummaryCardProps = {
  devices: number;
  networks: number;
  hosts: number;
};

export function MapSummaryCard({ devices, networks, hosts }: MapSummaryCardProps) {
  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="xs">
        <Text fw={600}>Map summary</Text>
        <Group gap="xs">
          <Badge variant="light">{devices} devices</Badge>
          <Badge variant="light">{networks} networks</Badge>
          <Badge variant="light">{hosts} hosts</Badge>
        </Group>
      </Stack>
    </Paper>
  );
}
