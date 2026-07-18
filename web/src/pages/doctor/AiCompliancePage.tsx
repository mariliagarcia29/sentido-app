import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { aiApi } from '../../api';
import type {
  AiComplianceProviderStatus, AiComplianceRecord,
  AiProviderKey, AiComplianceStatus,
} from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

// ── Status → badge color mapping ────────────────────────────────────────────

const STATUS_COLOR: Record<AiComplianceStatus, 'green' | 'yellow' | 'red' | 'gray'> = {
  active: 'green',
  pending_signature: 'yellow',
  pending_review: 'yellow',
  expired: 'red',
  not_applicable: 'gray',
};

const STATUS_LABEL: Record<AiComplianceStatus, string> = {
  active: 'Ativo',
  pending_signature: 'Pendente de assinatura',
  pending_review: 'Pendente de revisão',
  expired: 'Expirado',
  not_applicable: 'Não aplicável',
};

const PROVIDER_ICON: Record<AiProviderKey, string> = {
  anthropic: '🧠',
  openevidence: '🔬',
  local: '🏠',
};

// ── Guarantee badge ──────────────────────────────────────────────────────────

function GuaranteeBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${ok ? 'text-green-700' : 'text-red-600'}`}>
      <span>{ok ? '✅' : '❌'}</span>
      <span>{label}</span>
    </div>
  );
}

// ── Review modal ─────────────────────────────────────────────────────────────

function ReviewModal({
  provider,
  current,
  onClose,
  onSaved,
}: {
  provider: AiComplianceProviderStatus;
  current: AiComplianceRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<AiComplianceStatus>(current?.status ?? provider.status);
  const [noRetention, setNoRetention] = useState(current?.noRetentionClause ?? provider.noRetentionClause);
  const [noTraining, setNoTraining] = useState(current?.noTrainingClause ?? provider.noTrainingClause);
  const [lgpd, setLgpd] = useState(current?.lgpdCompatible ?? provider.lgpdCompatible);
  const [termsVersion, setTermsVersion] = useState(current?.termsVersion ?? '');
  const [termsUrl, setTermsUrl] = useState(current?.termsUrl ?? provider.termsUrl ?? '');
  const [expiresAt, setExpiresAt] = useState(current?.expiresAt ?? '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await aiApi.recordComplianceReview({
        provider: provider.provider,
        status,
        noRetentionClause: noRetention,
        noTrainingClause: noTraining,
        lgpdCompatible: lgpd,
        termsVersion: termsVersion || undefined,
        termsUrl: termsUrl || undefined,
        expiresAt: expiresAt || undefined,
        notes: notes || undefined,
      });
      setSaved(true);
      setTimeout(() => { onSaved(); onClose(); }, 1200);
    } finally {
      setSaving(false);
    }
  };

  const STATUS_OPTIONS: AiComplianceStatus[] = [
    'active', 'pending_signature', 'pending_review', 'expired', 'not_applicable',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div>
          <h3 className="font-semibold text-gray-900">Registrar revisão de conformidade</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {PROVIDER_ICON[provider.provider]} {provider.displayName}
          </p>
        </div>

        {saved && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            Revisão registrada com sucesso.
          </div>
        )}

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Status contratual</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as AiComplianceStatus)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        {/* Garantias */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Garantias verificadas nesta revisão</label>
          {[
            { label: 'Cláusula de não-retenção de dados de saúde', value: noRetention, set: setNoRetention },
            { label: 'Cláusula de não-treinamento com dados de pacientes', value: noTraining, set: setNoTraining },
            { label: 'Compatibilidade com LGPD (Lei 13.709/2018)', value: lgpd, set: setLgpd },
          ].map(({ label, value, set }) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={e => set(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        {/* Referência */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Versão dos termos</label>
            <input
              type="text"
              value={termsVersion}
              onChange={e => setTermsVersion(e.target.value)}
              placeholder="ex.: 2024-03"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Expira em</label>
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">URL do contrato / DPA (opcional)</label>
          <input
            type="url"
            value={termsUrl}
            onChange={e => setTermsUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Observações da revisão</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="O que foi verificado, quem foi consultado, mudanças nos termos…"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || saved}
            className="bg-indigo-600 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Registrar revisão'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Provider card ────────────────────────────────────────────────────────────

function ProviderCard({
  provider,
  onReview,
}: {
  provider: AiComplianceProviderStatus;
  onReview: () => void;
}) {
  const hasPending = provider.pendingActions.length > 0;

  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{PROVIDER_ICON[provider.provider]}</span>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{provider.displayName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{provider.description}</p>
          </div>
        </div>
        <Badge color={STATUS_COLOR[provider.status]}>
          {STATUS_LABEL[provider.status]}
        </Badge>
      </div>

      {/* Garantias */}
      <div className="grid grid-cols-3 gap-3 py-3 border-t border-gray-100">
        <GuaranteeBadge ok={provider.noRetentionClause} label="Não-retenção" />
        <GuaranteeBadge ok={provider.noTrainingClause} label="Não-treinamento" />
        <GuaranteeBadge ok={provider.lgpdCompatible} label="LGPD" />
      </div>

      {/* Última revisão */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {provider.lastReviewedAt
            ? `Revisado em ${format(parseISO(provider.lastReviewedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
            : 'Nunca revisado formalmente'}
        </span>
        {provider.termsUrl && (
          <a
            href={provider.termsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline font-medium"
          >
            Ver termos →
          </a>
        )}
      </div>

      {/* Ações pendentes */}
      {hasPending && (
        <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-amber-700">Ações pendentes</p>
          {provider.pendingActions.map((action, i) => (
            <p key={i} className="text-xs text-amber-700 flex gap-2">
              <span className="shrink-0">•</span>
              <span>{action}</span>
            </p>
          ))}
        </div>
      )}

      {/* Botão de revisão */}
      {provider.provider !== 'local' && (
        <button
          onClick={onReview}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          + Registrar revisão formal
        </button>
      )}
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AiCompliancePage() {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<AiComplianceProviderStatus[]>([]);
  const [history, setHistory] = useState<AiComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<AiComplianceProviderStatus | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, hRes] = await Promise.all([
        aiApi.getComplianceStatus(),
        aiApi.getComplianceHistory(),
      ]);
      setProviders(pRes.data);
      setHistory(hRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const compliantCount = providers.filter(p =>
    p.noRetentionClause && p.noTrainingClause && p.lgpdCompatible,
  ).length;

  const pendingCount = providers.filter(p => p.pendingActions.length > 0).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('aiCompliance.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('aiCompliance.subtitle')}</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Provedores', value: providers.length, color: 'bg-gray-50' },
          { label: 'Totalmente conformes', value: compliantCount, color: compliantCount === providers.length ? 'bg-green-50' : 'bg-amber-50' },
          { label: 'Com pendências', value: pendingCount, color: pendingCount > 0 ? 'bg-amber-50' : 'bg-gray-50' },
          { label: 'Revisões registradas', value: history.length, color: 'bg-indigo-50' },
        ].map(m => (
          <div key={m.label} className={`rounded-xl p-4 ${m.color} border border-gray-100`}>
            <p className="text-2xl font-bold text-gray-900">{m.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Base legal */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-800">
        <span className="font-semibold">Base legal: </span>
        {t('aiCompliance.legalNote')}
      </div>

      {/* Provider cards */}
      {loading ? (
        <p className="text-sm text-gray-400">Carregando…</p>
      ) : (
        <div className="space-y-4">
          {providers.map(p => (
            <ProviderCard
              key={p.provider}
              provider={p}
              onReview={() => setReviewTarget(p)}
            />
          ))}
        </div>
      )}

      {/* Histórico de revisões */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">{t('aiCompliance.reviewHistory')}</h2>
          <Card className="divide-y divide-gray-100 p-0 overflow-hidden">
            {history.map(r => (
              <div key={r.id} className="flex items-start gap-4 px-5 py-3 hover:bg-gray-50/50">
                <span className="text-lg shrink-0 mt-0.5">{PROVIDER_ICON[r.provider]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-900">{r.provider}</span>
                    <Badge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    <div className="flex gap-2">
                      {r.noRetentionClause && <span className="text-[10px] text-green-600 bg-green-50 rounded px-1.5 py-0.5">não-retenção ✓</span>}
                      {r.noTrainingClause && <span className="text-[10px] text-green-600 bg-green-50 rounded px-1.5 py-0.5">não-treinamento ✓</span>}
                      {r.lgpdCompatible && <span className="text-[10px] text-green-600 bg-green-50 rounded px-1.5 py-0.5">LGPD ✓</span>}
                    </div>
                  </div>
                  {r.notes && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">"{r.notes}"</p>}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {format(parseISO(r.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {r.termsVersion && ` · v${r.termsVersion}`}
                    {r.expiresAt && ` · expira ${format(parseISO(r.expiresAt), 'dd/MM/yyyy')}`}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Nota de imutabilidade */}
      <p className="text-xs text-gray-400 text-center">
        Registros de revisão são imutáveis. Cada revisão cria um novo registro preservando o histórico completo.
        Conforme LGPD Art. 37 e CFM Resolução 1.821/2007.
      </p>

      {reviewTarget && (
        <ReviewModal
          provider={reviewTarget}
          current={history.find(r => r.provider === reviewTarget.provider) ?? null}
          onClose={() => setReviewTarget(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
