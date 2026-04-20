import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import puppeteer from 'puppeteer';

import { PdfExport, ExportStatus } from '../entities/pdf-export.entity';
import { MoodEntry } from '../../records/entities/mood-entry.entity';
import { SymptomRecord } from '../../records/entities/symptom-record.entity';
import { MedicationRecord } from '../../records/entities/medication-record.entity';
import { NotificationsService } from '../../notifications/notifications.service';

export const PDF_QUEUE = 'pdf';

@Processor(PDF_QUEUE)
export class PdfWorker {
  private readonly logger = new Logger(PdfWorker.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    @InjectRepository(PdfExport) private readonly exports: Repository<PdfExport>,
    @InjectRepository(MoodEntry) private readonly moods: Repository<MoodEntry>,
    @InjectRepository(SymptomRecord) private readonly symptoms: Repository<SymptomRecord>,
    @InjectRepository(MedicationRecord) private readonly medications: Repository<MedicationRecord>,
    config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {
    const accessKeyId = config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = config.get<string>('AWS_REGION');
    const bucket = config.get<string>('S3_BUCKET');

    // Falha rápida: credenciais S3 são obrigatórias — evita erro obscuro na hora do upload
    if (config.get('NODE_ENV') === 'production' && (!accessKeyId || !secretAccessKey || !region || !bucket)) {
      throw new Error('AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION e S3_BUCKET são obrigatórios em produção');
    }

    this.s3 = new S3Client({
      region: region ?? 'us-east-1',
      credentials: accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined,
    });
    this.bucket = bucket ?? 'sentido-exports-dev';
  }

  @Process('generate')
  async generate(job: Job<{ exportId: string }>) {
    const record = await this.exports.findOne({ where: { id: job.data.exportId }, relations: ['user'] });
    if (!record) return;

    await this.exports.update(record.id, { status: ExportStatus.PROCESSING });

    try {
      const html = await this.buildHtml(record);
      const pdfBuffer = await this.renderPdf(html);
      const key = `exports/${record.userId}/${record.id}.pdf`;

      // Passo d: upload S3 com SSE-S3 (AES-256 server-side encryption)
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ServerSideEncryption: 'AES256',
      }));

      // Passo e: URL pré-assinada com expiração de 24h
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const fileUrl = await getSignedUrl(
        this.s3,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: 86400 },
      );

      await this.exports.update(record.id, { status: ExportStatus.DONE, fileUrl, expiresAt });

      // Passo f: notifica usuário por push ao concluir
      this.notifications.sendToUser(record.userId, {
        title: 'Relatório pronto 📄',
        body: 'Seu relatório de saúde foi gerado e está disponível para download por 24h.',
        data: { type: 'export_ready', exportId: record.id },
      }).catch(() => {});

    } catch (err: any) {
      this.logger.error(`PDF generation failed for export ${record.id}: ${err.message}`);
      await this.exports.update(record.id, { status: ExportStatus.FAILED });
      throw err;
    }
  }

  private async buildHtml(record: PdfExport): Promise<string> {
    const sections: string[] = [];
    const from = new Date(record.periodFrom);
    const to = new Date(record.periodTo);
    // Inclui o fim do dia para capturar registros do último dia do período
    to.setHours(23, 59, 59, 999);

    const fromLabel = from.toLocaleDateString('pt-BR');
    const toLabel = new Date(record.periodTo).toLocaleDateString('pt-BR');

    // Passo a (complemento): filtra todos os dados pelo período solicitado — violação LGPD sem isso
    if (record.includes.includes('moods')) {
      const moods = await this.moods.find({
        where: { userId: record.userId, createdAt: Between(from, to) as any },
        order: { createdAt: 'ASC' },
      });
      const rows = moods.length > 0
        ? moods.map((m) => `<li>${new Date(m.createdAt).toLocaleDateString('pt-BR')} — Score ${m.score}${m.label ? `: ${this.escapeHtml(m.label)}` : ''}</li>`).join('')
        : '<li><em>Nenhum registro no período</em></li>';
      sections.push(`<h2>Humor</h2><ul>${rows}</ul>`);
    }

    if (record.includes.includes('symptoms')) {
      const syms = await this.symptoms.find({
        where: { userId: record.userId, createdAt: Between(from, to) as any },
        order: { createdAt: 'ASC' },
      });
      const rows = syms.length > 0
        ? syms.map((s) => `<li>${new Date(s.createdAt).toLocaleDateString('pt-BR')} — ${this.escapeHtml(s.symptom)} (${s.severity})</li>`).join('')
        : '<li><em>Nenhum registro no período</em></li>';
      sections.push(`<h2>Sintomas</h2><ul>${rows}</ul>`);
    }

    if (record.includes.includes('medications')) {
      const meds = await this.medications.find({
        where: { userId: record.userId, createdAt: Between(from, to) as any },
        order: { createdAt: 'ASC' },
      });
      const rows = meds.length > 0
        ? meds.map((m) => `<li>${new Date(m.createdAt).toLocaleDateString('pt-BR')} — ${this.escapeHtml(m.name)}${m.dose ? ` ${this.escapeHtml(m.dose)}` : ''} (${m.taken ? 'tomado' : 'não tomado'})</li>`).join('')
        : '<li><em>Nenhum registro no período</em></li>';
      sections.push(`<h2>Medicações</h2><ul>${rows}</ul>`);
    }

    if (sections.length === 0) {
      sections.push('<p><em>Nenhum dado encontrado para o período e categorias selecionados.</em></p>');
    }

    return `<!DOCTYPE html><html lang="pt-BR"><head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1a202c; }
        h1 { color: #2D7DD2; }
        h2 { color: #3BB273; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 32px; }
        ul { line-height: 2; list-style: none; padding: 0; }
        li { color: #4a5568; border-bottom: 1px solid #f7fafc; padding: 4px 0; }
        .header { margin-bottom: 32px; }
        .period { color: #718096; font-size: 14px; }
        .warning {
          background: #FEF9EC; border: 1px solid #F9C74F;
          padding: 12px 16px; border-radius: 8px; margin-bottom: 24px;
          font-size: 13px; color: #744210;
        }
        .footer { margin-top: 48px; font-size: 11px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 12px; }
      </style>
    </head><body>
      <div class="header">
        <h1>Sentido — Relatório de Saúde</h1>
        <p class="period">Período: ${fromLabel} até ${toLabel}</p>
        <p class="period">Paciente: ${this.escapeHtml(record.user?.fullName ?? record.userId)}</p>
        <p class="period">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
      <div class="warning">
        ⚠️ <strong>Dados sensíveis de saúde — LGPD (Lei 13.709/2018)</strong><br>
        Este documento contém informações de saúde protegidas por lei. Não compartilhe sem autorização expressa do titular dos dados.
        O compartilhamento não autorizado pode configurar infração à LGPD.
      </div>
      ${sections.join('')}
      <div class="footer">Sentido App · Exportação gerada automaticamente · URL válida por 24h</div>
    </body></html>`;
  }

  // Passo b/c: renderiza HTML → PDF via Puppeteer com try-finally para garantir fechamento do browser
  private async renderPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
        printBackground: true,
      });
      return Buffer.from(pdf);
    } finally {
      // Garante fechamento mesmo se ocorrer erro durante renderização
      await browser.close();
    }
  }

  // Escapa caracteres HTML para prevenir XSS no PDF
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
