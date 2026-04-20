import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { ConsentService } from './consent.service';
import { ConsentRecord, ConsentStatus } from './entities/consent-record.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { AuditLog } from '../common/entities/audit-log.entity';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const DOCTOR_ID = 'doctor-uuid';
const PATIENT_ID = 'patient-uuid';

const mockDoctor: Partial<User> = {
  id: DOCTOR_ID,
  email: 'doctor@clinic.com',
  fullName: 'Dr. Smith',
  role: UserRole.DOCTOR,
};

const mockPatient: Partial<User> = {
  id: PATIENT_ID,
  email: 'patient@test.com',
  fullName: 'Maria Silva',
  role: UserRole.PATIENT,
};

describe('ConsentService', () => {
  let service: ConsentService;
  let consentsRepo: ReturnType<typeof mockRepo>;
  let usersRepo: ReturnType<typeof mockRepo>;
  let auditRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    consentsRepo = mockRepo();
    usersRepo = mockRepo();
    auditRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        { provide: getRepositoryToken(ConsentRecord), useValue: consentsRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(AuditLog), useValue: auditRepo },
      ],
    }).compile();

    service = module.get<ConsentService>(ConsentService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── invite (médico convida paciente) ─────────────────────────────────────────

  describe('invite', () => {
    it('deve criar consentimento quando paciente existe e não há vínculo ativo', async () => {
      usersRepo.findOne.mockResolvedValueOnce(mockPatient);
      consentsRepo.findOne.mockResolvedValue(null);
      const created = { id: 'consent-1', doctorId: DOCTOR_ID, patientId: PATIENT_ID, status: ConsentStatus.PENDING };
      consentsRepo.create.mockReturnValue(created);
      consentsRepo.save.mockResolvedValue(created);
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      const result = await service.invite(DOCTOR_ID, { patientEmail: 'patient@test.com', accessLevel: 'full' }, '127.0.0.1');

      expect(result).toEqual(created);
      expect(consentsRepo.save).toHaveBeenCalledTimes(1);
    });

    it('deve lançar NotFoundException quando paciente não existe', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.invite(DOCTOR_ID, { patientEmail: 'naoexiste@test.com', accessLevel: 'full' }, '127.0.0.1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando já existe vínculo ativo', async () => {
      usersRepo.findOne.mockResolvedValueOnce(mockPatient);
      consentsRepo.findOne.mockResolvedValue({ id: 'existing', status: ConsentStatus.ACTIVE });

      await expect(
        service.invite(DOCTOR_ID, { patientEmail: 'patient@test.com', accessLevel: 'full' }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      expect(consentsRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── requestByPatient (paciente solicita vínculo) ─────────────────────────────

  describe('requestByPatient', () => {
    it('deve criar consentimento quando médico existe e não há vínculo ativo', async () => {
      usersRepo.findOne.mockResolvedValueOnce(mockDoctor);
      consentsRepo.findOne.mockResolvedValue(null);
      const created = { id: 'consent-2', doctorId: DOCTOR_ID, patientId: PATIENT_ID };
      consentsRepo.create.mockReturnValue(created);
      consentsRepo.save.mockResolvedValue(created);
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      const result = await service.requestByPatient(PATIENT_ID, 'doctor@clinic.com', '127.0.0.1');

      expect(result).toEqual(created);
    });

    it('deve lançar NotFoundException quando médico não existe', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.requestByPatient(PATIENT_ID, 'naodoctor@test.com', '127.0.0.1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException para vínculo duplicado', async () => {
      usersRepo.findOne.mockResolvedValueOnce(mockDoctor);
      consentsRepo.findOne.mockResolvedValue({ id: 'existing', status: ConsentStatus.ACTIVE });

      await expect(
        service.requestByPatient(PATIENT_ID, 'doctor@clinic.com', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── act (aprovar / revogar) ──────────────────────────────────────────────────

  describe('act', () => {
    it('deve aprovar consentimento pendente pelo médico', async () => {
      const consent = { id: 'consent-1', doctorId: DOCTOR_ID, patientId: PATIENT_ID, status: ConsentStatus.PENDING, doctor: mockDoctor, patient: mockPatient };
      consentsRepo.findOne.mockResolvedValue(consent);
      consentsRepo.save.mockImplementation(async (c) => c);
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      const result = await service.act('consent-1', 'approve', DOCTOR_ID, '127.0.0.1');

      expect(result.status).toBe(ConsentStatus.ACTIVE);
    });

    it('deve lançar ForbiddenException quando usuário não é parte do consentimento', async () => {
      const consent = { id: 'consent-1', doctorId: 'outro-doctor', patientId: PATIENT_ID, status: ConsentStatus.PENDING, doctor: {}, patient: {} };
      consentsRepo.findOne.mockResolvedValue(consent);

      await expect(
        service.act('consent-1', 'revoke', 'hacker-uuid', '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar NotFoundException para consentimento inexistente', async () => {
      consentsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.act('nao-existe', 'revoke', PATIENT_ID, '127.0.0.1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
