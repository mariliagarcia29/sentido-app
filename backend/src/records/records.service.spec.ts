import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { RecordsService } from './records.service';
import { MoodEntry } from './entities/mood-entry.entity';
import { SymptomRecord } from './entities/symptom-record.entity';
import { MedicationRecord } from './entities/medication-record.entity';
import { AlertsService } from '../alerts/alerts.service';

const mockRepo = () => ({
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const USER_ID = 'patient-uuid';

describe('RecordsService', () => {
  let service: RecordsService;
  let moodsRepo: ReturnType<typeof mockRepo>;
  let symptomsRepo: ReturnType<typeof mockRepo>;
  let medicationsRepo: ReturnType<typeof mockRepo>;
  let alertsService: { checkMoodAnomaly: jest.Mock; checkCriticalSymptom: jest.Mock; checkMedicationMissed: jest.Mock };

  beforeEach(async () => {
    moodsRepo = mockRepo();
    symptomsRepo = mockRepo();
    medicationsRepo = mockRepo();
    alertsService = {
      checkMoodAnomaly: jest.fn().mockResolvedValue(undefined),
      checkCriticalSymptom: jest.fn().mockResolvedValue(undefined),
      checkMedicationMissed: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordsService,
        { provide: getRepositoryToken(MoodEntry), useValue: moodsRepo },
        { provide: getRepositoryToken(SymptomRecord), useValue: symptomsRepo },
        { provide: getRepositoryToken(MedicationRecord), useValue: medicationsRepo },
        { provide: AlertsService, useValue: alertsService },
      ],
    }).compile();

    service = module.get<RecordsService>(RecordsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── Mood ─────────────────────────────────────────────────────────────────────

  describe('getMoods', () => {
    it('deve retornar lista de humor do usuário', async () => {
      const moods = [{ id: '1', score: 8, userId: USER_ID }];
      moodsRepo.find.mockResolvedValue(moods);

      const result = await service.getMoods(USER_ID);

      expect(result).toEqual(moods);
      expect(moodsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_ID } }),
      );
    });
  });

  describe('createMood', () => {
    it('deve criar entrada de humor e disparar verificação de anomalia', async () => {
      const dto = { score: 3, note: 'Dia difícil', isPrivate: false };
      const created = { id: 'mood-1', userId: USER_ID, ...dto };
      moodsRepo.create.mockReturnValue(created);
      moodsRepo.save.mockResolvedValue(created);

      const result = await service.createMood(USER_ID, dto);

      expect(result).toEqual(created);
      expect(moodsRepo.save).toHaveBeenCalledTimes(1);
      // Aguarda microtask da chamada async fire-and-forget
      await Promise.resolve();
      expect(alertsService.checkMoodAnomaly).toHaveBeenCalledWith(USER_ID);
    });

    it('deve criar humor privado corretamente', async () => {
      const dto = { score: 2, isPrivate: true };
      const created = { id: 'mood-2', userId: USER_ID, ...dto };
      moodsRepo.create.mockReturnValue(created);
      moodsRepo.save.mockResolvedValue(created);

      const result = await service.createMood(USER_ID, dto);
      expect(result.isPrivate).toBe(true);
    });
  });

  // ── Symptom ───────────────────────────────────────────────────────────────────

  describe('createSymptom', () => {
    it('deve criar sintoma e disparar verificação para severity grave', async () => {
      const dto = { symptom: 'Dor no peito', severity: 'high', isPrivate: false };
      const created = { id: 'sym-1', userId: USER_ID, ...dto };
      symptomsRepo.create.mockReturnValue(created);
      symptomsRepo.save.mockResolvedValue(created);

      await service.createSymptom(USER_ID, dto);

      await Promise.resolve();
      expect(alertsService.checkCriticalSymptom).toHaveBeenCalledWith(USER_ID, 'Dor no peito', 'high');
    });

    it('não deve disparar alerta para sintoma sem severity', async () => {
      const dto = { symptom: 'Cansaço leve', isPrivate: false };
      const created = { id: 'sym-2', userId: USER_ID, ...dto };
      symptomsRepo.create.mockReturnValue(created);
      symptomsRepo.save.mockResolvedValue(created);

      await service.createSymptom(USER_ID, dto);

      await Promise.resolve();
      expect(alertsService.checkCriticalSymptom).not.toHaveBeenCalled();
    });
  });

  // ── Medication ────────────────────────────────────────────────────────────────

  describe('createMedication', () => {
    it('deve criar medicação tomada sem disparar alerta', async () => {
      const dto = { name: 'Rivotril', dose: '0.5mg', taken: true, scheduledAt: new Date().toISOString() };
      const created = { id: 'med-1', userId: USER_ID, ...dto };
      medicationsRepo.create.mockReturnValue(created);
      medicationsRepo.save.mockResolvedValue(created);

      await service.createMedication(USER_ID, dto);

      await Promise.resolve();
      expect(alertsService.checkMedicationMissed).not.toHaveBeenCalled();
    });

    it('deve disparar alerta quando medicação não foi tomada', async () => {
      const dto = { name: 'Rivotril', dose: '0.5mg', taken: false, scheduledAt: new Date().toISOString() };
      const created = { id: 'med-2', userId: USER_ID, ...dto };
      medicationsRepo.create.mockReturnValue(created);
      medicationsRepo.save.mockResolvedValue(created);

      await service.createMedication(USER_ID, dto);

      await Promise.resolve();
      expect(alertsService.checkMedicationMissed).toHaveBeenCalledWith(USER_ID);
    });
  });
});
