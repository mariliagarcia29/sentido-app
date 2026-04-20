import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import helmet from 'helmet';
import { App } from 'supertest/types';

/**
 * E2E Auth Flow
 *
 * Estes testes verificam o fluxo completo de autenticação usando uma
 * instância real do app com banco em memória / SQLite (configurado via
 * variável de ambiente DB_TYPE=sqlite durante os testes).
 *
 * Para rodar: DB_TYPE=sqlite JWT_SECRET=test-secret npx jest --config test/jest-e2e.json
 */
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  const testEmail = `e2e-${Date.now()}@test.com`;

  // Lazy-import AppModule to allow env overrides before module init
  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-test-secret';
    process.env.NODE_ENV = 'test';

    // Importamos dinamicamente para capturar variáveis de ambiente acima
    const { AppModule } = await import('../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  // ── POST /auth/register ────────────────────────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    it('deve registrar um novo paciente e retornar access_token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: testEmail, password: 'Senha@123', fullName: 'E2E Test User' })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.role).toBe('patient');
      accessToken = res.body.access_token;
    });

    it('deve retornar 409 para e-mail duplicado', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: testEmail, password: 'Senha@123', fullName: 'Duplicado' })
        .expect(409);
    });

    it('deve retornar 400 para dados inválidos (sem e-mail)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ password: 'Senha@123', fullName: 'Sem Email' })
        .expect(400);
    });

    it('deve retornar 400 para senha muito curta', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'novo@test.com', password: '123', fullName: 'Curta' })
        .expect(400);
    });
  });

  // ── POST /auth/login ───────────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'Senha@123' })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      accessToken = res.body.access_token;
    });

    it('deve retornar 401 para senha incorreta', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'errada' })
        .expect(401);
    });

    it('deve retornar 401 para usuário inexistente', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'naoexiste@test.com', password: 'qualquer' })
        .expect(401);
    });
  });

  // ── GET /auth/me ───────────────────────────────────────────────────────────

  describe('GET /api/v1/auth/me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.email).toBe(testEmail);
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('deve retornar 401 sem token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('deve retornar 401 com token inválido', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });
  });

  // ── POST /records/moods (autenticado) ────────────────────────────────────────

  describe('POST /api/v1/records/moods', () => {
    it('deve criar registro de humor', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/records/moods')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ score: 7, note: 'Teste e2e', isPrivate: false })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.score).toBe(7);
    });

    it('deve retornar 401 sem autenticação', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/records/moods')
        .send({ score: 5 })
        .expect(401);
    });

    it('deve retornar 400 para score inválido (> 10)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/records/moods')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ score: 11 })
        .expect(400);
    });
  });

  // ── Segurança: headers ───────────────────────────────────────────────────────

  describe('Security headers', () => {
    it('deve incluir X-Content-Type-Options', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('não deve expor X-Powered-By', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'Senha@123' });

      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });
});
