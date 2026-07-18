import { useEffect, useState } from 'react';
import { carePlanApi } from '../../api';
import type { CarePlan } from '../../types';
import Card from '../../components/ui/Card';

const ACTION_LABEL: Record<string, string> = {
  manter: 'Manter',
  alterar: 'Alterar',
  suspender: 'Suspender',
};

const ACTION_COLOR: Record<string, string> = {
  manter: 'bg-green-100 text-green-700',
  alterar: 'bg-amber-100 text-amber-700',
  suspender: 'bg-red-100 text-red-600',
};

const PSYCHO_STATUS: Record<string, string> = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  encerrado: 'Encerrado',
};

const CATEGORY_ICON: Record<string, string> = {
  sono: '😴',
  atividade: '🏃',
  alimentacao: '🥗',
  social: '🤝',
  mental: '🧠',
  substancias: '⚠️',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{children}</p>
  );
}

export default function MyCarePlanPage() {
  const [plan, setPlan] = useState<CarePlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carePlanApi.getMyPlan()
      .then(r => setPlan(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Carregando plano…</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-lg space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Meu plano de cuidado</h1>
        <Card>
          <p className="text-sm text-gray-400 text-center py-6">
            Nenhum plano definido ainda. Seu médico irá criar um após a próxima consulta.
          </p>
        </Card>
      </div>
    );
  }

  const activeMeds = plan.medications?.filter(m => m.action !== 'suspender') ?? [];
  const suspendedMeds = plan.medications?.filter(m => m.action === 'suspender') ?? [];

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu plano de cuidado</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Atualizado em {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* Retorno */}
      {plan.returnDate && (
        <Card className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Próximo retorno:{' '}
              <strong>{new Date(plan.returnDate + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
            </p>
            {plan.returnModality && (
              <p className="text-xs text-gray-400 capitalize mt-0.5">
                {plan.returnModality}{plan.returnDuration ? ` · ${plan.returnDuration} min` : ''}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Medicações ativas */}
      {activeMeds.length > 0 && (
        <Card className="space-y-3">
          <SectionTitle>Medicações</SectionTitle>
          <div className="space-y-2">
            {activeMeds.map((m, i) => (
              <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.name}</p>
                  {(m.dose || m.schedule) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[m.dose, m.schedule].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ACTION_COLOR[m.action]}`}>
                  {ACTION_LABEL[m.action]}
                </span>
              </div>
            ))}
          </div>
          {suspendedMeds.length > 0 && (
            <div className="pt-1 space-y-1">
              <p className="text-xs text-gray-400">Suspensas:</p>
              {suspendedMeds.map((m, i) => (
                <p key={i} className="text-xs text-gray-400 line-through">{m.name}</p>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Hábitos */}
      {(plan.habits?.length ?? 0) > 0 && (
        <Card className="space-y-3">
          <SectionTitle>Hábitos prescritos</SectionTitle>
          <div className="space-y-2">
            {plan.habits!.map((h, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-base shrink-0 mt-0.5">
                  {h.category ? CATEGORY_ICON[h.category] ?? '✦' : '✦'}
                </span>
                <div>
                  <p className="text-sm text-gray-800">{h.description}</p>
                  <p className="text-xs text-indigo-500 mt-0.5">{h.frequency}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Psicoterapia */}
      {plan.psychotherapy && (
        <Card className="space-y-3">
          <SectionTitle>Psicoterapia</SectionTitle>
          <div className="space-y-1 text-sm">
            {plan.psychotherapy.professional && (
              <p className="text-gray-700">
                <span className="text-gray-400">Profissional: </span>{plan.psychotherapy.professional}
              </p>
            )}
            {plan.psychotherapy.modality && (
              <p className="text-gray-700">
                <span className="text-gray-400">Modalidade: </span>{plan.psychotherapy.modality}
              </p>
            )}
            {plan.psychotherapy.frequency && (
              <p className="text-gray-700">
                <span className="text-gray-400">Frequência: </span>{plan.psychotherapy.frequency}
              </p>
            )}
            {plan.psychotherapy.status && (
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                plan.psychotherapy.status === 'ativo'
                  ? 'bg-green-100 text-green-700'
                  : plan.psychotherapy.status === 'pausado'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {PSYCHO_STATUS[plan.psychotherapy.status]}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Exames */}
      {(plan.exams?.length ?? 0) > 0 && (
        <Card className="space-y-3">
          <SectionTitle>Exames solicitados</SectionTitle>
          <div className="space-y-2">
            {plan.exams!.map((e, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <p className="text-sm text-gray-800">{e.name}</p>
                {e.deadlineDays && (
                  <p className="text-xs text-amber-600 font-medium">em {e.deadlineDays} dias</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Encaminhamentos */}
      {(plan.referrals?.length ?? 0) > 0 && (
        <Card className="space-y-3">
          <SectionTitle>Encaminhamentos</SectionTitle>
          <div className="space-y-2">
            {plan.referrals!.map((r, i) => (
              <div key={i} className="py-1.5 border-b border-gray-50 last:border-0">
                <p className="text-sm font-medium text-gray-800">{r.specialty}</p>
                {r.professional && <p className="text-xs text-gray-500">{r.professional}</p>}
                {r.reason && <p className="text-xs text-gray-400 mt-0.5">{r.reason}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Combinados clínicos */}
      {(plan.clinicalAgreements?.length ?? 0) > 0 && (
        <Card className="space-y-3">
          <SectionTitle>Combinados clínicos</SectionTitle>
          <div className="space-y-2">
            {plan.clinicalAgreements!.map((a, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                <p className="text-sm text-gray-700">{a.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notas do médico */}
      {plan.notes && (
        <Card className="space-y-2">
          <SectionTitle>Observações</SectionTitle>
          <p className="text-sm text-gray-600 leading-relaxed">{plan.notes}</p>
        </Card>
      )}

      <p className="text-xs text-gray-300 text-center pb-4">
        Este plano foi elaborado pelo seu profissional de saúde. Em caso de dúvidas, entre em contato pela aba de mensagens.
      </p>
    </div>
  );
}
