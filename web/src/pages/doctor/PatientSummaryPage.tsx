import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { doctorApi } from '../../api';
import type { ClinicalObservation, MedicationRecord, PatientSummary } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

type Tab = 'medications' | 'prontuario';

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

function MedicationSection({
  medications, patientId, onAdd,
}: {
  medications: MedicationRecord[];
  patientId: string;
  onAdd: (m: MedicationRecord) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await doctorApi.prescribeMedication(patientId, { name: name.trim(), dose: dose.trim() || undefined });
      onAdd(data);
      setName(''); setDose(''); setShowForm(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao salvar prescrição. Tente novamente.');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" className="text-xs" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancelar' : '+ Prescrever medicamento'}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-lg border border-gray-200 p-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Nome do medicamento</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Ex: Fluoxetina"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Dose / Posologia</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Ex: 20mg — 1x ao dia"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={save} loading={saving}>Salvar prescrição</Button>
        </div>
      )}

      {medications.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhum medicamento registrado.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Última prescrição</h3>
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 space-y-1">
              <p className="text-sm font-medium text-gray-800">{medications[0].name}{medications[0].dose ? ` — ${medications[0].dose}` : ''}</p>
              <div className="flex items-center gap-2">
                <Badge color={medications[0].taken ? 'green' : 'red'}>{medications[0].taken ? 'Tomado' : 'Não tomado'}</Badge>
                {medications[0].prescribedBy && <Badge color="blue">Prescrito pelo médico</Badge>}
                <span className="text-xs text-gray-400">
                  {format(new Date(medications[0].createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>

          {medications.length > 1 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Histórico de medicamentos</h3>
              <div className="space-y-2">
                {medications.slice(1).map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                    <div>
                      <p className="text-sm text-gray-700">{m.name}{m.dose ? ` — ${m.dose}` : ''}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-400">{format(new Date(m.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                        {m.prescribedBy && <Badge color="blue">Médico</Badge>}
                      </div>
                    </div>
                    <Badge color={m.taken ? 'green' : 'red'}>{m.taken ? 'Tomado' : 'Não tomado'}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProntuarioSection({
  observations, patientId, onAdd,
}: {
  observations: ClinicalObservation[];
  patientId: string;
  onAdd: (obs: ClinicalObservation) => void;
}) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<'info' | 'warn' | 'critical'>('info');
  const [saving, setSaving] = useState(false);

  const severityColor: Record<string, 'blue' | 'yellow' | 'red'> = {
    info: 'blue', warn: 'yellow', critical: 'red',
  };

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const { data } = await doctorApi.createObservation(patientId, { content, severity });
      onAdd(data);
      setContent(''); setSeverity('info'); setShowForm(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" className="text-xs" onClick={() => setShowForm((s) => !s)}>
          {showForm ? t('common.cancel') : '+ Nova anotação'}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-lg border border-gray-200 p-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Gravidade</label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as typeof severity)}
            >
              <option value="info">Informação</option>
              <option value="warn">Atenção</option>
              <option value="critical">Crítico</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Anotação clínica</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
              rows={4}
              placeholder="Descreva as observações, diagnóstico, conduta..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <Button onClick={save} loading={saving}>{t('common.save')}</Button>
        </div>
      )}

      <div className="space-y-3">
        {observations.map((obs) => (
          <div key={obs.id} className="flex gap-3 rounded-lg border border-gray-100 p-3">
            <Badge color={severityColor[obs.severity]}>{obs.severity === 'info' ? 'Info' : obs.severity === 'warn' ? 'Atenção' : 'Crítico'}</Badge>
            <div className="flex-1">
              <p className="text-sm text-gray-700">{obs.content}</p>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(obs.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {' · '}{obs.triggeredBy === 'doctor' ? 'Médico' : 'Sistema'}
              </p>
            </div>
          </div>
        ))}
        {observations.length === 0 && (
          <p className="text-sm text-gray-400">Nenhuma anotação registrada.</p>
        )}
      </div>
    </div>
  );
}

export default function PatientSummaryPage() {
  const { t } = useTranslation();
  const { patientId } = useParams<{ patientId: string }>();
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('medications');

  useEffect(() => {
    if (!patientId) return;
    Promise.all([
      doctorApi.getPatientSummary(patientId),
      doctorApi.listObservations(patientId).catch(() => ({ data: [] as ClinicalObservation[] })),
      doctorApi.listPatientMedications(patientId).catch(() => ({ data: [] as MedicationRecord[] })),
    ]).then(([summaryRes, obsRes, medsRes]) => {
      setSummary({ ...summaryRes.data, observations: obsRes.data ?? [] });
      setMedications(medsRes.data ?? []);
    }).finally(() => setLoading(false));
  }, [patientId]);

  const handleAddObs = (obs: ClinicalObservation) => {
    setSummary((prev) => prev ? { ...prev, observations: [obs, ...prev.observations] } : prev);
  };

  const handleAddMed = (med: MedicationRecord) => {
    setMedications((prev) => [med, ...prev]);
  };

  if (loading) return <p className="text-sm text-gray-400">{t('common.loading')}</p>;
  if (!summary) return <p className="text-sm text-red-400">Paciente não encontrado</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/doctor/patients" className="text-sm text-indigo-600 hover:underline">
        ← Meus pacientes
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{summary.patient.fullName}</h1>
        <p className="text-sm text-gray-400">{summary.patient.email}</p>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-xs text-gray-500 mb-1">Humor médio</p>
          <p className="text-3xl font-bold text-indigo-600">{(summary.avgMood ?? 0).toFixed(1)}</p>
          <p className="text-xs text-gray-400">/ 5</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 mb-1">Medicações perdidas</p>
          <p className={`text-3xl font-bold ${summary.missedMeds >= 3 ? 'text-red-500' : 'text-gray-700'}`}>{summary.missedMeds}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500 mb-1">Sintomas críticos</p>
          <p className={`text-3xl font-bold ${summary.criticalSymptoms >= 2 ? 'text-red-500' : 'text-gray-700'}`}>{summary.criticalSymptoms}</p>
        </Card>
      </div>

      <Card>
        <p className="text-sm font-semibold text-gray-700 mb-3">Índice de risco</p>
        <RiskMeter score={summary.riskScore} />
      </Card>

      {/* Abas */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {([
            { key: 'medications', label: 'Medicamentos' },
            { key: 'prontuario', label: 'Prontuário' },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {tab === 'medications' ? (
          <MedicationSection medications={medications} patientId={patientId!} onAdd={handleAddMed} />
        ) : (
          <ProntuarioSection
            observations={summary.observations}
            patientId={patientId!}
            onAdd={handleAddObs}
          />
        )}
      </Card>
    </div>
  );
}
