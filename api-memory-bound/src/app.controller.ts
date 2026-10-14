import { Controller, Get, Inject, Query } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  @Get('memory')
  writeMemory(@Query('valor') value?: string) {
    return this.appService.writeMemory(value);
  }
}
