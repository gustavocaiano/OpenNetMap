import { Center, Loader, Stack, Text } from '@mantine/core';

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Loading...' }: LoadingStateProps) {
  return (
    <Center mih={240}>
      <Stack align="center" gap="xs">
        <Loader size="sm" />
        <Text c="dimmed" size="sm">
          {label}
        </Text>
      </Stack>
    </Center>
  );
}
