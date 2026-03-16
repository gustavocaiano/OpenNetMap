import { Drawer } from '@mantine/core';
import { ReactNode } from 'react';

type InspectorDrawerProps = {
  opened: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function InspectorDrawer({ opened, title, onClose, children }: InspectorDrawerProps) {
  return (
    <Drawer opened={opened} onClose={onClose} position="right" title={title} padding="md" size="xl">
      {children}
    </Drawer>
  );
}
