import { Controller, HttpCode, Inject, Post, Query } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  @Post('write')
  @HttpCode(200)
  writeFile(@Query('valor') valor?: string) {
    return this.appService.writeFile(valor);
  }
}
