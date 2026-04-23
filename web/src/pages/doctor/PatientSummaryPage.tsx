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

type Tab = 'medications' | 'descontinuados' | 'sintomas' | 'prontuario';

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

function ArchiveConfirmModal({ medName, onConfirm, onCancel }: {
  medName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Arquivar medicamento</h2>
        <p className="text-sm text-gray-600">
          Esse medicamento não estará mais disponível para o seu paciente.
        </p>
        <p className="text-sm font-medium text-gray-800 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
          {medName}
        </p>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
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
  const [confirmMed, setConfirmMed] = useState<MedicationRecord | null>(null);

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

  const doArchive = async () => {
    if (!confirmMed) return;
    try {
      await doctorApi.archiveMedication(patientId, confirmMed.id);
      onArchive(confirmMed.id);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Erro ao arquivar prescrição');
    } finally {
      setConfirmMed(null);
    }
  };

  const current = medications.filter((m) => m.prescribedBy && !m.archivedAt);

  return (
    <>
      {confirmMed && (
        <ArchiveConfirmModal
          medName={`${confirmMed.name}${confirmMed.dose ? ` — ${confirmMed.dose}` : ''}`}
          onConfirm={doArchive}
          onCancel={() => setConfirmMed(null)}
        />
      )}

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
          <div className="space-y-3">
            {current.map((m) => (
              <div key={m.id} className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{m.name}{m.dose ? ` — ${m.dose}` : ''}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={m.taken ? 'green' : 'red'}>{m.taken ? 'Tomado' : 'Não tomado pelo paciente'}</Badge>
                    <span className="text-xs text-gray-400">desde {format(new Date(m.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmMed(m)}
                  className="w-full rounded-full border-2 border-red-400 bg-white py-2 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                >
                  Arquivar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function DiscontinuedSection({
  medications, patientId, onUnarchive,
}: {
  medications: MedicationRecord[];
  patientId: string;
  onUnarchive: (id: string) => void;
}) {
  const discontinued = medications.filter((m) => m.prescribedBy && !!m.archivedAt);

  if (discontinued.length === 0) {
    return <p className="text-sm text-gray-400">Nenhum medicamento descontinuado.</p>;
  }

  return (
    <div className="space-y-3">
      {discontinued.map((m) => (
        <div key={m.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">{m.name}{m.dose ? ` — ${m.dose}` : ''}</p>
              <p className="text-xs text-gray-400 mt-1">
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
              className="whitespace-nowrap rounded-full border border-indigo-300 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Reativar
            </button>
          </div>
        </div>
      ))}
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
  const [obsType, setObsType] = useState<'note' | 'diagnosis'>('note');
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<'info' | 'warn' | 'critical'>('info');
  const [saving, setSaving] = useState(false);

  // Diagnóstico fechado
  const [editingClosed, setEditingClosed] = useState(false);
  const [closedText, setClosedText] = useState('');
  const [savingClosed, setSavingClosed] = useState(false);

  // Notas de consulta
  const [editingSession, setEditingSession] = useState(false);
  const [sessionText, setSessionText] = useState('');
  const [savingSession, setSavingSession] = useState(false);

  const severityColor: Record<string, 'blue' | 'yellow' | 'red'> = {
    info: 'blue', warn: 'yellow', critical: 'red',
  };

  const obs = observations ?? [];
  const closedDiagnosis = obs.find((o) => o.observationType === 'closed_diagnosis');
  const sessionNote = obs.find((o) => o.observationType === 'session_note');
  const diagnoses = obs.filter((o) => o.observationType === 'diagnosis');
  const notes = obs.filter((o) => o.observationType !== 'diagnosis' && o.observationType !== 'closed_diagnosis' && o.observationType !== 'session_note');

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const { data } = await doctorApi.createObservation(patientId, { content, severity, observationType: obsType });
      onAdd(data);
      setContent(''); setSeverity('info'); setObsType('note'); setShowForm(false);
    } finally { setSaving(false); }
  };

  const saveClosedDiagnosis = async () => {
    if (!closedText.trim()) return;
    setSavingClosed(true);
    try {
      const { data } = await doctorApi.createObservation(patientId, {
        content: closedText.trim(),
        severity: 'info',
        observationType: 'closed_diagnosis',
      });
      onAdd(data);
      setClosedText('');
      setEditingClosed(false);
    } finally { setSavingClosed(false); }
  };

  const saveSessionNote = async () => {
    if (!sessionText.trim()) return;
    setSavingSession(true);
    try {
      const { data } = await doctorApi.createObservation(patientId, {
        content: sessionText.trim(),
        severity: 'info',
        observationType: 'session_note',
      });
      onAdd(data);
      setSessionText('');
      setEditingSession(false);
    } finally { setSavingSession(false); }
  };

  return (
    <div className="space-y-5">

      {/* Diagnóstico Fechado */}
      <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Diagnóstico Fechado</h3>
          {!editingClosed && (
            <button
              onClick={() => { setEditingClosed(true); setClosedText(closedDiagnosis?.content ?? ''); }}
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              {closedDiagnosis ? 'Editar' : '+ Adicionar'}
            </button>
          )}
        </div>

        {editingClosed ? (
          <div className="space-y-2">
            <input
              autoFocus
              className="w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Ex: Depressão maior, Transtorno bipolar tipo I..."
              value={closedText}
              onChange={(e) => setClosedText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveClosedDiagnosis(); if (e.key === 'Escape') setEditingClosed(false); }}
            />
            <div className="flex gap-2">
              <button
                onClick={saveClosedDiagnosis}
                disabled={savingClosed}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {savingClosed ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => setEditingClosed(false)}
                className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : closedDiagnosis ? (
          <div>
            <p className="text-base font-semibold text-indigo-900">{closedDiagnosis.content}</p>
            <p className="text-xs text-indigo-400 mt-1">
              Atualizado em {format(new Date(closedDiagnosis.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        ) : (
          <p className="text-sm text-indigo-400 italic">Nenhum diagnóstico fechado registrado.</p>
        )}
      </div>

      {/* Notas de consulta */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Notas da Consulta</h3>
          {!editingSession && (
            <button
              onClick={() => { setEditingSession(true); setSessionText(sessionNote?.content ?? ''); }}
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              {sessionNote ? 'Editar' : '+ Adicionar'}
            </button>
          )}
        </div>

        {editingSession ? (
          <div className="space-y-2">
            <textarea
              autoFocus
              rows={5}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Atualize com as observações desta consulta: queixas, humor, conduta, plano terapêutico..."
              value={sessionText}
              onChange={(e) => setSessionText(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={saveSessionNote}
                disabled={savingSession}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {savingSession ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => setEditingSession(false)}
                className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : sessionNote ? (
          <div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{sessionNote.content}</p>
            <p className="text-xs text-gray-400 mt-2">
              Atualizado em {format(new Date(sessionNote.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Nenhuma nota de consulta registrada.</p>
        )}
      </div>

      {/* Tópicos de atenção e anotações */}
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
                {type === 'note' ? 'Tópico de atenção' : 'Diagnóstico'}
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
              {obsType === 'diagnosis' ? 'Diagnóstico' : 'Tópico de atenção'}
            </label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
              rows={4}
              placeholder={obsType === 'diagnosis' ? 'Descreva o diagnóstico...' : 'Descreva a observação, conduta ou alerta...'}
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
          {diagnoses.map((o) => (
            <div key={o.id} className="rounded-lg border border-purple-100 bg-purple-50 p-3">
              <p className="text-sm text-gray-800 font-medium">{o.content}</p>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(o.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tópicos de atenção</h3>
          {notes.map((o) => (
            <div key={o.id} className="flex gap-3 rounded-lg border border-gray-100 p-3">
              <Badge color={severityColor[o.severity]}>{o.severity === 'info' ? 'Info' : o.severity === 'warn' ? 'Atenção' : 'Crítico'}</Badge>
              <div className="flex-1">
                <p className="text-sm text-gray-700">{o.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(o.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {' · '}{o.triggeredBy === 'doctor' ? 'Médico' : 'Sistema'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {notes.length === 0 && diagnoses.length === 0 && (
        <p className="text-sm text-gray-400">Nenhuma anotação registrada.</p>
      )}
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

  const discontinuedCount = medications.filter((m) => m.prescribedBy && !!m.archivedAt).length;

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
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {([
            { key: 'medications', label: 'Medicamentos' },
            { key: 'descontinuados', label: discontinuedCount > 0 ? `Descontinuados (${discontinuedCount})` : 'Descontinuados' },
            { key: 'sintomas', label: 'Sintomas' },
            { key: 'prontuario', label: 'Prontuário' },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
        {tab === 'descontinuados' && (
          <DiscontinuedSection medications={medications} patientId={patientId!} onUnarchive={handleUnarchiveMed} />
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
            />
          </>
        )}
      </Card>
    </div>
  );
}
