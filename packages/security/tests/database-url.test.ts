import { describe, expect, it } from 'vitest';
import { parseDatabaseUrl } from '@vargah/security/database-url';

describe('parseDatabaseUrl', () => {
  it('parses standard postgres url', () => {
    expect(parseDatabaseUrl('postgresql://postgres:secret@localhost:5432/db_vargah?schema=public')).toEqual({
      databaseName: 'db_vargah',
      host: 'localhost',
      port: '5432',
    });
  });

  it('defaults port to 5432 when omitted', () => {
    expect(parseDatabaseUrl('postgresql://postgres:secret@db.example.com/mydb')).toEqual({
      databaseName: 'mydb',
      host: 'db.example.com',
      port: '5432',
    });
  });

  it('returns nulls for empty input', () => {
    expect(parseDatabaseUrl('')).toEqual({
      databaseName: null,
      host: null,
      port: null,
    });
  });
});
