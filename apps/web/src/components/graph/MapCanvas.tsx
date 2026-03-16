import { Box } from '@mantine/core';
import { useMemo } from 'react';
import ReactFlow, { Background, BackgroundVariant, Connection, Controls, MiniMap, Node, NodeMouseHandler } from 'reactflow';
import { DeviceNode } from './DeviceNode';
import { GraphElements } from './graphTransform';
import { HostNode } from './HostNode';
import { NetworkNode } from './NetworkNode';

type MapCanvasProps = {
  elements: GraphElements;
  onSelectNode: (entityType: 'device' | 'network' | 'host', entityId: string) => void;
  onNodeDragStop: (payload: { entityType: 'device' | 'network'; entityId: string; x: number; y: number }) => void;
  onConnectNodes?: (payload: { deviceId: string; networkId: string; role: 'origin' | 'member' }) => void;
};

const nodeTypes = {
  deviceNode: DeviceNode,
  networkNode: NetworkNode,
  hostNode: HostNode,
};

export function MapCanvas({ elements, onSelectNode, onNodeDragStop, onConnectNodes }: MapCanvasProps) {
  const defaultViewport = useMemo(() => ({ x: 24, y: 8, zoom: 0.82 }), []);

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    const entityType = node.data?.entityType as 'device' | 'network' | 'host' | undefined;
    const entityId = node.data?.entityId as string | undefined;
    if (entityType && entityId) {
      onSelectNode(entityType, entityId);
    }
  };

  const handleNodeDragStop = (_: unknown, node: Node) => {
    const entityType = node.data?.entityType as 'device' | 'network' | 'host' | undefined;
    const entityId = node.data?.entityId as string | undefined;
    if ((entityType === 'device' || entityType === 'network') && entityId) {
      onNodeDragStop({ entityType, entityId, x: node.position.x, y: node.position.y });
    }
  };

  const handleConnect = (connection: Connection) => {
    const sourceId = connection.source ?? '';
    const targetId = connection.target ?? '';

    if (!sourceId || !targetId || !onConnectNodes) {
      return;
    }

    const pair = [sourceId, targetId].sort();
    const deviceNodeId = pair.find((value) => value.startsWith('device:'));
    const networkNodeId = pair.find((value) => value.startsWith('network:'));

    if (!deviceNodeId || !networkNodeId) {
      return;
    }

    const role =
      sourceId.startsWith('device:') && targetId.startsWith('network:')
        ? 'origin'
        : sourceId.startsWith('network:') && targetId.startsWith('device:')
          ? 'member'
          : null;

    if (!role) {
      return;
    }

    onConnectNodes({
      deviceId: deviceNodeId.replace('device:', ''),
      networkId: networkNodeId.replace('network:', ''),
      role,
    });
  };

  return (
    <Box h="calc(100vh - 88px)" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '12px', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(248,249,250,0.95), rgba(241,243,245,0.95))' }}>
      <ReactFlow
        nodes={elements.nodes}
        edges={elements.edges}
        nodeTypes={nodeTypes}
        defaultViewport={defaultViewport}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.35}
        maxZoom={1.5}
        nodesDraggable
        nodesConnectable
        zoomOnDoubleClick={false}
        panOnScroll
        selectionOnDrag
        fitView={false}
      >
        <MiniMap pannable zoomable style={{ backgroundColor: '#ffffffcc' }} />
        <Controls showInteractive={false} />
        <Background color="#ced4da" gap={18} variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </Box>
  );
}
