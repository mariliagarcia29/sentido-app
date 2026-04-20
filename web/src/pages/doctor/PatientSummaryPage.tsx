import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { doctorApi } from '../../api';
import type { ClinicalObservation, PatientSummary } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

function RiskMeter({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-yellow-400' : 'bg-green-400';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>0</span><span>Índice de risco</span><span>100</span>
      </div>
      <div className="h-3 w-full rounded-full bg-gray-100">
        <div className={`h-3 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-right text-sm font-semibold">{score.toFixed(0)}/100</p>
    </div>
  );
}

export default function PatientSummaryPage() {
  const { t } = useTranslation();
  const { patientId } = useParams<{ patientId: string }>();
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<'info' | 'warn' | 'critical'>('info');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    doctorApi.getPatientSummary(patientId)
      .then((r) => setSummary(r.data))
      .finally(() => setLoading(false));
  }, [patientId]);

  const saveObservation = async () => {
    if (!patientId || !content.trim()) return;
    setSaving(true);
    try {
      const { data } = await doctorApi.createObservation(patientId, { content, severity });
      setSummary((prev) => prev ? { ...prev, observations: [data, ...prev.observations] } : prev);
      setContent(''); setSeverity('info'); setShowForm(false);
    } finally { setSaving(false); }
  };

  const severityColor: Record<string, 'blue' | 'yellow' | 'red'> = {
    info: 'blue', warn: 'yellow', critical: 'red',
  };

  if (loading) return <p className="text-sm text-gray-400">{t('common.loading')}</p>;
  if (!summary) return <p className="text-sm text-red-400">Paciente não encontrado</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/doctor/patients" className="text-sm text-indigo-600 hover:underline">← {t('doctor.patients')}</Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{summary.patient.fullName}</h1>
        <p className="text-sm text-gray-400">{summary.patient.email}</p>
      </div>

      {/* Risk metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-xs text-gray-500 mb-1">{t('doctor.avgMood')}</p>
          <p className="text-3xl font-bold text-indigo-600">{summary.avgMood.toFixed(1)}</p>
          <p className="text-xs text-gray-400">/ 5</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 mb-1">{t('doctor.missedMeds')}</p>
          <p className={`text-3xl font-bold ${summary.missedMeds >= 3 ? 'text-red-500' : 'text-gray-700'}`}>{summary.missedMeds}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 mb-1">{t('doctor.criticalSymptoms')}</p>
          <p className={`text-3xl font-bold ${summary.criticalSymptoms >= 2 ? 'text-red-500' : 'text-gray-700'}`}>{summary.criticalSymptoms}</p>
        </Card>
      </div>

      <Card>
        <p className="text-sm font-semibold text-gray-700 mb-3">{t('doctor.riskScore')}</p>
        <RiskMeter score={summary.riskScore} />
      </Card>

      {/* Observations */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">{t('nav.observations')}</h2>
          <Button variant="outline" className="text-xs" onClick={() => setShowForm((s) => !s)}>
            {showForm ? t('common.cancel') : '+ ' + t('doctor.addObservation')}
          </Button>
        </div>

        {showForm && (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('doctor.severity')}</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as typeof severity)}
              >
                <option value="info">{t('doctor.info')}</option>
                <option value="warn">{t('doctor.warn')}</option>
                <option value="critical">{t('doctor.critical')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('doctor.observationContent')}</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <Button onClick={saveObservation} loading={saving}>{t('common.save')}</Button>
          </div>
        )}

        <div className="space-y-3">
          {summary.observations.map((obs) => (
            <ObservationCard key={obs.id} obs={obs} color={severityColor[obs.severity]} t={t} />
          ))}
          {summary.observations.length === 0 && (
            <p className="text-sm text-gray-400">{t('common.noData')}</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function ObservationCard({ obs, color, t }: { obs: ClinicalObservation; color: 'blue' | 'yellow' | 'red'; t: (k: string) => string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-gray-100 p-3">
      <Badge color={color}>{t(`doctor.${obs.severity}`)}</Badge>
      <div className="flex-1">
        <p className="text-sm text-gray-700">{obs.content}</p>
        <p className="text-xs text-gray-400 mt-1">
          {format(new Date(obs.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} · {obs.triggeredBy === 'doctor' ? 'Médico' : 'Sistema'}
        </p>
      </div>
    </div>
  );
}
