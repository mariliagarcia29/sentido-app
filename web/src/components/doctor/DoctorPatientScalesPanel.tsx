import { useEffect, useState, useCallback } from 'react';
import { scalesApi } from '../../api';
import type { ScaleDefinition, ScaleResponse, PatientScaleConfig } from '../../types';

const DEFAULT_FREQUENCY: Record<string, number> = {
  PHQ9: 30, GAD7: 30, ISI: 14, AUDIT: 180, EPDS: 7, U9: 90,
};

const TRIGGER_OPTIONS = [
  { value: 'scheduled', label: 'Programada (padrão)' },
  { value: 'clinical', label: 'Gatilho clínico (ex.: sono < 5h × 3)' },
  { value: 'diagnosis', label: 'Diagnóstico ativo no perfil' },
];

function ScoreBar({ score, max, higherIsBetter }: { score: number; max: number; higherIsBetter: boolean }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  const color = higherIsBetter
    ? pct >= 70 ? 'bg-green-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'
    : pct <= 30 ? 'bg-green-400' : pct <= 60 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 shrink-0">{score}<span className="font-normal text-gray-400">/{max}</span></span>
    </div>
  );
}

interface ScaleRow {
  def: ScaleDefinition;
  config: PatientScaleConfig | null;
  responses: ScaleResponse[];
}

export default function DoctorPatientScalesPanel({ patientId }: { patientId: string }) {
  const [rows, setRows] = useState<ScaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [localConfigs, setLocalConfigs] = useState<Record<string, {
    isActive: boolean; frequencyDays: number; triggerType: string;
  }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [defsRes, configsRes, responsesRes] = await Promise.all([
      scalesApi.definitions().catch(() => ({ data: [] as ScaleDefinition[] })),
      scalesApi.getPatientConfigs(patientId).catch(() => ({ data: [] as PatientScaleConfig[] })),
      scalesApi.getPatientResponses(patientId).catch(() => ({ data: [] as ScaleResponse[] })),
    ]);

    const defs = defsRes.data;
    const configs = configsRes.data;
    const responses = responsesRes.data;

    const built: ScaleRow[] = defs.map(def => ({
      def,
      config: configs.find(c => c.scaleType === def.type) ?? null,
      responses: responses.filter(r => r.scaleType === def.type).slice(0, 5),
    }));
    setRows(built);

    // Init local configs from server state
    const local: typeof localConfigs = {};
    defs.forEach(def => {
      const cfg = configs.find(c => c.scaleType === def.type);
      local[def.type] = {
        isActive: cfg ? cfg.isActive : true,
        frequencyDays: cfg?.frequencyDays ?? DEFAULT_FREQUENCY[def.type] ?? 30,
        triggerType: cfg?.triggerType ?? 'scheduled',
      };
    });
    setLocalConfigs(local);
    setLoading(false);
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (scaleType: string) => {
    const cfg = localConfigs[scaleType];
    if (!cfg) return;
    setSaving(scaleType);
    try {
      await scalesApi.configureScale(patientId, {
        scaleType,
        isActive: cfg.isActive,
        frequencyDays: cfg.frequencyDays,
        triggerType: cfg.triggerType,
      } as any);
    } finally {
      setSaving(null);
    }
  };

  const updateLocal = (scaleType: string, patch: Partial<typeof localConfigs[string]>) => {
    setLocalConfigs(prev => ({
      ...prev,
      [scaleType]: { ...prev[scaleType], ...patch },
    }));
  };

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando escalas…</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Configuração de escalas por paciente</p>
        <p className="text-xs text-gray-400">
          Defina quais escalas este paciente deve preencher, com que frequência e qual gatilho dispara antecipadamente.
          O paciente verá as escalas ativas como "pendentes" no seu app.
        </p>
      </div>

      {rows.map(({ def, responses }) => {
        const cfg = localConfigs[def.type];
        if (!cfg) return null;
        const lastResponse = responses[0];

        return (
          <div
            key={def.type}
            className={`rounded-xl border p-4 space-y-3 transition-colors ${
              cfg.isActive ? 'border-indigo-100 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
            }`}
          >
            {/* Scale header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{def.name}</span>
                  <span className="text-xs text-gray-400">{def.fullName}</span>
                  {lastResponse && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      lastResponse.hasCriticalAnswer ? 'bg-red-100 text-red-700' : 'bg-green-50 text-green-700'
                    }`}>
                      {lastResponse.hasCriticalAnswer ? '⚠ crítico' : '✓ ok'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{def.description}</p>
              </div>
              {/* Toggle */}
              <button
                onClick={() => updateLocal(def.type, { isActive: !cfg.isActive })}
                className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  cfg.isActive ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  cfg.isActive ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {cfg.isActive && (
              <>
                {/* Config row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Frequência</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={cfg.frequencyDays}
                      onChange={e => updateLocal(def.type, { frequencyDays: +e.target.value })}
                      className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <span className="text-xs text-gray-400">dias</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Gatilho</label>
                    <select
                      value={cfg.triggerType}
                      onChange={e => updateLocal(def.type, { triggerType: e.target.value })}
                      className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    >
                      {TRIGGER_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleSave(def.type)}
                    disabled={saving === def.type}
                    className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {saving === def.type ? '…' : 'Salvar'}
                  </button>
                </div>

                {/* Response history */}
                {responses.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400 font-medium">Histórico recente</p>
                    {responses.map((r, i) => (
                      <div key={i} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${r.hasCriticalAnswer ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                            {r.interpretation}
                            {r.hasCriticalAnswer && ' · resposta crítica'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(r.respondedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <ScoreBar score={r.totalScore} max={def.maxScore} higherIsBetter={def.higherIsBetter} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 italic">Nenhuma resposta ainda para esta escala.</p>
                )}
              </>
            )}

            {!cfg.isActive && (
              <p className="text-xs text-gray-400 italic">Escala desativada — o paciente não verá este questionário.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
