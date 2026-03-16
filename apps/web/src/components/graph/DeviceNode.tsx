import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { NodeProps } from 'reactflow';
import { DeviceType } from '../../api/client';
import { getDeviceVisual } from '../devices/deviceVisuals';
import { PerimeterHandles } from './PerimeterHandles';

type DeviceNodeData = {
  label: string;
  type: DeviceType;
  notes?: string | null;
  ipHints: string[];
  originCount: number;
  memberCount: number;
  activeHandleIds?: string[];
};

export function DeviceNode({ data }: NodeProps<DeviceNodeData>) {
  const visual = getDeviceVisual(data.type);
  const Icon = visual.icon;

  return (
    <Paper
      withBorder
      radius="lg"
      p="sm"
      shadow="xs"
      miw={210}
      style={{ borderColor: visual.color, background: `linear-gradient(180deg, ${visual.softColor}, rgba(255,255,255,0.96))` }}
    >
      <PerimeterHandles
        accentColor={visual.color}
        targetFill="#ffffff"
        sourceFill={visual.color}
        activeHandleIds={data.activeHandleIds}
      />
      <Stack gap="xs">
        <Group gap="xs" wrap="nowrap">
          <Paper radius="md" p={6} style={{ backgroundColor: visual.softColor, color: visual.color, lineHeight: 0 }}>
            <Icon size={16} />
          </Paper>
          <Stack gap={2}>
            <Text fw={700} size="sm">
              {data.label}
            </Text>
            <Badge variant="light" w="fit-content" color={visual.color}>
              {visual.label}
            </Badge>
            <Group gap={6}>
              {data.originCount ? <Badge variant="outline" size="xs" color="blue">{data.originCount} origin</Badge> : null}
              {data.memberCount ? <Badge variant="outline" size="xs" color="teal">{data.memberCount} member</Badge> : null}
            </Group>
          </Stack>
        </Group>
        {data.notes ? (
          <Text size="xs" c="dimmed" lineClamp={3}>
            {data.notes}
          </Text>
        ) : null}
        {data.ipHints.length ? (
          <Group gap={6}>
            {data.ipHints.slice(0, 4).map((ipHint) => (
              <Badge key={ipHint} variant="white" color="gray" size="xs">
                {ipHint}
              </Badge>
            ))}
            {data.ipHints.length > 4 ? <Badge variant="outline" size="xs">+{data.ipHints.length - 4}</Badge> : null}
          </Group>
        ) : null}
      </Stack>
    </Paper>
  );
}
