import { AnchorPreference } from '../../api/client';

export type GraphAnchorSide = Exclude<AnchorPreference, 'auto'>;

export const GRAPH_HANDLE_SLOT_COUNT = 4;

export const GRAPH_HANDLE_SLOT_POSITIONS: Record<GraphAnchorSide, number[]> = {
  top: [16, 38, 62, 84],
  right: [16, 38, 62, 84],
  bottom: [16, 38, 62, 84],
  left: [16, 38, 62, 84],
};

export function getGraphHandleId(type: 'source' | 'target', side: GraphAnchorSide, slot: number) {
  return `${type}-${side}-${slot}`;
}

export function isGraphAnchorSide(value: AnchorPreference | null | undefined): value is GraphAnchorSide {
  return value === 'top' || value === 'right' || value === 'bottom' || value === 'left';
}
