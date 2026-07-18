import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { clinicalNotesApi, doctorProfileApi, preConsultationApi } from '../../api';
import type { OeAlert } from '../../types';
import type { ClinicalNote, MseTag, MseCategory, PatientPreForm } from '../../types';
import CarePlanTab from '../../components/doctor/CarePlanTab';
import MindLayersTab from '../../components/doctor/MindLayersTab';

// ── MSE vocabulary ─────────────────────────────────────────────────────────────

const MSE_OPTIONS: Record<MseCategory, string[]> = {
  afeto:        ['triste', 'ansioso', 'eutímico', 'irritado', 'embotado', 'expansivo', 'lábil'],
  discurso:     ['fluente', 'monossilábico', 'logorreico', 'empobrecido', 'prolixo', 'tangencial'],
  comportamento:['inquieto', 'calmo', 'choroso', 'evasivo', 'cooperativo', 'agitado', 'retraído'],
  cognicao:     ['orientado', 'concentrado', 'memória ok', 'pensamento lento', 'desorientado', 'deficit atenção'],
  risco:        ['sem ideação suicida', 'ideação passiva', 'ideação ativa sem plano', 'ideação com plano', 'autolesão', 'sem risco identificado'],
};

const MSE_LABELS: Record<MseCategory, string> = {
  afeto: 'Afeto',
  discurso: 'Discurso',
  comportamento: 'Comportamento',
  cognicao: 'Cognição',
  risco: 'Risco (MSE)',
};

// ── Coverage score color ───────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return '#3BB273';
  if (score >= 50) return '#F9C74F';
  return '#E63946';
}

const SIGNATURE_METHODS = [
  { id: 'gov_br_prata', label: 'gov.br · Selo Prata', icon: '🏛️', desc: 'Mínimo exigido · Autenticação via conta gov.br Prata ou Ouro' },
  { id: 'icp_brasil_a3', label: 'ICP-Brasil A3', icon: '🔑', desc: 'Certificado em token USB ou smartcard' },
  { id: 'cloud_cert', label: 'Certificado em nuvem', icon: '☁️', desc: 'Certificado digital hospedado em nuvem' },
] as const;

// ── Component ──────────────────────────────────────────────────────────────────

export default function SoapEditorPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId') ?? undefined;

  const [note, setNote] = useState<ClinicalNote | null>(null);
  const [activeTab, setActiveTab] = useState<'S' | 'O' | 'A' | 'P' | 'MSE' | 'PLANO' | 'MIND'>('S');
  const [soap, setSoap] = useState({ S: '', O: '', A: '', P: '' });
  const [mseTags, setMseTags] = useState<MseTag[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState('');

  // Signature modal
  const [showSignModal, setShowSignModal] = useState(false);
  const [signMethod, setSignMethod] = useState<string>('gov_br_prata');
  const [crmNumber, setCrmNumber] = useState('');
  const [crmState, setCrmState] = useState('');
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState('');

  // Devolutiva
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [feedbackReleased, setFeedbackReleased] = useState(false);
  const [releasingFeedback, setReleasingFeedback] = useState(false);
  const [preForm, setPreForm] = useState<PatientPreForm | null>(null);
  const [showPreFormContext, setShowPreFormContext] = useState(false);

  // AI next-question suggestion
  const [suggestion, setSuggestion] = useState<{ question: string; rationale: string; category: string } | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  // Decision support
  const [decisionAlerts, setDecisionAlerts] = useState<OeAlert[]>([]);
  const [loadingDecision, setLoadingDecision] = useState(false);
  const [showDecisionPanel, setShowDecisionPanel] = useState(false);

  // Coverage category hints (frontend-computed from vocabulary)
  const [vocabularyCategories, setVocabularyCategories] = useState<Array<{
    key: string; label: string; weight: number; soapSection: string; keywords: string[]; minChars: number;
  }>>([]);

  // Auto-save timer
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load vocabulary coverage categories
  useEffect(() => {
    clinicalNotesApi.vocabulary()
      .then(res => setVocabularyCategories(res.data.coverageCategories ?? []))
      .catch(() => {});
  }, []);

  // Pre-fill CRM from doctor profile
  useEffect(() => {
    doctorProfileApi.getMyProfile()
      .then(res => {
        if (res.data.profile) {
          setCrmNumber(res.data.profile.crmNumber ?? '');
          setCrmState(res.data.profile.crmState ?? '');
          setSignMethod(res.data.profile.preferredSignatureMethod ?? 'gov_br_prata');
        }
      })
      .catch(() => {});
  }, []);

  // Load existing draft
  useEffect(() => {
    if (!patientId) return;
    clinicalNotesApi.getDraft(patientId)
      .then(res => {
        if (res.data) {
          const n = res.data;
          setNote(n);
          setSoap({ S: n.subjective, O: n.objective, A: n.assessment, P: n.plan });
          setMseTags(n.mseTags ?? []);
          setFeedback(n.patientFeedback ?? '');
        }
      })
      .catch(() => {});
  }, [patientId]);

  // Auto-save every 8 seconds when content changes
  const scheduleAutoSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(), 8000);
  }, []);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const doSave = async () => {
    if (!patientId) return;
    setSaving(true);
    try {
      const res = await clinicalNotesApi.upsert({
        patientId,
        appointmentId,
        subjective: soap.S,
        objective: soap.O,
        assessment: soap.A,
        plan: soap.P,
        mseTags,
      });
      setNote(res.data);
      setLastSaved(new Date());
    } catch {
      setError('Erro ao salvar. Tentando novamente…');
    } finally {
      setSaving(false);
    }
  };

  const handleSoapChange = (tab: 'S' | 'O' | 'A' | 'P', val: string) => {
    setSoap(prev => ({ ...prev, [tab]: val }));
    scheduleAutoSave();
  };

  const toggleMseTag = (category: MseCategory, value: string) => {
    setMseTags(prev => {
      const exists = prev.find(t => t.category === category && t.value === value);
      return exists
        ? prev.filter(t => !(t.category === category && t.value === value))
        : [...prev, { category, value }];
    });
    scheduleAutoSave();
  };

  const isMseSelected = (category: MseCategory, value: string) =>
    mseTags.some(t => t.category === category && t.value === value);

  // ── Coverage per-category status ─────────────────────────────────────────

  const categoryStatus = vocabularyCategories.map(cat => {
    const sectionText = cat.soapSection === 'MSE'
      ? ''
      : (soap[cat.soapSection as 'S' | 'O' | 'A' | 'P'] ?? '').toLowerCase();
    const covered = cat.soapSection === 'MSE'
      ? mseTags.length >= 2
      : cat.keywords.some(k => sectionText.includes(k.toLowerCase()));
    return { ...cat, covered };
  });

  // ── AI next-question ──────────────────────────────────────────────────────

  const handleSuggestQuestion = async () => {
    if (!note?.id) { await doSave(); return; }
    setLoadingSuggestion(true);
    setSuggestionDismissed(false);
    try {
      const res = await clinicalNotesApi.suggestQuestion(note.id, (activeTab === 'MSE' || activeTab === 'PLANO' || activeTab === 'MIND') ? 'O' : activeTab);
      setSuggestion(res.data);
    } catch {
      setSuggestion(null);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  // ── Decision support ──────────────────────────────────────────────────────

  const handleDecisionSupport = async () => {
    if (!note?.id) { await doSave(); return; }
    setLoadingDecision(true);
    setShowDecisionPanel(true);
    try {
      const res = await clinicalNotesApi.decisionSupport(note.id);
      setDecisionAlerts(res.data.alerts);
    } catch {
      setDecisionAlerts([]);
    } finally {
      setLoadingDecision(false);
    }
  };

  // ── Signature flow ────────────────────────────────────────────────────────

  const handleFinalize = async () => {
    if (!note) return;
    setSigning(true);
    setSignError('');
    try {
      const res = await clinicalNotesApi.finalize(note.id, {
        signatureMethod: signMethod,
        crmNumber,
        crmState,
      });
      setNote(res.data);
      setShowSignModal(false);
    } catch (e: any) {
      setSignError(e?.response?.data?.message ?? 'Erro ao finalizar. Verifique os dados e tente novamente.');
    } finally {
      setSigning(false);
    }
  };

  // ── Devolutiva ────────────────────────────────────────────────────────────

  const handleGenerateFeedback = async () => {
    if (!note) { await doSave(); }
    const noteId = note?.id;
    if (!noteId) return;
    setGeneratingFeedback(true);
    try {
      const res = await clinicalNotesApi.generateFeedback(noteId);
      setFeedback(res.data.feedback);
    } catch {
      setError('Erro ao gerar devolutiva. Tente novamente.');
    } finally {
      setGeneratingFeedback(false);
    }
  };

  const handleReleaseFeedback = async (release: boolean) => {
    if (!note) return;
    setReleasingFeedback(true);
    try {
      await clinicalNotesApi.releaseFeedback(note.id, { release, editedFeedback: feedback });
      if (release) {
        setFeedbackReleased(true);
      } else {
        setFeedbackSaved(true);
        setTimeout(() => setFeedbackSaved(false), 3000);
      }
    } catch {
      setError('Erro ao liberar devolutiva.');
    } finally {
      setReleasingFeedback(false);
    }
  };

  const openFeedbackPanel = () => {
    setShowFeedbackPanel(true);
    setFeedbackReleased(false);
    if (patientId && !preForm) {
      preConsultationApi.getPatientPreForm(patientId)
        .then((r: { data: any }) => setPreForm(r.data))
        .catch(() => {});
    }
  };

  const score = note?.coverageScore ?? 0;
  const isFinalized = note?.status === 'finalized';

  const SOAP_LABELS = {
    S: { label: 'S — Subjetivo', placeholder: 'Queixa principal do paciente, história atual, como a pessoa chegou hoje, o que relata sobre seus sintomas…' },
    O: { label: 'O — Objetivo', placeholder: 'Dados observáveis: estado geral, MSE resumido, sinais vitais, resultados de exames, escalas pontuadas…' },
    A: { label: 'A — Avaliação', placeholder: 'Impressão diagnóstica, hipóteses, análise da evolução do quadro, correlações clínicas…' },
    P: { label: 'P — Plano', placeholder: 'Conduta: medicações (MANTER/ALTERAR/SUSPENDER), psicoterapia, exames solicitados, retorno, combinados…' },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nota clínica</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {isFinalized
              ? `✅ Assinada em ${new Date(note!.finalizedAt!).toLocaleString('pt-BR')} · ${note!.signature?.crmNumber} ${note!.signature?.crmState}`
              : lastSaved
              ? `Salvo às ${lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Rascunho — salvo automaticamente a cada 8s'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/doctor/patients/${patientId}/timeline`}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
            title="Linha do tempo clínica"
          >
            📅 Linha do tempo
          </Link>
          {!isFinalized && note?.id && (
            <button
              onClick={handleDecisionSupport}
              disabled={loadingDecision}
              className="text-sm px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
              title="Suporte à decisão clínica"
            >
              {loadingDecision ? '⏳' : '🔬'} Suporte
            </button>
          )}
          {!isFinalized && (
            <>
              <button
                onClick={doSave}
                disabled={saving}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                onClick={() => setShowSignModal(true)}
                className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                ✍️ Assinar e finalizar
              </button>
            </>
          )}
          {isFinalized && (
            <button
              onClick={openFeedbackPanel}
              className="text-sm px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              💌 Devolutiva ao paciente
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* Coverage score bar */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Score de cobertura clínica</span>
          <span className="text-sm font-bold" style={{ color: scoreColor(score) }}>{score}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${score}%`, background: scoreColor(score) }}
          />
        </div>
        {categoryStatus.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
            {categoryStatus.map(cat => (
              <div
                key={cat.key}
                className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 ${
                  cat.covered
                    ? 'text-green-700 bg-green-50'
                    : cat.weight >= 8
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-gray-400'
                }`}
              >
                <span className="shrink-0">{cat.covered ? '✓' : cat.weight >= 8 ? '⚠' : '○'}</span>
                <span className="truncate flex-1">{cat.label}</span>
                <span className="shrink-0 opacity-50 font-mono">{cat.soapSection}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 mt-2">
            {(['S', 'O', 'A', 'P'] as const).map(t => {
              const txt = soap[t] ?? '';
              const ok = txt.length >= (t === 'S' ? 30 : t === 'P' ? 30 : 20);
              return (
                <span key={t} className={`text-xs font-medium ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                  {ok ? '✓' : '○'} {t}
                </span>
              );
            })}
            {mseTags.length >= 2 && <span className="text-xs font-medium text-indigo-600">✓ MSE</span>}
          </div>
        )}
      </div>

      {/* SOAP tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {(['S', 'O', 'A', 'P', 'MSE', 'PLANO', 'MIND'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-indigo-700 bg-indigo-50 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab === 'MSE' ? '🧠 MSE' : tab === 'PLANO' ? '📋 Plano' : tab === 'MIND' ? '🧩 Mind' : tab}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'MIND' ? (
            patientId
              ? <MindLayersTab
                  soap={soap}
                  patientId={patientId}
                  onAppendNote={(section, text) => {
                    const prev = soap[section];
                    handleSoapChange(section, prev ? `${prev}\n\n${text}` : text);
                    setActiveTab(section);
                  }}
                />
              : <p className="text-sm text-gray-400">patientId não disponível.</p>
          ) : activeTab === 'PLANO' ? (
            <div>
              <p className="text-xs text-gray-400 mb-4">
                Plano terapêutico estruturado — independente da nota clínica.
                Medicações, psicoterapia, hábitos, exames, encaminhamentos e data de retorno.
              </p>
              {patientId && <CarePlanTab patientId={patientId} />}
            </div>
          ) : activeTab !== 'MSE' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500">{SOAP_LABELS[activeTab as 'S'|'O'|'A'|'P'].label}</p>
                {!isFinalized && (
                  aiEnabled ? (
                    <button
                      onClick={handleSuggestQuestion}
                      disabled={loadingSuggestion}
                      className="text-xs text-violet-600 hover:text-violet-800 disabled:opacity-50 flex items-center gap-1"
                      title="IA sugere próxima pergunta"
                    >
                      {loadingSuggestion ? '⏳' : '✨'} Sugerir pergunta
                    </button>
                  ) : (
                    <button
                      onClick={() => setAiEnabled(true)}
                      className="text-xs text-gray-400 hover:text-violet-600"
                      title="Reativar sugestões de IA"
                    >
                      Reativar IA
                    </button>
                  )
                )}
              </div>
              {/* AI suggestion banner */}
              {suggestion && !suggestionDismissed && !isFinalized && aiEnabled && (
                <div className="mb-3 rounded-lg bg-violet-50 border border-violet-200 px-3 py-2 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-violet-700">✨ Sugestão IA ({suggestion.category})</span>
                      <p className="text-sm text-violet-800 mt-0.5 italic">"{suggestion.question}"</p>
                      {suggestion.rationale && (
                        <p className="text-xs text-violet-500 mt-0.5">{suggestion.rationale}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSuggestionDismissed(true)}
                      className="text-violet-400 hover:text-violet-600 text-lg leading-none flex-shrink-0"
                    >×</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const soapTab = activeTab as 'S' | 'O' | 'A' | 'P';
                        const prev = soap[soapTab];
                        handleSoapChange(soapTab, (prev ? prev + '\n\n' : '') + `• ${suggestion.question}`);
                        setSuggestionDismissed(true);
                      }}
                      className="text-xs px-3 py-1 rounded-full bg-violet-600 text-white hover:bg-violet-700"
                    >
                      Usar
                    </button>
                    <button
                      onClick={handleSuggestQuestion}
                      disabled={loadingSuggestion}
                      className="text-xs px-3 py-1 rounded-full border border-violet-300 text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                    >
                      {loadingSuggestion ? '⏳' : 'Outra'}
                    </button>
                    <button
                      onClick={() => { setSuggestionDismissed(true); setAiEnabled(false); }}
                      className="text-xs text-violet-400 hover:text-violet-600 ml-auto"
                    >
                      Desativar IA
                    </button>
                  </div>
                </div>
              )}
              <textarea
                value={soap[activeTab as 'S'|'O'|'A'|'P']}
                onChange={e => handleSoapChange(activeTab as 'S'|'O'|'A'|'P', e.target.value)}
                disabled={isFinalized}
                placeholder={SOAP_LABELS[activeTab as 'S'|'O'|'A'|'P'].placeholder}
                rows={10}
                className="w-full text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none disabled:opacity-60 leading-relaxed"
              />
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-xs text-gray-500">
                Exame do Estado Mental (MSE) — vocabulário clínico estruturado.
                Selecione todas as tags aplicáveis.
              </p>
              {(Object.keys(MSE_OPTIONS) as MseCategory[]).map(cat => (
                <div key={cat}>
                  <p className="text-xs font-semibold text-gray-600 mb-2">{MSE_LABELS[cat]}</p>
                  <div className="flex flex-wrap gap-2">
                    {MSE_OPTIONS[cat].map(val => (
                      <button
                        key={val}
                        onClick={() => !isFinalized && toggleMseTag(cat, val)}
                        disabled={isFinalized}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          isMseSelected(cat, val)
                            ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                        } disabled:cursor-not-allowed`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {note?.mseSummary && (
                <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Resumo gerado</p>
                  <p className="text-sm text-gray-700">{note.mseSummary}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tela 76 — Signature confirmation */}
      {isFinalized && note?.signature && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-700 text-xl">✅</span>
              <div>
                <p className="text-sm font-bold text-green-800">Nota clínica oficial</p>
                <p className="text-xs text-green-600">Validade legal de prontuário médico</p>
              </div>
            </div>
            <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full border border-green-300">
              oficial · válido
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-mono bg-white rounded-lg border border-green-100 p-3">
            <div>
              <span className="text-gray-400 block not-italic font-sans">Profissional + CRM</span>
              <span className="text-gray-800">{note.signature.crmNumber}/{note.signature.crmState}</span>
            </div>
            <div>
              <span className="text-gray-400 block not-italic font-sans">Método de assinatura</span>
              <span className="text-gray-800">{SIGNATURE_METHODS.find(m => m.id === note.signature?.method)?.label ?? note.signature.method}</span>
            </div>
            <div>
              <span className="text-gray-400 block not-italic font-sans">Assinado em</span>
              <span className="text-gray-800">{new Date(note.signature.signedAt).toLocaleString('pt-BR')}</span>
            </div>
            <div>
              <span className="text-gray-400 block not-italic font-sans">Hash SHA-256</span>
              <span className="text-gray-800 break-all">{note.signature.documentHash.slice(0, 20)}…</span>
            </div>
          </div>

          <p className="text-xs text-green-600">
            Documento imutável. Qualquer correção deve ser feita como nota aditiva com nova assinatura.
          </p>

          {/* Checklist pós-consulta 8.5.5 */}
          <div className="grid grid-cols-2 gap-2 py-1">
            {[
              { done: true,             label: 'Nota assinada',          icon: '✅' },
              { done: feedbackReleased, label: 'Devolutiva enviada',     icon: feedbackReleased ? '✅' : '⬜' },
              { done: !!note.patientFeedback && !feedbackReleased, label: 'Devolutiva em rascunho', icon: note.patientFeedback ? '📝' : '⬜' },
              { done: false,            label: 'PDF gerado',             icon: '⬜' },
            ].filter(i => !(i.label === 'Devolutiva em rascunho' && feedbackReleased))
             .map(item => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs">
                <span>{item.icon}</span>
                <span className={item.done ? 'text-green-700 font-medium' : 'text-gray-400'}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-1 flex-wrap">
            <button
              onClick={() => setActiveTab('PLANO')}
              className="flex-1 py-2 rounded-xl border border-indigo-300 text-indigo-700 text-sm font-medium hover:bg-indigo-50"
            >
              📋 Plano terapêutico
            </button>
            <Link
              to={`/export?patientId=${note.patientId}&days=30`}
              className="flex-1 text-center py-2 rounded-xl border border-green-400 text-green-700 text-sm font-medium hover:bg-green-100"
            >
              📄 PDF gráfico
            </Link>
            <button
              onClick={openFeedbackPanel}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                feedbackReleased
                  ? 'border border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {feedbackReleased ? '✅ Devolutiva enviada' : '💌 Liberar ao paciente'}
            </button>
          </div>
        </div>
      )}

      {/* ── Signature modal ────────────────────────────────────────────────── */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-900">Assinar e finalizar nota</h2>
            <p className="text-sm text-gray-500">
              Após a assinatura, a nota se torna oficial (prontuário médico) e não poderá ser editada.
            </p>

            <div className="space-y-2">
              {SIGNATURE_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSignMethod(m.id)}
                  className={`w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                    signMethod === m.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nº CRM *</label>
                <input
                  type="text"
                  value={crmNumber}
                  onChange={e => setCrmNumber(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">UF *</label>
                <input
                  type="text"
                  value={crmState}
                  onChange={e => setCrmState(e.target.value.toUpperCase())}
                  placeholder="SP"
                  maxLength={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase"
                />
              </div>
            </div>

            {signMethod === 'gov_br_prata' && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                🏛️ <strong>Integração gov.br</strong> — a autenticação via gov.br será implementada via OAuth 2.0.
                Nesta versão, o sistema registra a assinatura com os dados informados e gera o hash do documento.
              </div>
            )}

            {signError && <p className="text-sm text-red-500">{signError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSignModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinalize}
                disabled={signing || !crmNumber || !crmState}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40"
              >
                {signing ? 'Assinando…' : '✍️ Assinar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Devolutiva panel ───────────────────────────────────────────────── */}
      {showFeedbackPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">💌 Devolutiva ao paciente</h2>
              <button onClick={() => setShowFeedbackPanel(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            {feedbackReleased ? (
              /* ── Estado pós-liberação ── */
              <div className="space-y-4">
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-center space-y-1">
                  <p className="text-green-700 font-semibold">📤 Devolutiva enviada ao paciente</p>
                  <p className="text-xs text-green-600">O paciente verá o texto na aba "Devolutivas" do app.</p>
                </div>

                <p className="text-sm font-semibold text-gray-700">Próximas ações pós-consulta</p>
                <div className="space-y-2">
                  {/* PDF gráfico */}
                  <Link
                    to={`/export?patientId=${patientId}&days=30`}
                    onClick={() => setShowFeedbackPanel(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    <span className="text-xl">📄</span>
                    <div>
                      <p className="text-sm font-semibold text-indigo-800">Gerar PDF gráfico do período</p>
                      <p className="text-xs text-indigo-600">Relatório dos últimos 30 dias com gráficos de humor, escalas e check-ins</p>
                    </div>
                  </Link>

                  {/* Plano terapêutico */}
                  <button
                    onClick={() => { setShowFeedbackPanel(false); setActiveTab('PLANO'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-xl">📋</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Revisar plano terapêutico</p>
                      <p className="text-xs text-gray-500">Medicações, hábitos, exames e data de retorno</p>
                    </div>
                  </button>

                  {/* Fechar */}
                  <button
                    onClick={() => setShowFeedbackPanel(false)}
                    className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              /* ── Estado de edição ── */
              <>
                <p className="text-sm text-gray-500">
                  Texto em linguagem simples para o paciente. Revise e edite antes de liberar.
                </p>

                {/* Contexto pré-consulta */}
                {preForm && (preForm.chiefComplaint || (preForm.objectives ?? []).length > 0) && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
                    <button
                      onClick={() => setShowPreFormContext(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left"
                    >
                      <span className="text-xs font-semibold text-amber-700">📋 Contexto pré-consulta (o que o paciente trouxe)</span>
                      <span className="text-amber-500 text-xs">{showPreFormContext ? '▲' : '▼'}</span>
                    </button>
                    {showPreFormContext && (
                      <div className="px-4 pb-3 space-y-2 border-t border-amber-200">
                        {preForm.chiefComplaint && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-amber-600 font-semibold mt-2">Queixa principal</p>
                            <p className="text-xs text-amber-800">{preForm.chiefComplaint}</p>
                          </div>
                        )}
                        {(preForm.objectives ?? []).length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-amber-600 font-semibold mt-2">Objetivos definidos</p>
                            {(preForm.objectives ?? []).filter(Boolean).map((obj, i) => (
                              <p key={i} className="text-xs text-amber-800">{i + 1}. {obj}</p>
                            ))}
                          </div>
                        )}
                        {preForm.hasUrgentConcern && preForm.urgentText && (
                          <div className="bg-red-50 border border-red-200 rounded px-2 py-1.5">
                            <p className="text-[10px] uppercase tracking-wide text-red-600 font-semibold">Preocupação urgente</p>
                            <p className="text-xs text-red-700">{preForm.urgentText}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!feedback && (
                  <button
                    onClick={handleGenerateFeedback}
                    disabled={generatingFeedback}
                    className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
                  >
                    {generatingFeedback ? 'Gerando com IA…' : '✨ Gerar com IA'}
                  </button>
                )}

                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  rows={8}
                  placeholder="Escreva ou gere com IA uma devolutiva para o paciente em linguagem simples e acolhedora…"
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />

                {feedbackSaved && (
                  <p className="text-sm text-green-600 font-medium">✓ Devolutiva salva!</p>
                )}

                {feedback && (
                  <button
                    onClick={handleGenerateFeedback}
                    disabled={generatingFeedback}
                    className="text-xs text-violet-600 hover:text-violet-800 disabled:opacity-50"
                  >
                    {generatingFeedback ? 'Gerando…' : '✨ Regenerar com IA'}
                  </button>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleReleaseFeedback(false)}
                    disabled={releasingFeedback || !feedback}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Salvar rascunho
                  </button>
                  <button
                    onClick={() => handleReleaseFeedback(true)}
                    disabled={releasingFeedback || !feedback}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-40"
                  >
                    {releasingFeedback ? 'Liberando…' : '📤 Liberar ao paciente'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Decision Support panel ─────────────────────────────────────────── */}
      {showDecisionPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">🔬 Suporte à Decisão Clínica</h2>
              <button onClick={() => setShowDecisionPanel(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <p className="text-xs text-gray-500">
              Alertas baseados no conteúdo da nota clínica. Não substitui o julgamento profissional.
              Toda conduta é responsabilidade do profissional de saúde.
            </p>

            {loadingDecision ? (
              <div className="text-center py-8 text-gray-400">Analisando nota clínica…</div>
            ) : decisionAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-3xl mb-2">✅</div>
                Nenhum alerta identificado para esta nota.
              </div>
            ) : (
              <div className="space-y-3">
                {decisionAlerts.map((alert, i) => {
                  const severityColors: Record<string, string> = {
                    high:   'border-red-300 bg-red-50',
                    medium: 'border-orange-300 bg-orange-50',
                    low:    'border-yellow-300 bg-yellow-50',
                    info:   'border-blue-200 bg-blue-50',
                  };
                  const severityTextColors: Record<string, string> = {
                    high:   'text-red-800',
                    medium: 'text-orange-800',
                    low:    'text-yellow-800',
                    info:   'text-blue-800',
                  };
                  const severityIcons: Record<string, string> = {
                    high: '🚨', medium: '⚠️', low: '⚠', info: 'ℹ️',
                  };
                  return (
                    <div key={i} className={`rounded-xl border p-4 ${severityColors[alert.severity] ?? 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-start gap-2">
                        <span>{severityIcons[alert.severity] ?? '⚠'}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${severityTextColors[alert.severity] ?? 'text-gray-800'}`}>
                            {alert.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                          <p className="text-xs font-medium text-gray-700 mt-2 bg-white/60 rounded-lg px-2 py-1.5">
                            💡 {alert.recommendation}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              Confiança: {alert.confidence}% · {alert.category.replace('_', ' ')}
                            </span>
                            {alert.references.length > 0 && (
                              <span className="text-xs text-blue-600">{alert.references.length} referência(s)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              <strong>Aviso LGPD e CFM:</strong> Esta análise usa pseudônimo do paciente. Nenhum dado identificável
              foi transmitido a sistemas externos. Suporte à decisão ≠ diagnóstico.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
