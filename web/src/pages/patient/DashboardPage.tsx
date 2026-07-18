import { useEffect, useState, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { checkinsApi, preferencesApi, scalesApi, carePlanApi } from '../../api';
import type { CheckIn, PendingScale, CarePlan } from '../../types';
import type { UserPreferences } from '../../api';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import CheckInModal, { MOOD_OPTIONS } from '../../components/patient/CheckInModal';

const MOOD_COLOR: Record<number, string> = {
  5: '#6366f1',
  4: '#22c55e',
  3: '#f59e0b',
  2: '#f97316',
  1: '#ef4444',
};

const MOOD_LABEL: Record<number, string> = {
  5: 'Radical',
  4: 'Bem',
  3: 'Mais ou menos',
  2: 'Mal',
  1: 'Horrível',
};

function computeInsights(checkins: CheckIn[]): string[] {
  if (checkins.length === 0) return [];
  const insights: string[] = [];

  const last14 = checkins.filter(c => {
    const diff = (Date.now() - new Date(c.checkinDate).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 14;
  });

  if (last14.length === 0) return [];

  // Contagem de estados
  const counts: Record<number, number> = {};
  last14.forEach(c => { if (c.mood) counts[c.mood] = (counts[c.mood] ?? 0) + 1; });
  const dominant = Object.entries(counts).sort((a, b) => +b[1] - +a[1])[0];
  if (dominant && +dominant[1] >= 3) {
    insights.push(`Você teve ${dominant[1]} dias "${MOOD_LABEL[+dominant[0]]}" nas últimas 2 semanas.`);
  }

  // Correlação sono < 6h com dias difíceis
  const badSleepBadMood = last14.filter(c => c.sleepHours != null && c.sleepHours < 6 && c.mood != null && c.mood <= 2);
  if (badSleepBadMood.length >= 2) {
    insights.push(`Os dias difíceis se concentraram após noites com menos de 6h de sono (${badSleepBadMood.length}×).`);
  }

  // Medicação padrão
  const missed = last14.filter(c => c.medicationTaken === 'no').length;
  if (missed >= 3) {
    insights.push(`Medicação não tomada ${missed} vezes nas últimas 2 semanas — seu médico será notificado.`);
  }

  // Sono médio
  const withSleep = last14.filter(c => c.sleepHours != null);
  if (withSleep.length >= 3) {
    const avg = withSleep.reduce((s, c) => s + c.sleepHours!, 0) / withSleep.length;
    if (avg < 6.5) {
      insights.push(`Média de sono abaixo de 7h (${avg.toFixed(1)}h). Considere priorizar o descanso.`);
    }
  }

  return insights.slice(0, 2);
}

function MoodCalendar({
  checkins,
  viewDate,
  onPrev,
  onNext,
}: {
  checkins: CheckIn[];
  viewDate: Date;
  onPrev: () => void;
  onNext: () => void;
}) {
  const checkinMap: Record<string, CheckIn> = {};
  checkins.forEach(c => { checkinMap[c.checkinDate] = c; });

  const days = eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) });
  const firstWeekday = getDay(days[0]); // 0=Dom
  const blanks = Array.from({ length: firstWeekday });

  const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Contagem de estados no mês
  const counts: Record<number, number> = {};
  days.forEach(d => {
    const key = format(d, 'yyyy-MM-dd');
    const ci = checkinMap[key];
    if (ci?.mood) counts[ci.mood] = (counts[ci.mood] ?? 0) + 1;
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <button
          onClick={onPrev}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-gray-700 capitalize">
          {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
        </p>
        <button
          onClick={onNext}
          disabled={isSameMonth(viewDate, new Date())}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {DOW.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 pb-1">{d}</div>
        ))}
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map(d => {
          const key = format(d, 'yyyy-MM-dd');
          const ci = checkinMap[key];
          const isToday = key === format(new Date(), 'yyyy-MM-dd');
          return (
            <div key={key} className="aspect-square flex items-center justify-center relative">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  isToday ? 'ring-2 ring-indigo-400 ring-offset-1' : ''
                }`}
                style={
                  ci?.mood
                    ? { backgroundColor: MOOD_COLOR[ci.mood], color: 'white' }
                    : { backgroundColor: '#f3f4f6', color: '#9ca3af' }
                }
                title={ci?.mood ? MOOD_LABEL[ci.mood] : 'Sem registro'}
              >
                {format(d, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend + counts */}
      {Object.keys(counts).length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {MOOD_OPTIONS.map(opt => counts[opt.value] ? (
            <span key={opt.value} className="flex items-center gap-1 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: opt.color }} />
              {opt.label}: <strong>{counts[opt.value]}</strong>
            </span>
          ) : null)}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todayCheckin, setTodayCheckin] = useState<CheckIn | null | undefined>(undefined);
  const [monthCheckins, setMonthCheckins] = useState<CheckIn[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [pendingScales, setPendingScales] = useState<PendingScale[]>([]);
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);

  const load = useCallback(async () => {
    const [todayRes, monthRes, prefsRes, scalesRes, planRes] = await Promise.all([
      checkinsApi.today().catch(() => ({ data: null })),
      checkinsApi.list(viewDate.getFullYear(), viewDate.getMonth() + 1).catch(() => ({ data: [] })),
      preferencesApi.get().catch(() => ({ data: null })),
      scalesApi.pending().catch(() => ({ data: [] as PendingScale[] })),
      carePlanApi.getMyPlan().catch(() => ({ data: null })),
    ]);
    setTodayCheckin(todayRes.data);
    setMonthCheckins(monthRes.data);
    setPrefs(prefsRes.data);
    setPendingScales(scalesRes.data);
    setCarePlan(planRes.data);
  }, [viewDate]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: Partial<CheckIn>) => {
    const res = await checkinsApi.upsert(data);
    setTodayCheckin(res.data);
    setMonthCheckins(prev => {
      const today = res.data.checkinDate;
      const filtered = prev.filter(c => c.checkinDate !== today);
      return [res.data, ...filtered];
    });
  };

  const todayMood = todayCheckin?.mood ? MOOD_OPTIONS.find(o => o.value === todayCheckin.mood) : null;
  const insights = computeInsights(monthCheckins);
  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-5 max-w-lg">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Check-in de hoje */}
      <Card>
        {todayCheckin ? (
          /* Já registrado hoje */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Check-in de hoje</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs text-indigo-500 hover:text-indigo-700"
              >
                Editar
              </button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {todayMood && (
                <span
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm font-medium"
                  style={{ backgroundColor: MOOD_COLOR[todayCheckin.mood!] }}
                >
                  {todayMood.label}
                </span>
              )}
              {todayCheckin.anxiety != null && (
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  Ansiedade <strong>{todayCheckin.anxiety}/10</strong>
                </span>
              )}
              {todayCheckin.sleepHours != null && (
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  Sono <strong>{todayCheckin.sleepHours}h</strong>
                </span>
              )}
              {todayCheckin.medicationTaken && todayCheckin.medicationTaken !== 'na' && (
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                  todayCheckin.medicationTaken === 'yes'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  Med. {todayCheckin.medicationTaken === 'yes' ? 'tomada' : todayCheckin.medicationTaken === 'no' ? 'não tomada' : 'pulada'}
                </span>
              )}
              {todayCheckin.medicationReaction && todayCheckin.medicationReaction !== 'none' && (
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                  todayCheckin.medicationReaction === 'grave'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  Reação {todayCheckin.medicationReaction}
                </span>
              )}
              {todayCheckin.physicalActivityMinutes != null && (
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  {todayCheckin.physicalActivityMinutes === 0
                    ? 'Sem ativ. física'
                    : `Ativ. ${todayCheckin.physicalActivityMinutes}min`}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Não registrado ainda */
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Check-in de hoje</p>
              <p className="text-xs text-gray-400 mt-0.5">Como você está hoje? · ~1 min · 4 perguntas obrigatórias + opcionais</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="shrink-0 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Registrar
            </button>
          </div>
        )}
      </Card>

      {/* Calendário mensal */}
      <Card>
        <MoodCalendar
          checkins={monthCheckins}
          viewDate={viewDate}
          onPrev={() => setViewDate(d => subMonths(d, 1))}
          onNext={() => setViewDate(d => addMonths(d, 1))}
        />
      </Card>

      {/* Pré-consulta CTA */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">Formulário pré-consulta</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Preencha antes da sua consulta para ajudar seu profissional a se preparar.
            </p>
          </div>
          <button
            onClick={() => navigate('/pre-consulta')}
            className="shrink-0 border border-violet-200 text-violet-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-50 transition-colors"
          >
            Preencher
          </button>
        </div>
      </Card>

      {/* Consulta em andamento CTA */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">🩺 Consulta em andamento</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Acompanhe seus objetivos e confirme seus dados durante a consulta.
            </p>
          </div>
          <button
            onClick={() => navigate('/consulta-em-andamento')}
            className="shrink-0 border border-indigo-200 text-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors"
          >
            Abrir
          </button>
        </div>
      </Card>

      {/* Escalas pendentes */}
      {pendingScales.length > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {pendingScales.length === 1
                  ? '1 questionário pendente'
                  : `${pendingScales.length} questionários pendentes`}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {pendingScales.map(s => s.name).join(' · ')}
              </p>
            </div>
            <button
              onClick={() => navigate('/scales')}
              className="shrink-0 border border-indigo-200 text-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors"
            >
              Responder
            </button>
          </div>
        </Card>
      )}

      {/* Meu plano de hoje */}
      {carePlan && (carePlan.habits?.length || carePlan.medications?.length || carePlan.returnDate) && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Meu plano de hoje</p>
            <button
              onClick={() => navigate('/meu-plano')}
              className="text-xs text-indigo-500 hover:text-indigo-700"
            >
              Ver completo →
            </button>
          </div>

          {/* Hábitos */}
          {(carePlan.habits?.length ?? 0) > 0 && (
            <div className="space-y-2">
              {carePlan.habits!.map((h, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2.5">
                  <div className="w-4 h-4 rounded border-2 border-indigo-300 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{h.description}</p>
                    <p className="text-xs text-indigo-400 mt-0.5">{h.frequency}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Medicações do plano */}
          {(carePlan.medications?.filter(m => m.action !== 'suspender').length ?? 0) > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Medicações</p>
              {carePlan.medications!.filter(m => m.action !== 'suspender').map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  {m.name}{m.dose ? ` — ${m.dose}` : ''}{m.schedule ? ` · ${m.schedule}` : ''}
                </div>
              ))}
            </div>
          )}

          {/* Retorno */}
          {carePlan.returnDate && (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-base">📅</span>
              Retorno: <strong className="text-gray-700">
                {new Date(carePlan.returnDate + 'T12:00:00').toLocaleDateString('pt-BR')}
              </strong>
              {carePlan.returnModality && (
                <span className="ml-1 text-xs text-gray-400 capitalize">· {carePlan.returnModality}</span>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-xs text-indigo-600">i</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">Insights automáticos</p>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <p key={i} className="text-sm text-gray-600 leading-relaxed pl-7">
                {insight}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state quando não há check-ins */}
      {monthCheckins.length === 0 && todayCheckin === null && (
        <Card className="text-center py-4 space-y-2">
          <p className="text-sm text-gray-400">
            Nenhum check-in registrado ainda. Comece agora!
          </p>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <CheckInModal
          showMedication={prefs?.checkinShowMedication !== false}
          onSave={async (data) => { await handleSave(data); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
