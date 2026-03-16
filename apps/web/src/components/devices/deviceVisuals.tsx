import { IconBarrierBlock, IconCpu, IconRoute2 } from '@tabler/icons-react';
import { DeviceType } from '../../api/client';

type DeviceVisual = {
  color: string;
  softColor: string;
  icon: typeof IconCpu;
  label: string;
};

const deviceVisuals: Record<DeviceType, DeviceVisual> = {
  router: {
    color: '#1971c2',
    softColor: 'rgba(25, 113, 194, 0.12)',
    icon: IconRoute2,
    label: 'Router',
  },
  firewall: {
    color: '#c92a2a',
    softColor: 'rgba(201, 42, 42, 0.12)',
    icon: IconBarrierBlock,
    label: 'Firewall',
  },
  server: {
    color: '#2b8a3e',
    softColor: 'rgba(43, 138, 62, 0.12)',
    icon: IconCpu,
    label: 'Server',
  },
};

export function getDeviceVisual(type: DeviceType): DeviceVisual {
  return deviceVisuals[type] ?? deviceVisuals.server;
}
