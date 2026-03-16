import { Button, Checkbox, Stack, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Host } from '../../api/client';

export type HostFormValues = {
  hostname: string;
  ip_address: string;
  type: string;
  notes: string;
  needs_review: boolean;
};

type HostFormProps = {
  initialValue: Host;
  loading?: boolean;
  onSubmit: (values: HostFormValues) => void;
};

export function HostForm({ initialValue, loading, onSubmit }: HostFormProps) {
  const form = useForm<HostFormValues>({
    initialValues: {
      hostname: initialValue.hostname ?? '',
      ip_address: initialValue.ip_address,
      type: initialValue.type ?? '',
      notes: initialValue.notes ?? '',
      needs_review: Boolean(initialValue.needs_review),
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput label="IP address" required size="md" {...form.getInputProps('ip_address')} />
        <TextInput label="Hostname" {...form.getInputProps('hostname')} />
        <TextInput label="Type" placeholder="printer, workstation, vm" {...form.getInputProps('type')} />
        <Textarea label="Notes" minRows={2} {...form.getInputProps('notes')} />
        <Checkbox label="Needs review" {...form.getInputProps('needs_review', { type: 'checkbox' })} />
        <Button type="submit" loading={loading}>
          Save host
        </Button>
      </Stack>
    </form>
  );
}
