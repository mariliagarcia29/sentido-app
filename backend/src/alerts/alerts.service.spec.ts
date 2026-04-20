import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AlertsService } from './alerts.service';
import { MoodEntry } from '../records/entities/mood-entry.entity';
import { MedicationRecord } from '../records/entities/medication-record.entity';
import { ObservationsService } from '../observations/observations.service';
import { ObservationSeverity } from '../observations/entities/clinical-observation.entity';

const mockRepo = () => ({ find: jest.fn(), create: jest.fn(), save: jest.fn() });

const USER_ID = 'patient-uuid';

const makeMood = (score: number): Partial<MoodEntry> => ({
  id: `mood-${Math.random()}`,
  userId: USER_ID,
  score,
  createdAt: new Date(),
});

describe('AlertsService', () => {
  let service: AlertsService;
  let moodsRepo: ReturnType<typeof mockRepo>;
  let medicationsRepo: ReturnType<typeof mockRepo>;
  let observationsService: { createBySystem: jest.Mock };

  beforeEach(async () => {
    moodsRepo = mockRepo();
    medicationsRepo = mockRepo();
    observationsService = { createBySystem: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: getRepositoryToken(MoodEntry), useValue: moodsRepo },
        { provide: getRepositoryToken(MedicationRecord), useValue: medicationsRepo },
        { provide: ObservationsService, useValue: observationsService },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── checkMoodAnomaly ─────────────────────────────────────────────────────────

  describe('checkMoodAnomaly', () => {
    it('não deve criar observação com menos de 3 registros', async () => {
      moodsRepo.find.mockResolvedValue([makeMood(1), makeMood(1)]);

      await service.checkMoodAnomaly(USER_ID);

      expect(observationsService.createBySystem).not.toHaveBeenCalled();
    });

    it('não deve criar observação com humores variados', async () => {
      moodsRepo.find.mockResolvedValue([makeMood(8), makeMood(2), makeMood(7), makeMood(5), makeMood(4)]);

      await service.checkMoodAnomaly(USER_ID);

      expect(observationsService.createBySystem).not.toHaveBeenCalled();
    });

    it('deve criar observação WARN quando todos os humores são ≤ 2', async () => {
      moodsRepo.find.mockResolvedValue([makeMood(2), makeMood(1), makeMood(2), makeMood(1), makeMood(2)]);

      await service.checkMoodAnomaly(USER_ID);

      expect(observationsService.createBySystem).toHaveBeenCalledWith(
        USER_ID,
        expect.stringContaining('humor consistentemente baixo'),
        ObservationSeverity.WARN,
      );
    });

    it('deve criar observação CRITICAL quando 3 humores consecutivos são score 1', async () => {
      moodsRepo.find.mockResolvedValue([makeMood(1), makeMood(1), makeMood(1), makeMood(3), makeMood(5)]);

      await service.checkMoodAnomaly(USER_ID);

      expect(observationsService.createBySystem).toHaveBeenCalledWith(
        USER_ID,
        expect.stringContaining('crítico'),
        ObservationSeverity.CRITICAL,
      );
    });

    it('deve criar ambas WARN e CRITICAL quando condições são atendidas', async () => {
      // 5 humores todos ≤ 2, sendo os 3 primeiros = 1 → dispara WARN e CRITICAL
      moodsRepo.find.mockResolvedValue([makeMood(1), makeMood(1), makeMood(1), makeMood(2), makeMood(2)]);

      await service.checkMoodAnomaly(USER_ID);

      expect(observationsService.createBySystem).toHaveBeenCalledTimes(2);
    });
  });

  // ── checkMedicationMissed ────────────────────────────────────────────────────

  describe('checkMedicationMissed', () => {
    it('não deve criar alerta com menos de 3 medicações perdidas', async () => {
      medicationsRepo.find.mockResolvedValue([
        { id: '1', taken: false },
        { id: '2', taken: false },
      ]);

      await service.checkMedicationMissed(USER_ID);

      expect(observationsService.createBySystem).not.toHaveBeenCalled();
    });

    it('deve criar alerta WARN com 3 ou mais medicações perdidas', async () => {
      medicationsRepo.find.mockResolvedValue([
        { id: '1', taken: false },
        { id: '2', taken: false },
        { id: '3', taken: false },
      ]);

      await service.checkMedicationMissed(USER_ID);

      expect(observationsService.createBySystem).toHaveBeenCalledWith(
        USER_ID,
        expect.stringContaining('medicaç'),
        ObservationSeverity.WARN,
      );
    });
  });

  // ── checkCriticalSymptom ─────────────────────────────────────────────────────

  describe('checkCriticalSymptom', () => {
    it('deve criar alerta WARN para sintoma de severidade high', async () => {
      await service.checkCriticalSymptom(USER_ID, 'Dor no peito', 'high');

      expect(observationsService.createBySystem).toHaveBeenCalledWith(
        USER_ID,
        expect.stringContaining('Dor no peito'),
        ObservationSeverity.WARN,
      );
    });

    it('não deve criar alerta para severidade low', async () => {
      await service.checkCriticalSymptom(USER_ID, 'Cansaço leve', 'low');

      expect(observationsService.createBySystem).not.toHaveBeenCalled();
    });
  });
});
