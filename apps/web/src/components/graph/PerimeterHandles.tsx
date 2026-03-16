import { CSSProperties } from 'react';
import { Handle, Position } from 'reactflow';
import { GRAPH_HANDLE_SLOT_POSITIONS, GraphAnchorSide, getGraphHandleId } from './graphHandles';

type PerimeterHandlesProps = {
  accentColor: string;
  sourceFill?: string;
  targetFill?: string;
  size?: number;
  activeHandleIds?: string[];
};

const sidePositionMap: Record<GraphAnchorSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

function getHandleStyle(
  side: GraphAnchorSide,
  offset: number,
  size: number,
  borderColor: string,
  background: string,
  delta: number,
  active: boolean,
): CSSProperties {
  const baseStyle: CSSProperties = {
    width: size,
    height: size,
    borderWidth: 2,
    borderColor,
    background,
    boxShadow: '0 0 0 2px rgba(255,255,255,0.82)',
    opacity: active ? 1 : 0.16,
    transition: 'opacity 120ms ease',
  };

  if (side === 'top' || side === 'bottom') {
    return { ...baseStyle, left: `${offset + delta}%` };
  }

  return { ...baseStyle, top: `${offset + delta}%` };
}

export function PerimeterHandles({ accentColor, sourceFill, targetFill = '#ffffff', size = 10, activeHandleIds = [] }: PerimeterHandlesProps) {
  const activeHandles = new Set(activeHandleIds);

  return (
    <>
      {(Object.entries(GRAPH_HANDLE_SLOT_POSITIONS) as [GraphAnchorSide, number[]][]).map(([side, offsets]) =>
        offsets.map((offset, slotIndex) => (
          (() => {
            const handleId = getGraphHandleId('target', side, slotIndex);
            return (
              <Handle
                key={`target-${side}-${slotIndex}`}
                id={handleId}
                type="target"
                position={sidePositionMap[side]}
                style={getHandleStyle(side, offset, size, accentColor, targetFill, -2, activeHandles.has(handleId))}
              />
            );
          })()
        )),
      )}
      {(Object.entries(GRAPH_HANDLE_SLOT_POSITIONS) as [GraphAnchorSide, number[]][]).map(([side, offsets]) =>
        offsets.map((offset, slotIndex) => (
          (() => {
            const handleId = getGraphHandleId('source', side, slotIndex);
            return (
              <Handle
                key={`source-${side}-${slotIndex}`}
                id={handleId}
                type="source"
                position={sidePositionMap[side]}
                style={getHandleStyle(side, offset, size, accentColor, sourceFill ?? accentColor, 2, activeHandles.has(handleId))}
              />
            );
          })()
        )),
      )}
    </>
  );
}
