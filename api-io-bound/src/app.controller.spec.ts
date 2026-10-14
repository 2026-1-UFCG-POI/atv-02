import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  it('encaminha o valor recebido ao serviço', async () => {
    const service = new AppService();
    const result = {
      requestId: 'test',
      value: 12,
      sizeBytes: 4096,
      filePath: '/tmp/test.bin',
      blockSizeBytes: 65536,
      syncCount: 1,
      writeMs: 1,
      syncMs: 2,
      durationMs: 3,
    };
    const write = vi.spyOn(service, 'writeFile').mockResolvedValue(result);
    expect(await new AppController(service).writeFile('12')).toEqual(result);
    expect(write).toHaveBeenCalledWith('12');
  });
});
