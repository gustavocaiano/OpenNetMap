import { Button, Paper, Stack, Text, Title } from '@mantine/core';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Paper withBorder p="xl" radius="md">
      <Stack align="flex-start" gap="sm">
        <Title order={4}>{title}</Title>
        <Text c="dimmed" size="sm">
          {description}
        </Text>
        {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
      </Stack>
    </Paper>
  );
}
