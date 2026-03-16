import { AppShell as MantineAppShell, Burger, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ReactNode } from 'react';

type AppShellProps = {
  title: string;
  sidebar?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, sidebar, aside, children }: AppShellProps) {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <MantineAppShell
      header={{ height: 56 }}
      navbar={{ width: 320, breakpoint: 'md', collapsed: { mobile: !opened, desktop: !sidebar } }}
      aside={{ width: 420, breakpoint: 'lg', collapsed: { mobile: false, desktop: !aside } }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            {sidebar ? <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" /> : null}
            <Text fw={700}>{title}</Text>
          </Group>
          <Text size="sm" c="dimmed">
            Self-hosted network mapping
          </Text>
        </Group>
      </MantineAppShell.Header>
      {sidebar ? <MantineAppShell.Navbar p="md">{sidebar}</MantineAppShell.Navbar> : null}
      {aside ? <MantineAppShell.Aside p="md">{aside}</MantineAppShell.Aside> : null}
      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
}
