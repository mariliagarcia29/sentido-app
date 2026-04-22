import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { recordsApi } from '../../api';
import type { MoodEntry, MedicationRecord, SymptomRecord } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

type Tab = 'moods' | 'symptoms' | 'medications';

const moodEmoji = ['', '😞', '😕', '😐', '🙂', '😊'];

export default function RecordsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('moods');
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomRecord[]>([]);
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Mood form
  const [moodScore, setMoodScore] = useState(3);
  const [moodNote, setMoodNote] = useState('');
  const [moodPrivate, setMoodPrivate] = useState(false);

  // Symptom form
  const [symName, setSymName] = useState('');
  const [symSeverity, setSymSeverity] = useState<'low' | 'medium' | 'high'>('low');
  const [symNote, setSymNote] = useState('');
  const [symPrivate, setSymPrivate] = useState(false);

  // Medication form
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medTaken, setMedTaken] = useState(true);
  const [medScheduledAt, setMedScheduledAt] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    recordsApi.listMoods().then((r) => setMoods(r.data));
    recordsApi.listSymptoms().then((r) => setSymptoms(r.data));
    recordsApi.listMedications().then((r) => setMedications(r.data));
  }, []);

  const saveMood = async () => {
    setSaving(true);
    try {
      const { data } = await recordsApi.createMood(moodScore, moodNote, moodPrivate);
      setMoods((p) => [data, ...p]);
      setMoodNote(''); setMoodScore(3); setMoodPrivate(false); setShowForm(false);
    } finally { setSaving(false); }
  };

  const saveSymptom = async () => {
    setSaving(true);
    try {
      const { data } = await recordsApi.createSymptom({ symptom: symName, severity: symSeverity, isPrivate: symPrivate });
      setSymptoms((p) => [data, ...p]);
      setSymName(''); setSymNote(''); setSymSeverity('low'); setSymPrivate(false); setShowForm(false);
    } finally { setSaving(false); }
  };

  const saveMedication = async () => {
    setSaving(true);
    try {
      const { data } = await recordsApi.createMedication({ name: medName, dose: medDose, taken: medTaken });
      setMedications((p) => [data, ...p]);
      setMedName(''); setMedDose(''); setMedTaken(true); setMedScheduledAt(''); setShowForm(false);
    } finally { setSaving(false); }
  };

  const tabs: Tab[] = ['moods', 'symptoms', 'medications'];

  const severityColor: Record<string, 'green' | 'yellow' | 'red'> = {
    low: 'green', medium: 'yellow', high: 'red',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('records.title')}</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? t('common.cancel') : '+ ' + t(`records.add${tab === 'moods' ? 'Mood' : tab === 'symptoms' ? 'Symptom' : 'Medication'}`)}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t_) => (
          <button
            key={t_}
            onClick={() => { setTab(t_); setShowForm(false); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t_ ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t(`records.${t_}`)}
          </button>
        ))}
      </div>

      {/* Forms */}
      {showForm && (
        <Card>
          {tab === 'moods' && (
            <div className="space-y-4">
              <p className="text-sm font-medium">{t('records.addMood')}</p>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setMoodScore(s)} className={`text-3xl ${moodScore === s ? 'scale-125' : 'opacity-60'} transition-transform`}>
                    {moodEmoji[s]}
                  </button>
                ))}
              </div>
              <Input label={t('records.note')} type="text" value={moodNote} onChange={(e) => setMoodNote(e.target.value)} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={moodPrivate} onChange={(e) => setMoodPrivate(e.target.checked)} />
                {t('records.private')}
              </label>
              <Button onClick={saveMood} loading={saving}>{t('common.save')}</Button>
            </div>
          )}
          {tab === 'symptoms' && (
            <div className="space-y-4">
              <p className="text-sm font-medium">{t('records.addSymptom')}</p>
              <Input label="Nome do sintoma" type="text" value={symName} onChange={(e) => setSymName(e.target.value)} required />
              <div>
                <label className="text-sm font-medium text-gray-700">{t('records.severity')}</label>
                <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={symSeverity} onChange={(e) => setSymSeverity(e.target.value as typeof symSeverity)}>
                  <option value="low">{t('records.severityLow')}</option>
                  <option value="medium">{t('records.severityMedium')}</option>
                  <option value="high">{t('records.severityHigh')}</option>
                </select>
              </div>
              <Input label={t('records.note')} type="text" value={symNote} onChange={(e) => setSymNote(e.target.value)} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={symPrivate} onChange={(e) => setSymPrivate(e.target.checked)} />
                {t('records.private')}
              </label>
              <Button onClick={saveSymptom} loading={saving}>{t('common.save')}</Button>
            </div>
          )}
          {tab === 'medications' && (
            <div className="space-y-4">
              <p className="text-sm font-medium">{t('records.addMedication')}</p>
              <Input label="Medicamento" type="text" value={medName} onChange={(e) => setMedName(e.target.value)} required />
              <Input label={t('records.dose')} type="text" value={medDose} onChange={(e) => setMedDose(e.target.value)} />
              <Input label={t('records.scheduledAt')} type="datetime-local" value={medScheduledAt} onChange={(e) => setMedScheduledAt(e.target.value)} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={medTaken} onChange={(e) => setMedTaken(e.target.checked)} />
                {t('records.taken')}
              </label>
              <Button onClick={saveMedication} loading={saving}>{t('common.save')}</Button>
            </div>
          )}
        </Card>
      )}

      {/* Lists */}
      {tab === 'moods' && (
        <div className="space-y-2">
          {moods.map((m) => (
            <Card key={m.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{moodEmoji[m.score]}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.note || `Humor ${m.score}/5`}</p>
                  <p className="text-xs text-gray-400">{format(new Date(m.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
              </div>
              {m.isPrivate && <Badge color="gray">🔒 Privado</Badge>}
            </Card>
          ))}
          {moods.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{t('common.noData')}</p>}
        </div>
      )}

      {tab === 'symptoms' && (
        <div className="space-y-2">
          {symptoms.map((s) => (
            <Card key={s.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{s.name}</p>
                {s.note && <p className="text-xs text-gray-500">{s.note}</p>}
                <p className="text-xs text-gray-400">{format(new Date(s.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={severityColor[s.severity]}>{t(`records.severity${s.severity.charAt(0).toUpperCase() + s.severity.slice(1)}`)}</Badge>
                {s.isPrivate && <Badge color="gray">🔒</Badge>}
              </div>
            </Card>
          ))}
          {symptoms.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{t('common.noData')}</p>}
        </div>
      )}

      {tab === 'medications' && (
        <div className="space-y-2">
          {medications.map((m) => (
            <Card key={m.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-800">{m.name}{m.dose && ` — ${m.dose}`}</p>
                    {m.prescribedBy && <Badge color="blue">Prescrito pelo médico</Badge>}
                  </div>
                  {m.scheduledAt && <p className="text-xs text-gray-400 mt-0.5">{format(new Date(m.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{format(new Date(m.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!m.taken && (
                    <button
                      onClick={async () => {
                        const { data } = await recordsApi.markMedicationTaken(m.id);
                        setMedications((prev) => prev.map((x) => x.id === m.id ? data : x));
                      }}
                      className="text-xs text-indigo-600 hover:underline font-medium"
                    >
                      Marcar como tomado
                    </button>
                  )}
                  <Badge color={m.taken ? 'green' : 'red'}>{m.taken ? t('records.taken') : t('records.notTaken')}</Badge>
                </div>
              </div>
            </Card>
          ))}
          {medications.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{t('common.noData')}</p>}
        </div>
      )}
    </div>
  );
}
