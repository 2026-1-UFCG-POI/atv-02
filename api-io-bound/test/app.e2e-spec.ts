import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('POST /write', () => {
  let app: INestApplication<App>;
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'api-io-bound-'));
    vi.stubEnv('FILE_OUTPUT_DIR', directory);
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await rm(directory, { recursive: true, force: true });
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each(['/write', '/write?valor='])(
    'usa 20 quando ausente ou vazio em %s e registra início e fim',
    async (url) => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const response = await request(app.getHttpServer()).post(url).expect(200);
      expect(response.body.value).toBe(20);
      expect(response.body.sizeBytes).toBe(1048576);
      expect(response.body.blockSizeBytes).toBe(65536);
      expect(response.body.syncCount).toBe(16);
      expect(response.body.writeMs).toBeGreaterThanOrEqual(0);
      expect(response.body.syncMs).toBeGreaterThanOrEqual(0);
      expect(response.body.durationMs).toBeGreaterThanOrEqual(
        response.body.writeMs + response.body.syncMs,
      );
      expect((await stat(response.body.filePath)).size).toBe(1048576);
      expect(await readFile(response.body.filePath)).toEqual(
        Buffer.alloc(1048576, 0x61),
      );
      const events = log.mock.calls.map(([message]) =>
        JSON.parse(message as string),
      );
      expect(events).toMatchObject([
        {
          event: 'request_received',
          requestId: response.body.requestId,
          value: 20,
        },
        {
          event: 'request_finished',
          requestId: response.body.requestId,
          status: 'success',
        },
      ]);
    },
  );

  it('grava vários blocos e cria arquivos distintos em requisições concorrentes', async () => {
    const responses = await Promise.all([
      request(app.getHttpServer()).post('/write?valor=21').expect(200),
      request(app.getHttpServer()).post('/write?valor=0').expect(200),
    ]);
    expect(responses[0].body.filePath).not.toBe(responses[1].body.filePath);
    for (const response of responses) {
      expect(response.body.syncCount).toBe(
        Math.ceil(response.body.sizeBytes / 65536),
      );
      expect((await stat(response.body.filePath)).size).toBe(
        2 ** response.body.value,
      );
      expect(await readFile(response.body.filePath)).toEqual(
        Buffer.alloc(2 ** response.body.value, 0x61),
      );
    }
  });

  it.each(['-1', '1.5', 'abc', '10&valor=11'])(
    'rejeita valor inválido %s sem criar arquivo',
    async (value) => {
      await request(app.getHttpServer())
        .post(`/write?valor=${value}`)
        .expect(400);
      expect(await readdir(directory)).toEqual([]);
    },
  );

  it('registra falha de escrita e responde com erro', async () => {
    vi.stubEnv('FILE_OUTPUT_DIR', '/dev/null/files');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await request(app.getHttpServer()).post('/write').expect(500);
    expect(JSON.parse(log.mock.calls[1][0] as string)).toMatchObject({
      event: 'request_finished',
      status: 'error',
    });
  });
});
