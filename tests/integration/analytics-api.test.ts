import { describe, expect, it } from 'vitest';
import { POST } from '../../apps/web/src/app/api/analytics/collect/route';

describe('POST /api/analytics/collect', () => {
  it('returns 400 for missing path', async () => {
    const request = new Request('http://localhost:3000/api/analytics/collect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('accepts valid page view payload', async () => {
    const hasDb = Boolean(process.env.DATABASE_URL);
    if (!hasDb) {
      console.warn('Skipping analytics DB test — DATABASE_URL not set');
      return;
    }

    const request = new Request('http://localhost:3000/api/analytics/collect', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify({ path: '/test-integration', source: 'direct' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
