import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { doctorApi } from '../../api';
import type { ClinicalObservation, MedicationRecord, PatientSummary, SymptomRecord } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

type Tab = 'medications' | 'sintomas' | 'prontuario';

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
  medications, patientId, onAdd, onArchive,
}: {
  medications: MedicationRecord[];
  patientId: string;
  onAdd: (m: MedicationRecord) => void;
  onArchive: (id: string) => void;
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

  const current = medications.filter((m) => m.prescribedBy && !m.archivedAt);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" className="text-xs" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancelar' : '+ Nova prescrição'}
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

      {current.length === 0 && (
        <p className="text-sm text-gray-400">Nenhum medicamento prescrito no momento.</p>
      )}

      {current.length > 0 && (
        <div className="space-y-2">
          {current.map((m) => (
            <div key={m.id} className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{m.name}{m.dose ? ` — ${m.dose}` : ''}</p>
                <button
                  onClick={async () => {
                    try {
                      await doctorApi.archiveMedication(patientId, m.id);
                      onArchive(m.id);
                    } catch (e: any) {
                      alert(e?.response?.data?.message ?? 'Erro ao arquivar prescrição');
                    }
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 whitespace-nowrap"
                >
                  Tornar histórico
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={m.taken ? 'green' : 'red'}>{m.taken ? 'Tomado' : 'Não tomado pelo paciente'}</Badge>
                <span className="text-xs text-gray-400">desde {format(new Date(m.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProntuarioSection({
  observations, patientId, onAdd, historicalMeds, onUnarchive,
}: {
  observations: ClinicalObservation[];
  patientId: string;
  onAdd: (obs: ClinicalObservation) => void;
  historicalMeds: MedicationRecord[];
  onUnarchive: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [obsType, setObsType] = useState<'note' | 'diagnosis'>('note');
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<'info' | 'warn' | 'critical'>('info');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const severityColor: Record<string, 'blue' | 'yellow' | 'red'> = {
    info: 'blue', warn: 'yellow', critical: 'red',
  };

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const { data } = await doctorApi.createObservation(patientId, { content, severity, observationType: obsType });
      onAdd(data);
      setContent(''); setSeverity('info'); setObsType('note'); setShowForm(false);
    } finally { setSaving(false); }
  };

  const diagnoses = (observations ?? []).filter((o) => o.observationType === 'diagnosis');
  const notes = (observations ?? []).filter((o) => o.observationType !== 'diagnosis');

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" className="text-xs" onClick={() => setShowForm((s) => !s)}>
          {showForm ? t('common.cancel') : '+ Nova anotação'}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-lg border border-gray-200 p-4">
          <div className="flex gap-3">
            {(['note', 'diagnosis'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setObsType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${obsType === type ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}
              >
                {type === 'note' ? 'Anotação clínica' : 'Diagnóstico'}
              </button>
            ))}
          </div>
          {obsType === 'note' && (
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
          )}
          <div>
            <label className="text-sm font-medium text-gray-700">
              {obsType === 'diagnosis' ? 'Diagnóstico' : 'Anotação clínica'}
            </label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
              rows={4}
              placeholder={obsType === 'diagnosis' ? 'Descreva o diagnóstico do paciente...' : 'Descreva as observações, conduta...'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <Button onClick={save} loading={saving}>{t('common.save')}</Button>
        </div>
      )}

      {diagnoses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Diagnósticos</h3>
          {diagnoses.map((obs) => (
            <div key={obs.id} className="rounded-lg border border-purple-100 bg-purple-50 p-3">
              <p className="text-sm text-gray-800 font-medium">{obs.content}</p>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(obs.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {diagnoses.length > 0 && notes.length > 0 && (
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Anotações clínicas</h3>
        )}
        {notes.map((obs) => (
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
        {(observations ?? []).length === 0 && (
          <p className="text-sm text-gray-400">Nenhuma anotação registrada.</p>
        )}
      </div>

      {/* Histórico de medicamentos */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={() => setShowHistory((s) => !s)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Histórico de medicamentos
            {historicalMeds.length > 0 && (
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                {historicalMeds.length}
              </span>
            )}
          </span>
          <span className="text-xs text-gray-400">{showHistory ? '▲ Fechar' : '▼ Ver histórico'}</span>
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2">
            {historicalMeds.length === 0 && (
              <p className="text-sm text-gray-400">Nenhum medicamento no histórico.</p>
            )}
            {historicalMeds.map((m) => (
              <div key={m.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{m.name}{m.dose ? ` — ${m.dose}` : ''}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Início: {format(new Date(m.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      {m.archivedAt && (
                        <> · Fim: {format(new Date(m.archivedAt), "dd/MM/yyyy", { locale: ptBR })}</>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await doctorApi.unarchiveMedication(patientId, m.id);
                        onUnarchive(m.id);
                      } catch (e: any) {
                        alert(e?.response?.data?.message ?? 'Erro ao reativar medicamento');
                      }
                    }}
                    className="whitespace-nowrap rounded-md border border-indigo-200 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    Reativar
                  </button>
                </div>
              </div>
            ))}
          </div>
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
  const [symptoms, setSymptoms] = useState<SymptomRecord[]>([]);
  const [obsError, setObsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('medications');

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    setSummary(null);
    setMedications([]);
    Promise.all([
      doctorApi.getPatientSummary(patientId),
      doctorApi.listObservations(patientId).catch((e: any) => {
        setObsError(e?.response?.data?.message ?? e?.message ?? 'Erro ao carregar prontuário');
        return { data: [] as ClinicalObservation[] };
      }),
      doctorApi.listPatientMedications(patientId).catch(() => ({ data: [] as MedicationRecord[] })),
      doctorApi.listPatientSymptoms(patientId).catch(() => ({ data: [] as SymptomRecord[] })),
    ]).then(([summaryRes, obsRes, medsRes, sympRes]) => {
      const obs = Array.isArray(obsRes.data) ? obsRes.data : [];
      const meds = Array.isArray(medsRes.data) ? medsRes.data : [];
      const symps = Array.isArray(sympRes.data) ? sympRes.data : [];
      setSummary({ ...summaryRes.data, observations: obs });
      setMedications(meds);
      setSymptoms(symps);
    }).catch(() => {
      setSummary(null);
    }).finally(() => setLoading(false));
  }, [patientId]);

  const handleAddObs = (obs: ClinicalObservation) => {
    setSummary((prev) => prev ? { ...prev, observations: [obs, ...prev.observations] } : prev);
  };

  const handleAddMed = (med: MedicationRecord) => {
    setMedications((prev) => [med, ...prev]);
  };

  const handleArchiveMed = (id: string) => {
    setMedications((prev) => prev.map((m) => m.id === id ? { ...m, archivedAt: new Date().toISOString() } : m));
  };

  const handleUnarchiveMed = (id: string) => {
    setMedications((prev) => prev.map((m) => m.id === id ? { ...m, archivedAt: undefined } : m));
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
            { key: 'sintomas', label: 'Sintomas' },
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
        {tab === 'medications' && (
          <MedicationSection medications={medications} patientId={patientId!} onAdd={handleAddMed} onArchive={handleArchiveMed} />
        )}
        {tab === 'sintomas' && (
          <div className="space-y-3">
            {symptoms.length === 0 && <p className="text-sm text-gray-400">Nenhum sintoma registrado.</p>}
            {symptoms.map((s) => {
              const color = s.severity === 'high' ? 'red' : s.severity === 'medium' ? 'yellow' : 'green';
              const label = s.severity === 'high' ? 'Grave' : s.severity === 'medium' ? 'Moderado' : 'Leve';
              return (
                <div key={s.id} className="flex items-start justify-between rounded-lg border border-gray-100 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.symptom}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{format(new Date(s.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                  <Badge color={color as 'red' | 'yellow' | 'green'}>{label}</Badge>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'prontuario' && (
          <>
            {obsError && <p className="text-xs text-red-500 mb-3">{obsError}</p>}
            <ProntuarioSection
              observations={summary.observations}
              patientId={patientId!}
              onAdd={handleAddObs}
              historicalMeds={medications.filter((m) => m.prescribedBy && !!m.archivedAt)}
              onUnarchive={handleUnarchiveMed}
            />
          </>
        )}
      </Card>
    </div>
  );
}
