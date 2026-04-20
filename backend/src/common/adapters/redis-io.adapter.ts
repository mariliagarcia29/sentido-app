import { INestApplication, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | undefined;

  constructor(app: INestApplication) {
    super(app);
  }

  async connectToRedis(
    host: string,
    port: number,
    password?: string,
    tls?: boolean,
  ): Promise<void> {
    const redisOpts = {
      host,
      port,
      password: password || undefined,
      tls: tls ? ({} as any) : undefined,
      // Reconnect automaticamente — crítico para Pub/Sub persistente
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
    };

    const pubClient = new Redis(redisOpts);
    const subClient = pubClient.duplicate();

    // Aguarda os dois clientes ficarem prontos antes de criar o adapter
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        pubClient.once('ready', resolve);
        pubClient.once('error', reject);
      }),
      new Promise<void>((resolve, reject) => {
        subClient.once('ready', resolve);
        subClient.once('error', reject);
      }),
    ]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.logger.log(`Redis Socket.IO adapter conectado em ${host}:${port}`);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
