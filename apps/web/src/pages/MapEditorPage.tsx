import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { createDevice, deleteDevice, patchDevicePosition, updateDevice } from '../api/devices';
import { updateHost } from '../api/hosts';
import { getMap, getMapGraph } from '../api/maps';
import { createNetwork, deleteNetwork, linkDeviceToNetwork, listNetworkHosts, patchNetworkPosition, unlinkDeviceFromNetwork, updateNetwork } from '../api/networks';
import { createNetworkScan, getScanJob, listNetworkScanJobs } from '../api/scanJobs';
import { getErrorMessage, Host, LatestScanJobSummary, Network, ScanJob } from '../api/client';
import { MapEditorHeader } from '../components/common/MapEditorHeader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { LoadingState } from '../components/common/LoadingState';
import { DeviceForm, DeviceFormValues } from '../components/devices/DeviceForm';
import { buildGraphElements } from '../components/graph/graphTransform';
import { MapCanvas } from '../components/graph/MapCanvas';
import { EmptyInspector } from '../components/inspector/EmptyInspector';
import { InspectorDrawer } from '../components/inspector/InspectorDrawer';
import { AppShell } from '../components/layout/AppShell';
import { HostFormValues } from '../components/hosts/HostForm';
import { NetworkDetailPanel } from '../components/networks/NetworkDetailPanel';
import { NetworkForm, NetworkFormValues } from '../components/networks/NetworkForm';
import { InventorySidebar } from '../components/sidebar/InventorySidebar';

type DrawerMode =
  | { kind: 'empty' }
  | { kind: 'create-device' }
  | { kind: 'edit-device'; deviceId: string }
  | { kind: 'create-network' }
  | { kind: 'edit-network'; networkId: string }
  | { kind: 'network-detail'; networkId: string };

function normalizeDevicePayload(values: DeviceFormValues) {
  return {
    name: values.name.trim(),
    type: values.type,
    notes: values.notes.trim() || null,
  };
}

function normalizeNetworkPayload(values: NetworkFormValues) {
  return {
    name: values.name.trim(),
    cidr: values.cidr.trim(),
    network_kind: values.network_kind,
    layout_mode: values.network_kind === 'segment' ? values.layout_mode : null,
    color: values.color.trim() || null,
    vlan_tag: values.vlan_tag === '' ? null : values.vlan_tag,
    notes: values.notes.trim() || null,
    dhcp_enabled: values.dhcp_enabled,
    gateway_ip: values.gateway_ip.trim() || null,
    dns_servers: values.dns_servers
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  };
}

function buildRoleLinks(values: NetworkFormValues) {
  return [
    ...values.origin_device_ids.map((deviceId) => ({ deviceId, role: 'origin' as const })),
    ...values.member_device_ids.map((deviceId) => ({ deviceId, role: 'member' as const })),
  ];
}

function normalizeHostPayload(values: HostFormValues) {
  return {
    ip_address: values.ip_address.trim(),
    hostname: values.hostname.trim() || null,
    type: values.type.trim() || null,
    notes: values.notes.trim() || null,
    needs_review: values.needs_review,
  };
}

type PartialNetworkCreateError = Error & {
  createdNetwork?: Network;
};

export function MapEditorPage() {
  const { mapId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [drawerMode, setDrawerMode] = useState<DrawerMode>({ kind: 'empty' });
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'device' | 'network'; id: string } | null>(null);
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [lastActiveStatus, setLastActiveStatus] = useState<ScanJob['status'] | null>(null);

  const mapQuery = useQuery({ queryKey: ['map', mapId], queryFn: () => getMap(mapId), enabled: Boolean(mapId) });
  const graphQuery = useQuery({
    queryKey: ['map-graph', mapId],
    queryFn: () => getMapGraph(mapId),
    enabled: Boolean(mapId),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.networks.some((network) => network.latest_scan_job && (network.latest_scan_job.status === 'pending' || network.latest_scan_job.status === 'running'))
        ? 4000
        : false;
    },
  });

  const graph = graphQuery.data;
  const devices = graph?.devices ?? [];
  const networks = graph?.networks ?? [];
  const selectedNetworkId = drawerMode.kind === 'edit-network' || drawerMode.kind === 'network-detail' ? drawerMode.networkId : null;
  const selectedDeviceId = drawerMode.kind === 'edit-device' ? drawerMode.deviceId : null;
  const selectedNetwork = networks.find((network) => network.id === selectedNetworkId);
  const selectedNetworkIsSegment = selectedNetwork?.network_kind === 'segment';

  const hostsQuery = useQuery({
    queryKey: ['network-hosts', selectedNetworkId],
    queryFn: () => listNetworkHosts(selectedNetworkId!),
    enabled: Boolean(selectedNetworkId && selectedNetworkIsSegment),
  });

  const scanJobsQuery = useQuery({
    queryKey: ['scan-jobs', selectedNetworkId],
    queryFn: () => listNetworkScanJobs(selectedNetworkId!),
    enabled: Boolean(selectedNetworkId && selectedNetworkIsSegment),
    refetchInterval: (query) => {
      const jobs = (query.state.data ?? []) as ScanJob[];
      return jobs.some((job) => job.status === 'pending' || job.status === 'running') ? 3000 : false;
    },
  });

  const selectedDevice = devices.find((device) => device.id === selectedDeviceId);
  const selectedHosts = selectedNetworkIsSegment ? (hostsQuery.data ?? graph?.hosts.filter((host) => host.network_id === selectedNetworkId) ?? []) : [];
  const selectedNetworkLinks = graph?.device_network_links.filter((link) => link.network_id === selectedNetworkId) ?? [];
  const activeMapScans = useMemo(
    () =>
      networks
        .filter((network) => network.latest_scan_job && (network.latest_scan_job.status === 'pending' || network.latest_scan_job.status === 'running'))
        .map((network) => ({ network, job: network.latest_scan_job! })),
    [networks],
  );

  const resetNetworkFormMutations = () => {
    createNetworkMutation.reset();
    updateNetworkMutation.reset();
  };

  const openCreateNetworkDrawer = () => {
    resetNetworkFormMutations();
    setDrawerMode({ kind: 'create-network' });
  };

  const openEditNetworkDrawer = (networkId: string) => {
    resetNetworkFormMutations();
    setDrawerMode({ kind: 'edit-network', networkId });
  };

  const activeScanJob = useMemo<ScanJob | LatestScanJobSummary | undefined>(() => {
    const jobs = scanJobsQuery.data ?? [];
    return jobs.find((job) => job.status === 'pending' || job.status === 'running') ?? jobs[0] ?? selectedNetwork?.latest_scan_job ?? undefined;
  }, [scanJobsQuery.data, selectedNetwork?.latest_scan_job]);

  const activeScanJobQuery = useQuery({
    queryKey: ['scan-job', activeScanJob?.id],
    queryFn: () => getScanJob(activeScanJob!.id),
    enabled: Boolean(selectedNetworkIsSegment && activeScanJob?.id && (activeScanJob.status === 'pending' || activeScanJob.status === 'running')),
    refetchInterval: 3000,
  });

  useEffect(() => {
    const status = activeScanJobQuery.data?.status ?? activeScanJob?.status ?? null;
    if (!status) {
      setLastActiveStatus(null);
      return;
    }

    if ((lastActiveStatus === 'pending' || lastActiveStatus === 'running') && (status === 'succeeded' || status === 'failed')) {
      queryClient.invalidateQueries({ queryKey: ['map', mapId] });
      queryClient.invalidateQueries({ queryKey: ['maps'] });
      queryClient.invalidateQueries({ queryKey: ['map-graph', mapId] });
      queryClient.invalidateQueries({ queryKey: ['network-hosts', selectedNetworkId] });
      queryClient.invalidateQueries({ queryKey: ['scan-jobs', selectedNetworkId] });
    }

    setLastActiveStatus(status);
  }, [activeScanJob?.status, activeScanJobQuery.data?.status, lastActiveStatus, mapId, queryClient, selectedNetworkId]);

  const createDeviceMutation = useMutation({
    mutationFn: (values: DeviceFormValues) => createDevice(mapId, normalizeDevicePayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map', mapId] });
      queryClient.invalidateQueries({ queryKey: ['maps'] });
      queryClient.invalidateQueries({ queryKey: ['map-graph', mapId] });
      setDrawerMode({ kind: 'empty' });
    },
  });

  const updateDeviceMutation = useMutation({
    mutationFn: ({ deviceId, values }: { deviceId: string; values: DeviceFormValues }) => updateDevice(deviceId, normalizeDevicePayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map-graph', mapId] });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: (deviceId: string) => deleteDevice(deviceId),
    onSuccess: () => {
      setConfirmDelete(null);
      setDrawerMode({ kind: 'empty' });
      queryClient.invalidateQueries({ queryKey: ['map', mapId] });
      queryClient.invalidateQueries({ queryKey: ['maps'] });
      queryClient.invalidateQueries({ queryKey: ['map-graph', mapId] });
    },
  });

  const createNetworkMutation = useMutation({
    mutationFn: async (values: NetworkFormValues) => {
      const created = await createNetwork(mapId, normalizeNetworkPayload(values));
      try {
        await Promise.all(buildRoleLinks(values).map(({ deviceId, role }) => linkDeviceToNetwork(deviceId, created.id, { role })));
      } catch (error) {
        const wrappedError = new Error(
          `Network was created, but linking selected devices failed: ${getErrorMessage(error)}`,
        ) as PartialNetworkCreateError;
        wrappedError.createdNetwork = created;
        throw wrappedError;
      }
      return created;
    },
    onSuccess: (network) => {
      queryClient.invalidateQueries({ queryKey: ['map', mapId] });
      queryClient.invalidateQueries({ queryKey: ['maps'] });
      queryClient.invalidateQueries({ queryKey: ['map-graph', mapId] });
      setDrawerMode({ kind: 'network-detail', networkId: network.id });
    },
    onError: (error) => {
      const createdNetwork = (error as PartialNetworkCreateError).createdNetwork;
      if (createdNetwork) {
        queryClient.invalidateQueries({ queryKey: ['map', mapId] });
        queryClient.invalidateQueries({ queryKey: ['maps'] });
        queryClient.invalidateQueries({ queryKey: ['map-graph', mapId] });
      }
    },
  });

  const updateNetworkMutation = useMutation({
    mutationFn: async ({ network, links, values }: { network: Network; links: typeof selectedNetworkLinks; values: NetworkFormValues }) => {
      const updated = await updateNetwork(network.id, normalizeNetworkPayload(values));
      const currentByDeviceId = new Map(links.map((link) => [link.device_id, link]));
      const nextLinks = buildRoleLinks(values);
      const nextIds = new Set(nextLinks.map((link) => link.deviceId));
      const toLink = nextLinks.filter(({ deviceId, role }) => currentByDeviceId.get(deviceId)?.role !== role);
      const toUnlink = links.filter((link) => !nextIds.has(link.device_id));

      await Promise.all([
        ...toLink.map(({ deviceId, role }) => linkDeviceToNetwork(deviceId, network.id, { role })),
        ...toUnlink.map((link) => unlinkDeviceFromNetwork(link.device_id, network.id)),
      ]);

      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['map-graph', mapId] });
      setDrawerMode({ kind: 'network-detail', networkId: variables.network.id });
    },
  });

  const deleteNetworkMutation = useMutation({
    mutationFn: (networkId: string) => deleteNetwork(networkId),
    onSuccess: () => {
      setConfirmDelete(null);
      setDrawerMode({ kind: 'empty' });
      queryClient.invalidateQueries({ queryKey: ['map', mapId] });
      queryClient.invalidateQueries({ queryKey: ['maps'] });
      queryClient.invalidateQueries({ queryKey: ['map-graph', mapId] });
    },
  });

  const upsertConnectionMutation = useMutation({
    mutationFn: ({ deviceId, networkId, values }: { deviceId: string; networkId: string; values: { role?: 'origin' | 'member'; ip_address?: string | null; label?: string | null; color?: string | null; device_anchor?: 'auto' | 'top' | 'right' | 'bottom' | 'left' | null; network_anchor?: 'auto' | 'top' | 'right' | 'bottom' | 'left' | null } }) =>
      linkDeviceToNetwork(deviceId, networkId, values),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['map-graph', mapId] });
      setDrawerMode({ kind: 'network-detail', networkId: variables.networkId });
    },
  });

  const removeConnectionMutation = useMutation({
    mutationFn: ({ deviceId, networkId }: { deviceId: string; networkId: string }) => unlinkDeviceFromNetwork(deviceId, networkId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['map-graph', mapId] });
      setDrawerMode({ kind: 'network-detail', networkId: variables.networkId });
    },
  });

  const patchPositionMutation = useMutation({
    mutationFn: async ({ entityType, entityId, x, y }: { entityType: 'device' | 'network'; entityId: string; x: number; y: number }) => {
      if (entityType === 'device') {
        await patchDevicePosition(entityId, { pos_x: x, pos_y: y });
        return;
      }

      await patchNetworkPosition(entityId, { pos_x: x, pos_y: y });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map-graph', mapId] });
    },
  });

  const scanMutation = useMutation({
    mutationFn: (networkId: string) => createNetworkScan(networkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan-jobs', selectedNetworkId] });
      queryClient.invalidateQueries({ queryKey: ['map-graph', mapId] });
    },
  });

  const updateHostMutation = useMutation({
    mutationFn: ({ hostId, values }: { hostId: string; values: HostFormValues }) => updateHost(hostId, normalizeHostPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map', mapId] });
      queryClient.invalidateQueries({ queryKey: ['maps'] });
      queryClient.invalidateQueries({ queryKey: ['network-hosts', selectedNetworkId] });
      queryClient.invalidateQueries({ queryKey: ['map-graph', mapId] });
      setEditingHost(null);
    },
  });

  const elements = useMemo(
    () => (graph ? buildGraphElements(graph, { selectedNetworkId, selectedHostNetworkHosts: selectedHosts }) : { nodes: [], edges: [] }),
    [graph, selectedHosts, selectedNetworkId],
  );

  const sidebar = graph ? (
    <InventorySidebar
      devices={devices}
      networks={networks}
      hostCount={graph.map.host_count}
      selectedDeviceId={selectedDeviceId}
      selectedNetworkId={selectedNetworkId}
      onCreateDevice={() => setDrawerMode({ kind: 'create-device' })}
      onCreateNetwork={openCreateNetworkDrawer}
      onSelectDevice={(deviceId) => setDrawerMode({ kind: 'edit-device', deviceId })}
      onSelectNetwork={(networkId) => setDrawerMode({ kind: 'network-detail', networkId })}
      onEditDevice={(deviceId) => setDrawerMode({ kind: 'edit-device', deviceId })}
      onEditNetwork={openEditNetworkDrawer}
      onDeleteDevice={(id) => setConfirmDelete({ type: 'device', id })}
      onDeleteNetwork={(id) => setConfirmDelete({ type: 'network', id })}
    />
  ) : null;

  let drawerTitle = 'Inspector';
  let drawerContent = <EmptyInspector />;

  if (drawerMode.kind === 'create-device') {
    drawerTitle = 'Create device';
    drawerContent = <DeviceForm loading={createDeviceMutation.isPending} onSubmit={(values) => createDeviceMutation.mutate(values)} />;
  }

  if (drawerMode.kind === 'edit-device' && selectedDevice) {
    drawerTitle = selectedDevice.name;
    drawerContent = (
      <DeviceForm
        initialValue={selectedDevice}
        loading={updateDeviceMutation.isPending}
        onSubmit={(values) => updateDeviceMutation.mutate({ deviceId: selectedDevice.id, values })}
      />
    );
  }

  if (drawerMode.kind === 'create-network') {
    drawerTitle = 'Create network';
    drawerContent = (
      <NetworkForm
        devices={devices}
        loading={createNetworkMutation.isPending}
        error={createNetworkMutation.isError ? getErrorMessage(createNetworkMutation.error, 'Unable to create network') : null}
        onSubmit={(values) => createNetworkMutation.mutate(values)}
      />
    );
  }

  if (drawerMode.kind === 'edit-network' && selectedNetwork) {
    drawerTitle = `Edit ${selectedNetwork.name}`;
    drawerContent = (
        <NetworkForm
          devices={devices}
          initialValue={selectedNetwork}
          initialLinks={selectedNetworkLinks}
          loading={updateNetworkMutation.isPending}
          error={updateNetworkMutation.isError ? getErrorMessage(updateNetworkMutation.error, 'Unable to update network') : null}
          onSubmit={(values) => updateNetworkMutation.mutate({ network: selectedNetwork, links: selectedNetworkLinks, values })}
        />
      );
  }

  if (drawerMode.kind === 'network-detail' && selectedNetwork) {
    drawerTitle = `${selectedNetwork.name} details`;
    drawerContent = (
        <NetworkDetailPanel
          network={selectedNetwork}
          devices={devices}
          links={selectedNetworkLinks}
          hosts={selectedHosts}
          scanJobs={scanJobsQuery.data ?? []}
          activeScanJob={activeScanJobQuery.data ?? activeScanJob}
          editingHost={editingHost}
          hostSaveLoading={updateHostMutation.isPending}
          scanLoading={scanMutation.isPending}
          connectionLoading={upsertConnectionMutation.isPending || removeConnectionMutation.isPending}
          onEditNetwork={() => openEditNetworkDrawer(selectedNetwork.id)}
          onScan={() => scanMutation.mutate(selectedNetwork.id)}
          onEditHost={(host) => setEditingHost(host)}
          onSaveHost={(values) => {
            if (editingHost) {
              updateHostMutation.mutate({ hostId: editingHost.id, values });
            }
          }}
          onUpsertConnection={(deviceId, values) => upsertConnectionMutation.mutate({ deviceId, networkId: selectedNetwork.id, values })}
          onRemoveConnection={(deviceId) => removeConnectionMutation.mutate({ deviceId, networkId: selectedNetwork.id })}
        />
      );
  }

  if (mapQuery.isLoading || graphQuery.isLoading) {
    return <LoadingState label="Loading map editor" />;
  }

  if (mapQuery.isError || graphQuery.isError) {
    return <ErrorAlert message={(mapQuery.error as Error | undefined)?.message ?? (graphQuery.error as Error | undefined)?.message ?? 'Unable to load map'} />;
  }

  if (!graph || !mapQuery.data) {
    return <EmptyState title="Map not found" description="The requested map could not be loaded." actionLabel="Back to maps" onAction={() => navigate('/')} />;
  }

  return (
    <>
      <AppShell title={mapQuery.data.name} sidebar={sidebar}>
        <Stack gap="md">
          <MapEditorHeader
            mapName={mapQuery.data.name}
            activeScans={activeMapScans}
            onCreateNetwork={openCreateNetworkDrawer}
            onSelectNetwork={(networkId) => {
              setDrawerMode({ kind: 'network-detail', networkId });
              setEditingHost(null);
            }}
          />
          <MapCanvas
            elements={elements}
            onSelectNode={(entityType, entityId) => {
              if (entityType === 'device') {
                setDrawerMode({ kind: 'edit-device', deviceId: entityId });
                setEditingHost(null);
              }

              if (entityType === 'network') {
                setDrawerMode({ kind: 'network-detail', networkId: entityId });
                setEditingHost(null);
              }
            }}
            onNodeDragStop={(payload) => patchPositionMutation.mutate(payload)}
            onConnectNodes={({ deviceId, networkId, role }) => upsertConnectionMutation.mutate({ deviceId, networkId, values: { role } })}
          />
        </Stack>
      </AppShell>

      <InspectorDrawer
        opened={drawerMode.kind !== 'empty'}
        title={drawerTitle}
        onClose={() => {
          resetNetworkFormMutations();
          setDrawerMode({ kind: 'empty' });
          setEditingHost(null);
        }}
      >
        {drawerContent}
      </InspectorDrawer>

      <ConfirmDialog
        opened={Boolean(confirmDelete)}
        title={`Delete ${confirmDelete?.type ?? 'item'}`}
        message="This action cannot be undone from the UI."
        confirmLabel="Delete"
        loading={deleteDeviceMutation.isPending || deleteNetworkMutation.isPending}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) {
            return;
          }

          if (confirmDelete.type === 'device') {
            deleteDeviceMutation.mutate(confirmDelete.id);
            return;
          }

          deleteNetworkMutation.mutate(confirmDelete.id);
        }}
      />
    </>
  );
}
