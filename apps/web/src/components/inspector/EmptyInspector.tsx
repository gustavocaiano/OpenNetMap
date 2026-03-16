import { Center, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconLayoutSidebarRightExpand } from '@tabler/icons-react';

export function EmptyInspector() {
  return (
    <Center h="100%">
      <Stack align="center" gap="sm">
        <ThemeIcon size={48} variant="light" radius="xl">
          <IconLayoutSidebarRightExpand size={24} />
        </ThemeIcon>
        <Text fw={600}>Nothing selected</Text>
        <Text size="sm" c="dimmed" ta="center">
          Pick a device or network from the canvas or sidebar to inspect and edit it.
        </Text>
      </Stack>
    </Center>
  );
}
