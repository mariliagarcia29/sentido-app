import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ConsentRecord, ConsentStatus } from './entities/consent-record.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { InvitePatientDto } from './dto/invite-patient.dto';
import { AuditLog } from '../common/entities/audit-log.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ConsentService {
  constructor(
    @InjectRepository(ConsentRecord) private readonly consents: Repository<ConsentRecord>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AuditLog) private readonly auditLogs: Repository<AuditLog>,
    private readonly notifications: NotificationsService,
  ) {}

  // Paciente solicita vínculo com médico pelo e-mail
  async requestByPatient(patientId: string, doctorEmail: string, ip: string) {
    const doctor = await this.users.findOne({ where: { email: doctorEmail, role: UserRole.DOCTOR } });
    if (!doctor) throw new NotFoundException('Médico não encontrado com este e-mail');

    const existing = await this.consents.findOne({
      where: { doctorId: doctor.id, patientId, status: ConsentStatus.ACTIVE },
    });
    if (existing) throw new BadRequestException('Já existe vínculo ativo com este médico');

    const record = await this.consents.save(
      this.consents.create({ doctorId: doctor.id, patientId, accessLevel: 'full', status: ConsentStatus.ACTIVE }),
    );
    await this.log(patientId, 'CONSENT_REQUEST', `doctors/${doctor.id}`, ip);

    // Notifica o médico que um paciente solicitou vínculo
    this.notifications.sendToUser(doctor.id, {
      title: '🔗 Solicitação de vínculo',
      body: 'Um paciente solicitou acesso ao seu acompanhamento médico.',
      data: { type: 'consent_request', consentId: record.id },
    }).catch(() => {});

    return record;
  }

  // Médico convida paciente pelo e-mail
  async invite(doctorId: string, dto: InvitePatientDto, ip: string) {
    const patient = await this.users.findOne({ where: { email: dto.patientEmail, role: UserRole.PATIENT } });
    if (!patient) throw new NotFoundException('Paciente não encontrado com este e-mail');

    const existing = await this.consents.findOne({
      where: { doctorId, patientId: patient.id, status: ConsentStatus.ACTIVE },
    });
    if (existing) throw new BadRequestException('Já existe vínculo ativo com este paciente');

    const record = await this.consents.save(
      this.consents.create({ doctorId, patientId: patient.id, accessLevel: dto.accessLevel, status: ConsentStatus.ACTIVE }),
    );
    await this.log(doctorId, 'CONSENT_INVITE', `patients/${patient.id}`, ip);

    // Notifica o paciente que o médico solicitou acesso
    this.notifications.sendToUser(patient.id, {
      title: '🔒 Solicitação de acesso médico',
      body: 'Um médico solicitou acesso aos seus dados de saúde. Acesse o app para aprovar ou recusar.',
      data: { type: 'consent_invite', consentId: record.id },
    }).catch(() => {});

    return record;
  }

  // Paciente aprova ou rejeita convite
  async respond(consentId: string, patientId: string, approve: boolean, ip: string) {
    const record = await this.consents.findOne({
      where: { id: consentId, patientId },
      relations: ['doctor'],
    });
    if (!record) throw new NotFoundException('Convite não encontrado');
    if (record.status !== ConsentStatus.PENDING) throw new BadRequestException('Convite já respondido');

    record.status = approve ? ConsentStatus.ACTIVE : ConsentStatus.REVOKED;
    await this.consents.save(record);
    await this.log(patientId, approve ? 'CONSENT_APPROVED' : 'CONSENT_REJECTED', `consents/${consentId}`, ip);

    // Notifica o médico sobre a decisão do paciente
    if (record.doctorId) {
      const action = approve ? 'aprovou' : 'recusou';
      this.notifications.sendToUser(record.doctorId, {
        title: approve ? '✅ Acesso aprovado' : '❌ Acesso recusado',
        body: `O paciente ${action} sua solicitação de acesso.`,
        data: { type: approve ? 'consent_approved' : 'consent_rejected', consentId },
      }).catch(() => {});
    }

    return record;
  }

  // Paciente revoga acesso de médico ativo
  async revoke(consentId: string, patientId: string, ip: string) {
    const record = await this.consents.findOne({
      where: { id: consentId, patientId },
      relations: ['doctor'],
    });
    if (!record) throw new NotFoundException('Vínculo não encontrado');
    if (record.status !== ConsentStatus.ACTIVE) throw new BadRequestException('Vínculo não está ativo');

    record.status = ConsentStatus.REVOKED;
    await this.consents.save(record);
    await this.log(patientId, 'CONSENT_REVOKED', `consents/${consentId}`, ip);

    // Notifica o médico que o acesso foi revogado
    if (record.doctorId) {
      this.notifications.sendToUser(record.doctorId, {
        title: '🚫 Acesso revogado',
        body: 'Um paciente revogou seu acesso aos dados de saúde.',
        data: { type: 'consent_revoked', consentId },
      }).catch(() => {});
    }

    return record;
  }

  // Paciente vê solicitações pendentes (aguardando aprovação dele)
  getPending(patientId: string) {
    return this.consents.find({
      where: { patientId, status: ConsentStatus.PENDING },
      relations: ['doctor'],
      order: { createdAt: 'DESC' },
    });
  }

  // Paciente vê seus médicos com acesso
  getMyDoctors(patientId: string) {
    return this.consents.find({
      where: { patientId },
      relations: ['doctor'],
      order: { updatedAt: 'DESC' },
    });
  }

  // Médico vê seus pacientes vinculados
  getMyPatients(doctorId: string) {
    return this.consents.find({
      where: { doctorId, status: ConsentStatus.ACTIVE },
      relations: ['patient'],
      order: { updatedAt: 'DESC' },
    });
  }

  // Verifica se médico tem consentimento ativo para um paciente (usado por outros módulos)
  async assertConsent(doctorId: string, patientId: string) {
    const record = await this.consents.findOne({
      where: { doctorId, patientId, status: ConsentStatus.ACTIVE },
      relations: ['patient'],
    });
    if (!record) throw new ForbiddenException('Sem consentimento ativo para este paciente');
    return record;
  }

  private async log(userId: string, action: string, resource: string, ip: string) {
    await this.auditLogs.save(
      this.auditLogs.create({ userId, action, targetResource: resource, ipAddress: ip }),
    );
  }
}
