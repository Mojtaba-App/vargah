import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../apps/cms/src/app.module';

describe('CMS API integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns ok', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });

  it('GET /api/v1/internal/status requires API key', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/internal/status');

    expect(response.status).toBe(401);
  });

  it('GET /api/v1/internal/status succeeds with valid API key', async () => {
    process.env.CMS_API_KEY = 'integration-test-key';

    const response = await request(app.getHttpServer())
      .get('/api/v1/internal/status')
      .set('x-api-key', 'integration-test-key');

    expect(response.status).toBe(200);
    expect(response.body.service).toBe('cms');
    expect(response.body.protected).toBe(true);
  });
});
