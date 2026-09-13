'use client';

import { useFormStatus } from 'react-dom';
import type { ComponentProps } from 'react';

import { LoadingButton } from '@/components/ui/feedback/loading-button';

type SubmitButtonProps = Omit<ComponentProps<typeof LoadingButton>, 'loading' | 'type'> & {
  loadingText?: string;
};

export function SubmitButton({ loadingText = 'در حال ذخیره...', ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return <LoadingButton type="submit" loading={pending} loadingText={loadingText} {...props} />;
}
