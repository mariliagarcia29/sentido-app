import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { User, UserRole } from '../users/entities/user.entity';
import { AuditLog } from '../common/entities/audit-log.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockUser: Partial<User> = {
  id: 'user-uuid',
  email: 'test@example.com',
  fullName: 'Test User',
  role: UserRole.PATIENT,
  locale: 'pt-BR',
  passwordHash: '',
};

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: ReturnType<typeof mockRepo>;
  let auditRepo: ReturnType<typeof mockRepo>;
  let jwtService: JwtService;

  beforeEach(async () => {
    usersRepo = mockRepo();
    auditRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(AuditLog), useValue: auditRepo },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('mocked-jwt-token') } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('deve criar um novo usuário e retornar access_token', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      usersRepo.create.mockReturnValue(mockUser);
      usersRepo.save.mockResolvedValue(mockUser);
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      const result = await service.register(
        { email: 'test@example.com', password: 'senha123', fullName: 'Test User' },
        '127.0.0.1',
      );

      expect(result).toHaveProperty('access_token', 'mocked-jwt-token');
      expect(result.user.email).toBe('test@example.com');
      expect(usersRepo.save).toHaveBeenCalledTimes(1);
      expect(auditRepo.save).toHaveBeenCalledTimes(1);
    });

    it('deve lançar ConflictException se e-mail já existe', async () => {
      usersRepo.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'test@example.com', password: 'senha123', fullName: 'Test' }, '127.0.0.1'),
      ).rejects.toThrow(ConflictException);

      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('deve hashear a senha antes de salvar', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      usersRepo.create.mockImplementation((dto) => dto);
      usersRepo.save.mockImplementation(async (u) => ({ ...u, id: 'new-uuid', role: UserRole.PATIENT, locale: 'pt-BR' }));
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      await service.register({ email: 'new@test.com', password: 'plaintext', fullName: 'Novo' }, '127.0.0.1');

      const savedUser = usersRepo.create.mock.calls[0][0];
      expect(savedUser.passwordHash).toBeDefined();
      expect(savedUser.passwordHash).not.toBe('plaintext');
      const valid = await bcrypt.compare('plaintext', savedUser.passwordHash);
      expect(valid).toBe(true);
    });
  });

  // ── login ────────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('deve retornar access_token com credenciais válidas', async () => {
      const hash = await bcrypt.hash('senha123', 12);
      usersRepo.findOne.mockResolvedValue({ ...mockUser, passwordHash: hash });
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      const result = await service.login({ email: 'test@example.com', password: 'senha123' }, '127.0.0.1');

      expect(result).toHaveProperty('access_token', 'mocked-jwt-token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' }),
      );
    });

    it('deve lançar UnauthorizedException para usuário inexistente', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'naoexiste@test.com', password: 'qualquer' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException para senha incorreta', async () => {
      const hash = await bcrypt.hash('correta', 12);
      usersRepo.findOne.mockResolvedValue({ ...mockUser, passwordHash: hash });

      await expect(
        service.login({ email: 'test@example.com', password: 'errada' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException para usuário OAuth sem passwordHash', async () => {
      usersRepo.findOne.mockResolvedValue({ ...mockUser, passwordHash: null });

      await expect(
        service.login({ email: 'test@example.com', password: 'qualquer' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve registrar audit log no login bem-sucedido', async () => {
      const hash = await bcrypt.hash('senha123', 12);
      usersRepo.findOne.mockResolvedValue({ ...mockUser, passwordHash: hash });
      auditRepo.create.mockReturnValue({ action: 'LOGIN' });
      auditRepo.save.mockResolvedValue({});

      await service.login({ email: 'test@example.com', password: 'senha123' }, '10.0.0.1');

      expect(auditRepo.save).toHaveBeenCalledTimes(1);
    });
  });
});
