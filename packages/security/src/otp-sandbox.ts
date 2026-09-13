/** Shared OTP sandbox rules — never expose codes outside local development. */

export function isOtpSandboxAllowed(flagEnvNames: string[]): boolean {
  if (process.env.NODE_ENV === 'production') {
    for (const name of flagEnvNames) {
      if (process.env[name] === 'true') {
        throw new Error(
          `${name} در production مجاز نیست. ارسال واقعی پیامک را پیکربندی کنید.`,
        );
      }
    }
    return false;
  }

  if (process.env.NODE_ENV === 'development') return true;
  return flagEnvNames.some((name) => process.env[name] === 'true');
}
