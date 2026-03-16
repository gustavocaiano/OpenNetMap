import { Badge, Paper, Stack, Text } from '@mantine/core';
import { Handle, NodeProps, Position } from 'reactflow';

export function HostNode({ data }: NodeProps<{ ip: string; hostname?: string; type?: string }>) {
  return (
    <Paper withBorder radius="md" p="xs" bg="gray.0" miw={160}>
      <Handle type="target" position={Position.Top} />
      <Stack gap={2}>
        <Text fw={700} size="sm">
          {data.ip}
        </Text>
        {data.hostname ? <Text size="xs">{data.hostname}</Text> : null}
        {data.type ? (
          <Badge variant="dot" size="xs" w="fit-content">
            {data.type}
          </Badge>
        ) : null}
      </Stack>
    </Paper>
  );
}
