export type ActionState = {
  success?: boolean;
  message?: string;
  error?: string;
} | null;

export function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: string }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

export async function runServerAction(
  fn: () => Promise<void>,
  successMessage: string,
): Promise<ActionState> {
  try {
    await fn();
    return { success: true, message: successMessage };
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در انجام عملیات',
    };
  }
}
