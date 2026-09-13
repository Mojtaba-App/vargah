import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

import { POST } from '../../apps/web/src/app/api/revalidate/route';

describe('POST /api/revalidate', () => {
  const secret = 'test-revalidate-secret';

  beforeEach(() => {
    process.env.REVALIDATE_SECRET = secret;
  });

  it('returns 401 without valid bearer token', async () => {
    const request = new Request('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: { authorization: 'Bearer invalid' },
      body: JSON.stringify({ tags: ['articles'] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('revalidates tags and paths with valid secret', async () => {
    const request = new Request('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${secret}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ tags: ['articles'], paths: ['/articles'] }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.revalidated).toBe(true);
    expect(body.tags).toEqual(['articles']);
    expect(body.paths).toEqual(['/articles']);
  });
});
