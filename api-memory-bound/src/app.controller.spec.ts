import { vi } from 'vitest';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  afterEach(() => vi.restoreAllMocks());

  it('writes 16 MiB by default, logging before and after the write', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fill = vi.spyOn(Uint8Array.prototype, 'fill');
    const controller = new AppController(new AppService());

    expect(controller.writeMemory()).toEqual({
      value: 24,
      length: 2 ** 24,
      bytes: 2 ** 24,
    });
    expect(fill).toHaveBeenCalledWith(1);
    expect(log.mock.calls).toEqual([
      ['memory.start', 24],
      ['memory.end', 24],
    ]);
    expect(log.mock.invocationCallOrder[0]).toBeLessThan(
      fill.mock.invocationCallOrder[0],
    );
    expect(fill.mock.invocationCallOrder[0]).toBeLessThan(
      log.mock.invocationCallOrder[1],
    );
  });
});
