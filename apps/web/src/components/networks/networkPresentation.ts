import { Network, NetworkKind } from '../../api/client';

export function getNetworkKindLabel(kind: NetworkKind) {
  return kind === 'segment' ? 'LAN segment' : 'Direct/shared link';
}

export function getNetworkKindDescription(kind: NetworkKind) {
  return kind === 'segment'
    ? 'Subnet-style LAN with hosts, scans, config, and upstream/downstream devices.'
    : 'Compact interconnect for devices sharing the same link or point-to-point path.';
}

export function getLayoutModeLabel(layoutMode: Network['layout_mode']) {
  return layoutMode === 'container' ? 'LAN segment / bridge area' : 'Compact network node';
}

export function getNetworkBadgeColor(kind: NetworkKind) {
  return kind === 'segment' ? 'cyan' : 'orange';
}

export function getNetworkRoleLabels(kind: NetworkKind) {
  return kind === 'segment'
    ? {
        origin: 'Sources / uplinks',
        member: 'Members',
      }
    : {
        origin: 'Primary peers',
        member: 'Attached peers',
      };
}
