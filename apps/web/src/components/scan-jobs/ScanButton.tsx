import { Button } from '@mantine/core';
import { IconRadar2 } from '@tabler/icons-react';

type ScanButtonProps = {
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function ScanButton({ loading, disabled, onClick }: ScanButtonProps) {
  return (
    <Button leftSection={<IconRadar2 size={16} />} loading={loading} disabled={disabled} onClick={onClick}>
      Scan network
    </Button>
  );
}
