import { parseDatabaseUrl, type DatabaseConnectionInfo } from '@vargah/security/database-url';

export type { DatabaseConnectionInfo };

export function getDatabaseConnectionInfo(): DatabaseConnectionInfo {
  return parseDatabaseUrl(process.env.DATABASE_URL);
}
