import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  writeMemory(rawValue?: string) {
    const value = rawValue === undefined ? 24 : Number(rawValue);
    console.log('memory.start', value);

    const memory = new Uint8Array(2 ** value);
    memory.fill(1);

    console.log('memory.end', value);
    return { value, length: memory.length, bytes: memory.byteLength };
  }
}
