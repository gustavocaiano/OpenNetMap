import { Badge } from '@mantine/core';
import { ScanJobStatus } from '../../api/client';

const colorByStatus: Record<ScanJobStatus, string> = {
  pending: 'yellow',
  running: 'blue',
  succeeded: 'green',
  failed: 'red',
};

type ScanJobBadgeProps = {
  status: ScanJobStatus;
};

export function ScanJobBadge({ status }: ScanJobBadgeProps) {
  return <Badge color={colorByStatus[status]}>{status}</Badge>;
}
