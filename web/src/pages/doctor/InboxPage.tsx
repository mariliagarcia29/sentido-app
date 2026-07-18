import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { chatApi, aiApi } from '../../api';
import type { DoctorInboxItem, ChatMessage, QuickReplies, AiAlert } from '../../types';
import { useAuth } from '../../context/AuthContext';

type ChatMsg = ChatMessage;
type InboxFilter = 'todas' | 'nao_lidas' | 'risco' | 'arquivadas';

const QUICK_REPLY_LABELS: Record<string, string> = {
  agendamento: '📅 Agendamento',
  medicacao:   '💊 Medicação',
  risco:       '🚨 Risco',
  adesao:      '✅ Adesão',
};

const RISK_KEYWORDS = [
  'suicíd', 'suicid', 'me matar', 'não quero viver', 'não quer viver',
  'me machucar', 'autolesão', 'automutilação', 'ideação', 'desaparecer',
  'sem saída', 'não aguento', 'overdose', 'emergência', 'crise',
];

function hasRiskKeyword(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return RISK_KEYWORDS.some(k => lower.includes(k));
}

const ESCALATION_LEVELS = [
  {
    level: 'auto' as const,
    label: 'Auto-orientação',
    color: 'green',
    icon: '💬',
    description: 'Responder com recursos de apoio e validação emocional.',
    actions: ['Usar respostas rápidas da categoria Risco', 'CVV 188 (24h, gratuito)', 'Canal de texto CVV: cvv.org.br'],
  },
  {
    level: 'clinica' as const,
    label: 'Contato com clínica',
    color: 'amber',
    icon: '🏥',
    description: 'Agendar consulta urgente ou acionar equipe de suporte.',
    actions: ['Antecipar próxima consulta', 'Acionar psicóloga/enfermagem de plantão', 'Contato por telefone da clínica'],
  },
  {
    level: 'emergencia' as const,
    label: 'Emergência',
    color: 'red',
    icon: '🚨',
    description: 'Risco imediato — acionar SAMU ou serviço de emergência.',
    actions: ['SAMU 192', 'Bombeiros 193', 'UPA mais próxima', 'Acompanhante ou familiar'],
  },
];

function RiskTriagePanel({
  alerts,
  lastPatientMessage,
  onSelectQuickReply,
}: {
  alerts: AiAlert[];
  lastPatientMessage: ChatMsg | null;
  onSelectQuickReply: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasHighAlert = alerts.some(a => a.severity === 'high' && a.status === 'pending');
  const hasMedAlert = alerts.some(a => a.severity === 'medium' && a.status === 'pending');
  const msgHasRisk = hasRiskKeyword(lastPatientMessage?.content);

  const recommendedLevel =
    hasHighAlert || msgHasRisk ? 'emergencia'
    : hasMedAlert ? 'clinica'
    : null;

  if (!recommendedLevel) return null;

  const levelInfo = ESCALATION_LEVELS.find(l => l.level === recommendedLevel)!;
  const colorMap = {
    green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800', badge: 'bg-green-100 text-green-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700' },
    red:   { bg: 'bg-red-50',   border: 'border-red-300',   text: 'text-red-800',   badge: 'bg-red-100 text-red-700' },
  };
  const colors = colorMap[levelInfo.color as keyof typeof colorMap];

  return (
    <div className={`mx-5 mb-2 rounded-xl border ${colors.border} ${colors.bg} p-3 space-y-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{levelInfo.icon}</span>
          <span className={`text-xs font-bold ${colors.text}`}>Triagem de risco</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
            {levelInfo.label}
          </span>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className={`text-xs ${colors.text} opacity-60 hover:opacity-100`}
        >
          {expanded ? 'Ocultar ▲' : 'Ver condutas ▼'}
        </button>
      </div>
      <p className={`text-xs ${colors.text}`}>{levelInfo.description}</p>
      {expanded && (
        <div className="space-y-2">
          <p className={`text-xs font-semibold ${colors.text} uppercase tracking-wide`}>Condutas sugeridas</p>
          <ul className={`text-xs ${colors.text} space-y-1`}>
            {levelInfo.actions.map(a => <li key={a} className="flex gap-1.5"><span>•</span>{a}</li>)}
          </ul>
          <div className="pt-1 flex gap-2 flex-wrap">
            {ESCALATION_LEVELS.map(l => {
              const c = colorMap[l.color as keyof typeof colorMap];
              return (
                <button
                  key={l.level}
                  onClick={() => l.level === 'auto' && onSelectQuickReply()}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${c.border} ${c.text} ${c.bg} hover:opacity-80 transition-opacity`}
                >
                  {l.icon} {l.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InboxPage() {
  const { user } = useAuth();
  const [inbox, setInbox] = useState<DoctorInboxItem[]>([]);
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<InboxFilter>('todas');
  const [selected, setSelected] = useState<DoctorInboxItem | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReplies>({});
  const [showQR, setShowQR] = useState(false);
  const [activeQRCat, setActiveQRCat] = useState<string>('agendamento');
  const [patientAlerts, setPatientAlerts] = useState<AiAlert[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatApi.inbox()
      .then(r => setInbox(r.data))
      .catch(() => setError('Erro ao carregar caixa de mensagens'))
      .finally(() => setLoadingInbox(false));
    chatApi.quickReplies()
      .then(r => setQuickReplies(r.data))
      .catch(() => {});
  }, []);

  const loadMessages = useCallback(async (item: DoctorInboxItem) => {
    setSelected(item);
    setMessages([]);
    setPatientAlerts([]);
    try {
      const [msgRes] = await Promise.all([
        chatApi.directHistory(item.patientId),
      ]);
      setMessages(msgRes.data);
    } catch {
      setError('Erro ao carregar conversa');
    }
    // Load patient AI alerts (best effort)
    setLoadingAlerts(true);
    aiApi.getAlertsForPatient(item.patientId)
      .then((r: { data: AiAlert[] }) => setPatientAlerts(r.data.filter((a: AiAlert) => a.status === 'pending')))
      .catch(() => {})
      .finally(() => setLoadingAlerts(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!selected || !input.trim()) return;
    setSending(true);
    try {
      const r = await chatApi.sendToPatient(selected.patientId, input.trim());
      setMessages(prev => [...prev, r.data]);
      setInput('');
      setShowQR(false);
      setInbox(prev => prev.map(i =>
        i.patientId === selected.patientId ? { ...i, lastMessage: r.data, unread: 0 } : i
      ));
    } catch {
      setError('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const useQuickReply = (template: string) => {
    setInput(template);
    setShowQR(false);
  };

  const toggleArchive = (patientId: string) =>
    setArchived(prev => {
      const next = new Set(prev);
      next.has(patientId) ? next.delete(patientId) : next.add(patientId);
      return next;
    });

  const isRisky = (item: DoctorInboxItem) =>
    hasRiskKeyword(item.lastMessage?.content);

  const filteredInbox = inbox.filter(item => {
    const isArch = archived.has(item.patientId);
    if (filter === 'arquivadas') return isArch;
    if (isArch) return false;
    if (filter === 'nao_lidas') return item.unread > 0;
    if (filter === 'risco') return isRisky(item);
    return true;
  });

  const unreadCount = inbox.filter(i => i.unread > 0 && !archived.has(i.patientId)).length;
  const riskyCount  = inbox.filter(i => isRisky(i) && !archived.has(i.patientId)).length;

  const formatTime = (dt: string) => new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (dt: string | undefined) => {
    if (!dt) return '';
    const d = new Date(dt);
    if (d.toDateString() === new Date().toDateString()) return formatTime(dt);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const highAlerts = patientAlerts.filter(a => a.severity === 'high');
  const medAlerts  = patientAlerts.filter(a => a.severity === 'medium');
  const lastPatientMsg = [...messages].reverse().find(m => m.senderId !== user?.id) ?? null;

  return (
    <div className="flex h-[calc(100vh-5rem)] rounded-2xl border border-gray-200 overflow-hidden bg-white">
      {/* ── Left: inbox list ── */}
      <div className="w-72 shrink-0 border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <h1 className="text-base font-bold text-gray-900">💬 Mensagens</h1>
          <p className="text-xs text-gray-400">{inbox.length} paciente(s) vinculado(s)</p>
        </div>

        {/* Filters */}
        <div className="px-2 py-2 border-b border-gray-100 flex flex-wrap gap-1">
          {([
            { key: 'todas',      label: 'Todas' },
            { key: 'nao_lidas', label: `Não lidas${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
            { key: 'risco',     label: `Risco${riskyCount > 0 ? ` (${riskyCount})` : ''}` },
            { key: 'arquivadas', label: 'Arquivadas' },
          ] as { key: InboxFilter; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                filter === f.key
                  ? f.key === 'risco'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loadingInbox ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Carregando…</div>
        ) : filteredInbox.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center text-sm text-gray-400">
              <div className="text-3xl mb-2">📭</div>
              <p>{filter === 'arquivadas' ? 'Nenhuma conversa arquivada.' : filter === 'risco' ? 'Sem mensagens de risco.' : 'Nenhum paciente vinculado ainda.'}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {filteredInbox.map(item => (
              <button
                key={item.patientId}
                onClick={() => loadMessages(item)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selected?.patientId === item.patientId ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      isRisky(item) ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {(item.patient?.fullName ?? 'P')[0].toUpperCase()}
                    </div>
                    {item.unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {item.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <span className={`text-sm font-semibold truncate ${item.unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {item.patient?.fullName ?? item.patientId.slice(0, 8)}
                      </span>
                      <span className="text-xs text-gray-400 ml-1 shrink-0">
                        {formatDate(item.lastMessage?.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isRisky(item) && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">risco</span>}
                      <p className={`text-xs truncate ${item.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                        {item.lastMessage?.content ?? 'Sem mensagens ainda'}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: conversation ── */}
      {!selected ? (
        <div className="flex-1 flex items-center justify-center text-center px-8">
          <div>
            <div className="text-5xl mb-3">💬</div>
            <p className="text-gray-500 text-sm">Selecione um paciente para iniciar a conversa.</p>
            <p className="text-xs text-gray-400 mt-1">Canal seguro e assíncrono — não monitorado 24h.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Conversation header with clinical context */}
          <div className="px-5 py-3 border-b border-gray-200 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                  isRisky(selected) ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {(selected.patient?.fullName ?? 'P')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selected.patient?.fullName ?? selected.patientId.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-400">Canal seguro · assíncrono</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/doctor/patients/${selected.patientId}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-lg"
                >
                  Ver prontuário →
                </Link>
                <button
                  onClick={() => toggleArchive(selected.patientId)}
                  title={archived.has(selected.patientId) ? 'Desarquivar' : 'Arquivar'}
                  className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg"
                >
                  {archived.has(selected.patientId) ? '↩ Desarq.' : '📁 Arquivar'}
                </button>
              </div>
            </div>

            {/* Clinical context pills */}
            {!loadingAlerts && (highAlerts.length > 0 || medAlerts.length > 0) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">Alertas ativos:</span>
                {highAlerts.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                    🚨 {highAlerts.length} alto{highAlerts.length > 1 ? 's' : ''}
                  </span>
                )}
                {medAlerts.length > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                    ⚠ {medAlerts.length} médio{medAlerts.length > 1 ? 's' : ''}
                  </span>
                )}
                {highAlerts.slice(0, 2).map(a => (
                  <span key={a.id} className="text-xs text-gray-500 italic truncate max-w-[200px]">
                    {a.title}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">Nenhuma mensagem ainda. Seja o primeiro a iniciar.</p>
            )}
            {messages.map(msg => {
              const isMe = msg.senderId === user?.id;
              const risky = !isMe && hasRiskKeyword(msg.content);
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                    risky
                      ? 'bg-red-50 text-red-900 rounded-bl-sm border border-red-200'
                      : isMe
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    {risky && <p className="text-[10px] font-bold text-red-500 mb-1">⚠ contém sinal de risco</p>}
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : risky ? 'text-red-400' : 'text-gray-400'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Risk triage panel */}
          <RiskTriagePanel
            alerts={patientAlerts}
            lastPatientMessage={lastPatientMsg}
            onSelectQuickReply={() => { setActiveQRCat('risco'); setShowQR(true); }}
          />

          {/* Input + quick replies */}
          <div className="px-5 py-3 border-t border-gray-200 space-y-2 shrink-0">
            {showQR && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(quickReplies).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveQRCat(cat)}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                        activeQRCat === cat
                          ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {QUICK_REPLY_LABELS[cat] ?? cat}
                    </button>
                  ))}
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {(quickReplies[activeQRCat] ?? []).map(qr => (
                    <button
                      key={qr.id}
                      onClick={() => useQuickReply(qr.template)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                    >
                      <span className="font-medium">{qr.label}:</span> {qr.template}
                    </button>
                  ))}
                  {(quickReplies[activeQRCat] ?? []).length === 0 && (
                    <p className="text-xs text-gray-400 italic px-2">Nenhuma resposta rápida nesta categoria.</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowQR(s => !s)}
                className={`p-2.5 rounded-xl border text-sm transition-colors ${
                  showQR ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-gray-300 text-gray-400 hover:bg-gray-50'
                }`}
                title="Respostas rápidas"
              >
                ⚡
              </button>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Mensagem…"
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                {sending ? '…' : '→'}
              </button>
            </div>

            <p className="text-xs text-amber-600">
              ⚠️ Canal assíncrono — não utilize para emergências. Em crise: SAMU 192 · CVV 188
            </p>
          </div>

          {error && (
            <div className="px-5 py-2 bg-red-50 text-red-600 text-xs border-t border-red-100 shrink-0">
              {error} <button onClick={() => setError('')} className="ml-1 underline">fechar</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
