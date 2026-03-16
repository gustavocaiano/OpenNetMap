import { Button, Select, Stack, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Device, DeviceType } from '../../api/client';

export type DeviceFormValues = {
  name: string;
  type: DeviceType;
  notes: string;
};

type DeviceFormProps = {
  initialValue?: Partial<Device>;
  loading?: boolean;
  onSubmit: (values: DeviceFormValues) => void;
};

export function DeviceForm({ initialValue, loading, onSubmit }: DeviceFormProps) {
  const form = useForm<DeviceFormValues>({
    initialValues: {
      name: initialValue?.name ?? '',
      type: initialValue?.type ?? 'router',
      notes: initialValue?.notes ?? '',
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput label="Name" placeholder="Edge router" required {...form.getInputProps('name')} />
        <Select
          label="Type"
          data={['router', 'firewall', 'server']}
          required
          {...form.getInputProps('type')}
        />
        <Textarea label="Notes" minRows={3} {...form.getInputProps('notes')} />
        <Button type="submit" loading={loading}>
          Save device
        </Button>
      </Stack>
    </form>
  );
}
