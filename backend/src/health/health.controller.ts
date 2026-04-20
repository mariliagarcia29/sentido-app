import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly db: DataSource,
    @InjectQueue('pdf') private readonly pdfQueue: Queue,
  ) {}

  @Get()
  async check() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const database = checks[0].status === 'fulfilled' ? checks[0].value : { status: 'down', error: (checks[0] as PromiseRejectedResult).reason?.message };
    const redis    = checks[1].status === 'fulfilled' ? checks[1].value : { status: 'down', error: (checks[1] as PromiseRejectedResult).reason?.message };

    const allHealthy = database.status === 'up' && redis.status === 'up';

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version ?? '0.0.0',
      checks: { database, redis },
    };
  }

  private async checkDatabase() {
    const start = Date.now();
    await this.db.query('SELECT 1');
    return { status: 'up', latencyMs: Date.now() - start };
  }

  private async checkRedis() {
    const start = Date.now();
    const client = await this.pdfQueue.client;
    await (client as any).ping();
    return { status: 'up', latencyMs: Date.now() - start };
  }
}
