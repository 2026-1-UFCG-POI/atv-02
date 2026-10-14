import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, open } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const BLOCK_SIZE_BYTES = 64 * 1024;
const DEFAULT_VALUE = 20;

@Injectable()
export class AppService {
  async writeFile(rawValue?: string) {
    const input =
      rawValue === undefined || rawValue === ''
        ? String(DEFAULT_VALUE)
        : rawValue;
    const requestId = randomUUID();
    const startedAt = performance.now();
    let writeMs = 0;
    let syncMs = 0;
    let syncCount = 0;
    let status = 'error';
    console.log(
      JSON.stringify({
        event: 'request_received',
        requestId,
        value: input === String(DEFAULT_VALUE) ? DEFAULT_VALUE : input,
      }),
    );

    try {
      if (typeof input !== 'string' || !/^\d+$/.test(input)) {
        throw new BadRequestException('valor deve ser um inteiro não negativo');
      }
      const value = Number(input);
      const sizeBytes = 2 ** value;
      const directory = resolve(process.env.FILE_OUTPUT_DIR ?? 'data');
      await mkdir(directory, { recursive: true });
      const filePath = join(directory, `${requestId}.txt`);
      const file = await open(filePath, 'wx');
      try {
        const chunk = Buffer.alloc(Math.min(sizeBytes, BLOCK_SIZE_BYTES), 0x61);
        let written = 0;
        while (written < sizeBytes) {
          const blockBytes = Math.min(chunk.length, sizeBytes - written);
          let offset = 0;
          const writeStartedAt = performance.now();
          try {
            while (offset < blockBytes) {
              const { bytesWritten } = await file.write(
                chunk,
                offset,
                blockBytes - offset,
                null,
              );
              if (bytesWritten === 0)
                throw new Error('A escrita do arquivo não avançou');
              offset += bytesWritten;
            }
          } finally {
            writeMs += performance.now() - writeStartedAt;
          }
          written += blockBytes;

          // Cada bloco precisa terminar a sincronização antes do próximo.
          const syncStartedAt = performance.now();
          try {
            await file.sync();
            syncCount += 1;
          } finally {
            syncMs += performance.now() - syncStartedAt;
          }
        }
      } finally {
        await file.close();
      }

      status = 'success';
      return {
        requestId,
        value,
        sizeBytes,
        filePath,
        blockSizeBytes: BLOCK_SIZE_BYTES,
        syncCount,
        writeMs,
        syncMs,
        durationMs: performance.now() - startedAt,
      };
    } finally {
      console.log(
        JSON.stringify({
          event: 'request_finished',
          requestId,
          status,
          syncCount,
          writeMs,
          syncMs,
          durationMs: performance.now() - startedAt,
        }),
      );
    }
  }
}
