export type DatabaseConnectionInfo = {
  databaseName: string | null;
  host: string | null;
  port: string | null;
};

export function parseDatabaseUrl(rawUrl?: string): DatabaseConnectionInfo {
  const url = rawUrl?.trim();
  if (!url) {
    return { databaseName: null, host: null, port: null };
  }

  try {
    const parsed = new URL(url);
    const databaseName =
      decodeURIComponent(parsed.pathname.replace(/^\//, '').split('?')[0] ?? '') || null;
    return {
      databaseName,
      host: parsed.hostname || null,
      port: parsed.port || '5432',
    };
  } catch {
    const dbMatch = url.match(/\/([^/?]+)(?:\?|$)/);
    return {
      databaseName: dbMatch?.[1] ?? null,
      host: null,
      port: null,
    };
  }
}
