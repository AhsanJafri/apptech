import { Controller, Get, Post } from '@nestjs/common';
import { MonitorService } from './monitor.service';

@Controller()
export class MonitorController {
  constructor(private readonly monitor: MonitorService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'adsguard-scheduler' };
  }

  /** Manual trigger for testing — remove or protect in production */
  @Post('check-now')
  async checkNow() {
    const result = await this.monitor.runAllChecks();
    return { message: 'Check complete', ...result };
  }
}
