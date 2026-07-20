import { INestApplication, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
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
      // Sem retry — se indisponível, o app opera em single-instance sem WebSocket Redis
      retryStrategy: () => null,
      connectTimeout: 5000,
    };

    const pubClient = new Redis(redisOpts);
    const subClient = pubClient.duplicate();

    // Absorve todos os error events para não derrubar o processo com unhandled error
    pubClient.on('error', () => {});
    subClient.on('error', () => {});

    const waitReady = (client: Redis): Promise<void> =>
      new Promise<void>((resolve, reject) => {
        client.once('ready', resolve);
        client.once('close', () => reject(new Error('Redis connection closed')));
        // Timeout de segurança — não aguarda indefinidamente
        setTimeout(() => reject(new Error('Redis connect timeout')), 6000);
      });

    await Promise.all([waitReady(pubClient), waitReady(subClient)]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.logger.log(`Redis Socket.IO adapter conectado em ${host}:${port}`);
  }

  createIOServer(port: number, options?: Record<string, unknown>): any {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
