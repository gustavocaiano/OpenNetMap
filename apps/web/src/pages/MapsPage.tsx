import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Anchor, Badge, Button, Card, Group, SimpleGrid, Stack, Text, TextInput, Textarea, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { createMap, deleteMap, listMaps } from '../api/maps';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { LoadingState } from '../components/common/LoadingState';
import { AppShell } from '../components/layout/AppShell';

export function MapsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mapToDelete, setMapToDelete] = useState<string | null>(null);

  const mapsQuery = useQuery({ queryKey: ['maps'], queryFn: listMaps });

  const createMutation = useMutation({
    mutationFn: createMap,
    onSuccess: () => {
      setName('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['maps'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMap,
    onSuccess: () => {
      setMapToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['maps'] });
    },
  });

  const mapCards = useMemo(() => mapsQuery.data ?? [], [mapsQuery.data]);

  return (
    <AppShell title="OpenNetMap">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={2}>Maps</Title>
          <Text c="dimmed">Create and manage network maps before opening the graph editor.</Text>
        </Stack>

        <Card withBorder radius="md" p="lg">
          <Stack>
            <Title order={4}>Create map</Title>
            <TextInput label="Name" value={name} onChange={(event) => setName(event.currentTarget.value)} placeholder="HQ network" />
            <Textarea label="Description" value={description} onChange={(event) => setDescription(event.currentTarget.value)} placeholder="Optional context" />
            <Group justify="flex-end">
              <Button
                loading={createMutation.isPending}
                disabled={!name.trim()}
                onClick={() => createMutation.mutate({ name: name.trim(), description: description.trim() || null })}
              >
                Create map
              </Button>
            </Group>
          </Stack>
        </Card>

        {mapsQuery.isLoading ? <LoadingState label="Loading maps" /> : null}
        {mapsQuery.isError ? <ErrorAlert message={(mapsQuery.error as Error).message} /> : null}

        {!mapsQuery.isLoading && !mapCards.length ? (
          <EmptyState title="No maps yet" description="Create your first map to start modeling devices, networks, and scan results." />
        ) : null}

        {mapCards.length ? (
          <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }}>
            {mapCards.map((map) => (
              <Card key={map.id} withBorder radius="md" p="lg">
                <Stack gap="md">
                  <Stack gap={4}>
                    <Title order={4}>{map.name}</Title>
                    <Text size="sm" c="dimmed">
                      {map.description || 'No description'}
                    </Text>
                    <Group gap="xs">
                      <Badge variant="light">{map.device_count} devices</Badge>
                      <Badge variant="light">{map.network_count} networks</Badge>
                      <Badge variant="light">{map.host_count} hosts</Badge>
                    </Group>
                  </Stack>
                  <Group justify="space-between">
                    <Anchor component={Link} to={`/maps/${map.id}`}>
                      Open editor
                    </Anchor>
                    <Button variant="subtle" color="red" onClick={() => setMapToDelete(map.id)}>
                      Delete
                    </Button>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        ) : null}

        <ConfirmDialog
          opened={Boolean(mapToDelete)}
          title="Delete map"
          message="This removes the map and its inventory from the frontend view."
          confirmLabel="Delete map"
          loading={deleteMutation.isPending}
          onClose={() => setMapToDelete(null)}
          onConfirm={() => mapToDelete && deleteMutation.mutate(mapToDelete)}
        />
      </Stack>
    </AppShell>
  );
}
