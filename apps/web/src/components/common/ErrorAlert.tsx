import { Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

type ErrorAlertProps = {
  message: string;
};

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <Alert color="red" icon={<IconAlertCircle size={16} />} title="Something went wrong">
      {message}
    </Alert>
  );
}
