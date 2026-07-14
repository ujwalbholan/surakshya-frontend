import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @ApiOperation({ summary: 'Health check endpoint' })
  @Get()
  async check() {
    const processUptimeSeconds = process.uptime();
    const uptimeMs = Date.now() - this.startedAt;

    let database: 'up' | 'down' = 'down';
    let databaseLatencyMs: number | null = null;

    try {
      const pingStarted = Date.now();
      await this.dataSource.query('SELECT 1');
      databaseLatencyMs = Date.now() - pingStarted;
      database = 'up';
    } catch {
      database = 'down';
    }

    const status = database === 'up' ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: processUptimeSeconds,
      uptime_ms: uptimeMs,
      database,
      database_latency_ms: databaseLatencyMs,
    };
  }
}
