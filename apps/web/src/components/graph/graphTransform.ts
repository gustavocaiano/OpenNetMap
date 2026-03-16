import { Edge, MarkerType, Node, XYPosition } from 'reactflow';
import { Device, DeviceNetworkLink, GraphPayload, Host, Network } from '../../api/client';
import { GRAPH_HANDLE_SLOT_COUNT, GraphAnchorSide, getGraphHandleId, isGraphAnchorSide } from './graphHandles';

export type GraphElements = {
  nodes: Node[];
  edges: Edge[];
};

type GraphTransformOptions = {
  selectedNetworkId?: string | null;
  selectedHostNetworkHosts?: Host[];
};

type NodeCenter = {
  x: number;
  y: number;
};

type GraphNodeData = {
  activeHandleIds?: string[];
};

const baseDeviceX = 80;
const baseNetworkX = 470;
const baseHostX = 860;

function getNodeSize(network?: Network) {
  if (!network) {
    return { width: 220, height: 104 };
  }

  if (network.network_kind === 'link') {
    return { width: 210, height: 84 };
  }

  return network.layout_mode === 'container' ? { width: 320, height: 176 } : { width: 244, height: 124 };
}

function getNodeCenter(position: XYPosition, size: { width: number; height: number }): NodeCenter {
  return {
    x: position.x + size.width / 2,
    y: position.y + size.height / 2,
  };
}

function deviceNode(device: Device, index: number): Node {
  return {
    id: `device:${device.id}`,
    type: 'deviceNode',
    position: {
      x: device.pos_x ?? baseDeviceX,
      y: device.pos_y ?? 90 + index * 140,
    },
    data: {
      label: device.name,
      type: device.type,
      notes: device.notes,
      ipHints: [],
      originCount: 0,
      memberCount: 0,
      activeHandleIds: [],
      entityId: device.id,
      entityType: 'device',
    },
  };
}

function networkNode(network: Network, index: number, originCount: number, memberCount: number, selectedNetworkId?: string | null): Node {
  return {
    id: `network:${network.id}`,
    type: 'networkNode',
    position: {
      x: network.pos_x ?? baseNetworkX,
      y: network.pos_y ?? 120 + index * (network.network_kind === 'link' ? 130 : 180),
    },
    data: {
      label: network.name,
      cidr: network.cidr,
      networkKind: network.network_kind,
      layoutMode: network.layout_mode,
      color: network.color,
      vlanTag: network.vlan_tag,
      notes: network.notes,
      dhcpEnabled: network.dhcp_enabled,
      gatewayIp: network.gateway_ip,
      dnsServers: network.dns_servers,
      selected: network.id === selectedNetworkId,
      hostCount: network.host_count,
      deviceCount: network.device_ids.length,
      originCount,
      memberCount,
      activeHandleIds: [],
      entityId: network.id,
      entityType: 'network',
    },
  };
}

function hostNode(host: Host, index: number, networkY: number): Node {
  return {
    id: `host:${host.id}`,
    type: 'hostNode',
    position: {
      x: baseHostX,
      y: networkY + 28 + index * 88,
    },
    draggable: false,
    selectable: false,
    data: {
      ip: host.ip_address,
      hostname: host.hostname,
      type: host.type,
      entityId: host.id,
      entityType: 'host',
    },
  };
}

function buildLinkLabel(link: DeviceNetworkLink) {
  const parts = [link.label, link.ip_address].filter(Boolean);
  return parts.join(' · ');
}

function getAutoAnchorSide(origin: NodeCenter, target: NodeCenter, link: DeviceNetworkLink, network: Network, entity: 'device' | 'network'): GraphAnchorSide {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  let side: GraphAnchorSide = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'bottom' : 'top';

  if (network.network_kind === 'link' && Math.abs(dx) >= Math.abs(dy) * 0.65) {
    side = dx >= 0 ? 'right' : 'left';
  }

  if (network.network_kind === 'segment' && entity === 'network') {
    if (link.role === 'origin' && side === 'bottom') {
      side = Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : 'top';
    }

    if (link.role === 'member' && side === 'top') {
      side = Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : 'bottom';
    }
  }

  return side;
}

function reserveHandleSlot(counter: Map<string, number>, nodeId: string, side: GraphAnchorSide, type: 'source' | 'target') {
  const key = `${nodeId}:${type}:${side}`;
  const nextCount = counter.get(key) ?? 0;
  counter.set(key, nextCount + 1);
  return nextCount % GRAPH_HANDLE_SLOT_COUNT;
}

function resolveHandle(nodeId: string, nodeCenter: NodeCenter, oppositeCenter: NodeCenter, preferredSide: DeviceNetworkLink['device_anchor'], counter: Map<string, number>, type: 'source' | 'target', link: DeviceNetworkLink, network: Network, entity: 'device' | 'network') {
  const preferred = isGraphAnchorSide(preferredSide)
    ? preferredSide
    : getAutoAnchorSide(nodeCenter, oppositeCenter, link, network, entity);
  const slot = reserveHandleSlot(counter, nodeId, preferred, type);
  return {
    side: preferred,
    slot,
  };
}

function buildNodeCenters(deviceNodes: Node[], networkNodes: Node[], networkById: Map<string, Network>) {
  const nodeCenters = new Map<string, NodeCenter>();

  deviceNodes.forEach((node) => {
    nodeCenters.set(node.id, getNodeCenter(node.position, getNodeSize()));
  });

  networkNodes.forEach((node) => {
    const networkId = node.data.entityId as string;
    nodeCenters.set(node.id, getNodeCenter(node.position, getNodeSize(networkById.get(networkId))));
  });

  return nodeCenters;
}

function markHandleUsed(activeHandlesByNode: Map<string, Set<string>>, nodeId: string, handleId: string | undefined) {
  if (!handleId) {
    return;
  }

  const current = activeHandlesByNode.get(nodeId) ?? new Set<string>();
  current.add(handleId);
  activeHandlesByNode.set(nodeId, current);
}

function assignActiveHandles(nodes: Node[], activeHandlesByNode: Map<string, Set<string>>) {
  nodes.forEach((node) => {
    if (node.type !== 'deviceNode' && node.type !== 'networkNode') {
      return;
    }

    const activeHandles = activeHandlesByNode.get(node.id);
    (node.data as GraphNodeData).activeHandleIds = activeHandles ? [...activeHandles] : [];
  });
}

function getEdgeType(network: Network) {
  return network.network_kind === 'link' ? 'default' : 'smoothstep';
}

export function buildGraphElements(graph: GraphPayload, options: GraphTransformOptions = {}): GraphElements {
  const links = graph.device_network_links;
  const devices = graph.devices.map(deviceNode);
  const networkById = new Map(graph.networks.map((network) => [network.id, network]));
  const roleCountsByNetwork = new Map(graph.networks.map((network) => [network.id, { origin: 0, member: 0 }]));

  devices.forEach((deviceNodeItem) => {
    const deviceLinks = links.filter((link) => link.device_id === deviceNodeItem.data.entityId);
    deviceNodeItem.data.originCount = deviceLinks.filter((link) => link.role === 'origin').length;
    deviceNodeItem.data.memberCount = deviceLinks.filter((link) => link.role === 'member').length;
    deviceNodeItem.data.ipHints = deviceLinks
      .map((link) => {
        const network = networkById.get(link.network_id);
        if (link.ip_address && network) {
          return `${network.name}: ${link.ip_address}`;
        }

        return link.ip_address ?? null;
      })
      .filter((value): value is string => Boolean(value));
  });

  links.forEach((link) => {
    const counts = roleCountsByNetwork.get(link.network_id);
    if (counts) {
      counts[link.role] += 1;
    }
  });

  const networkNodes = graph.networks.map((network, index) => {
    const counts = roleCountsByNetwork.get(network.id) ?? { origin: 0, member: 0 };
    return networkNode(network, index, counts.origin, counts.member, options.selectedNetworkId);
  });

  const nodeCenters = buildNodeCenters(devices, networkNodes, networkById);
  const handleCounter = new Map<string, number>();
  const activeHandlesByNode = new Map<string, Set<string>>();

  const edges: Edge[] = links.flatMap((link) => {
    const network = networkById.get(link.network_id);
    const deviceNodeId = `device:${link.device_id}`;
    const networkNodeId = `network:${link.network_id}`;

    if (!network) {
      return [];
    }

    const deviceCenter = nodeCenters.get(deviceNodeId);
    const networkCenter = nodeCenters.get(networkNodeId);

    if (!deviceCenter || !networkCenter) {
      return [];
    }

    const deviceHandle = resolveHandle(
      deviceNodeId,
      deviceCenter,
      networkCenter,
      link.device_anchor,
      handleCounter,
      link.role === 'origin' ? 'source' : 'target',
      link,
      network,
      'device',
    );

    const networkHandle = resolveHandle(
      networkNodeId,
      networkCenter,
      deviceCenter,
      link.network_anchor,
      handleCounter,
      link.role === 'origin' ? 'target' : 'source',
      link,
      network,
      'network',
    );

    const accentColor = link.color || network.color || (link.role === 'origin' ? '#1971c2' : network.network_kind === 'link' ? '#c2410c' : '#099268');
    const label = buildLinkLabel(link);
    const sourceHandle = link.role === 'origin'
      ? getGraphHandleId('source', deviceHandle.side, deviceHandle.slot)
      : getGraphHandleId('source', networkHandle.side, networkHandle.slot);
    const targetHandle = link.role === 'origin'
      ? getGraphHandleId('target', networkHandle.side, networkHandle.slot)
      : getGraphHandleId('target', deviceHandle.side, deviceHandle.slot);

    markHandleUsed(activeHandlesByNode, link.role === 'origin' ? deviceNodeId : networkNodeId, sourceHandle);
    markHandleUsed(activeHandlesByNode, link.role === 'origin' ? networkNodeId : deviceNodeId, targetHandle);

    return [
      {
        id: `link:${link.device_id}:${link.network_id}`,
        source: link.role === 'origin' ? deviceNodeId : networkNodeId,
        target: link.role === 'origin' ? networkNodeId : deviceNodeId,
        sourceHandle,
        targetHandle,
        type: getEdgeType(network),
        animated: false,
        label: label || undefined,
        labelBgPadding: label ? [8, 4] : undefined,
        labelBgBorderRadius: label ? 999 : undefined,
        labelBgStyle: label ? { fill: '#ffffff', fillOpacity: 0.92 } : undefined,
        labelStyle: label ? { fill: network.network_kind === 'link' ? '#9a3412' : link.role === 'origin' ? '#1864ab' : '#087f5b', fontSize: 11, fontWeight: 700 } : undefined,
        style: {
          stroke: accentColor,
          strokeWidth: network.network_kind === 'link' ? 2 : link.role === 'origin' ? 2.8 : 2.2,
          strokeDasharray: link.role === 'origin' || network.network_kind === 'link' ? undefined : '6 3',
        },
        markerEnd: network.network_kind === 'link'
          ? undefined
          : {
              type: MarkerType.ArrowClosed,
              color: accentColor,
            },
      },
    ];
  });

  if (options.selectedNetworkId) {
    const network = graph.networks.find((item) => item.id === options.selectedNetworkId);
    const selectedHosts = options.selectedHostNetworkHosts ?? graph.hosts.filter((host) => host.network_id === options.selectedNetworkId);
    if (network && network.network_kind === 'segment') {
      const networkY = network.pos_y ?? 120;
      selectedHosts.forEach((host, index) => {
        const node = hostNode(host, index, networkY);
        networkNodes.push(node);
        edges.push({
          id: `host-link:${host.id}`,
          source: `network:${options.selectedNetworkId}`,
          sourceHandle: getGraphHandleId('source', 'right', index % GRAPH_HANDLE_SLOT_COUNT),
          target: `host:${host.id}`,
          type: 'smoothstep',
          style: { stroke: '#adb5bd', strokeDasharray: '5 4' },
        });
        markHandleUsed(
          activeHandlesByNode,
          `network:${options.selectedNetworkId}`,
          getGraphHandleId('source', 'right', index % GRAPH_HANDLE_SLOT_COUNT),
        );
      });
    }
  }

  assignActiveHandles(devices, activeHandlesByNode);
  assignActiveHandles(networkNodes, activeHandlesByNode);

  return { nodes: [...devices, ...networkNodes], edges };
}
