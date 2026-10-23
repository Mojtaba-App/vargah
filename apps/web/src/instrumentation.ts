export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Always merge root monorepo .env — DATABASE_URL alone may already be set while
  // SECRETS_ENCRYPTION_KEY / other secrets are still missing from the app cwd.
  const { loadEnvFromMonorepoRoot } = await import('./instrumentation.node');
  loadEnvFromMonorepoRoot();
}
