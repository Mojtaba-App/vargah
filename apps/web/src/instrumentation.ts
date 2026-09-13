export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  if (!process.env.DATABASE_URL) {
    const { loadEnvFromMonorepoRoot } = await import('./instrumentation.node');
    loadEnvFromMonorepoRoot();
  }
}
