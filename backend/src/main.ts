import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { I18nInterceptor } from './common/interceptors/i18n.interceptor';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  // Falha imediata se JWT_SECRET não estiver configurado — impede tokens forjáveis
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const app = await NestFactory.create(AppModule, {
    // Oculta stack traces em respostas de erro em produção
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['log', 'debug', 'error', 'warn', 'verbose'],
  });

  const config = app.get(ConfigService);

  // Confiar no proxy reverso (nginx/load balancer) para IP real — necessário para rate limiting correto
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Limite de tamanho de payload (previne DoS por body gigante)
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ extended: true, limit: '100kb' }));

  // Segurança: headers HTTP defensivos
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }));

  // CORS — aceita origens explícitas + todos os subdomínios *.vercel.app (preview deploys)
  const allowedOrigins = (config.get('FRONTEND_ORIGIN', 'http://localhost:8081'))
    .split(',')
    .map((o: string) => o.trim());

  app.enableCors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (/^https:\/\/[a-z0-9-]+-marilia29\.vercel\.app$/.test(origin)) return cb(null, true);
      if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return cb(null, true);
      if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(origin)) return cb(null, true);
      if (origin === 'http://localhost:5173' || origin === 'http://localhost:8081') return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    credentials: true,
  });

  // Redis Pub/Sub adapter para Socket.IO — habilita multi-instância (horizontal scaling)
  // Fallback gracioso para single-instance se Redis indisponível
  const redisIoAdapter = new RedisIoAdapter(app);
  try {
    await redisIoAdapter.connectToRedis(
      config.get('REDIS_HOST', 'localhost'),
      config.get<number>('REDIS_PORT', 6379),
      config.get('REDIS_PASSWORD') || undefined,
      config.get('REDIS_TLS') === 'true',
    );
    app.useWebSocketAdapter(redisIoAdapter);
  } catch (err: any) {
    Logger.warn(
      `Redis Socket.IO adapter não conectou (${err.message}) — WebSocket opera em single-instance`,
      'Bootstrap',
    );
  }

  // Validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
    }),
  );

  // Filtro global de exceções HTTP — formato de erro consistente
  app.useGlobalFilters(new HttpExceptionFilter());

  // Serialização global — aplica @Exclude() da entidade User (remove passwordHash de todas as respostas)
  // i18n interceptor resolve Accept-Language → req.locale antes do ClassSerializer
  app.useGlobalInterceptors(new I18nInterceptor(), new ClassSerializerInterceptor(app.get(Reflector)));

  // Prefixo global da API
  app.setGlobalPrefix('api/v1');

  // Swagger — disponível apenas fora de produção
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Sentido API')
      .setDescription('API de acompanhamento médico — Sentido App')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .addTag('auth', 'Autenticação e perfil do usuário')
      .addTag('records', 'Registros de humor, sintomas e medicações')
      .addTag('appointments', 'Consultas médicas')
      .addTag('observations', 'Observações clínicas')
      .addTag('consent', 'Vínculos médico-paciente')
      .addTag('wearables', 'Dados de dispositivos vestíveis')
      .addTag('export', 'Exportação de histórico em PDF')
      .addTag('chat', 'Histórico de chat por sala')
      .addTag('health', 'Health check da API')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = config.get('PORT', 3000);
  await app.listen(port);
}
bootstrap();
