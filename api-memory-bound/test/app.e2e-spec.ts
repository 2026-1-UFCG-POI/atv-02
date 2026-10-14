import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { vi } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /memory uses the default exponent', () => {
    return request(app.getHttpServer())
      .get('/memory')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          value: 24,
          length: 2 ** 24,
          bytes: 2 ** 24,
        });
      });
  });

  it.each([0, 10, 20])('GET /memory?valor=%i writes 2^valor bytes', (value) => {
    return request(app.getHttpServer())
      .get(`/memory?valor=${value}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          value,
          length: 2 ** value,
          bytes: 2 ** value,
        });
      });
  });

  afterEach(async () => {
    await app.close();
    vi.restoreAllMocks();
  });
});
