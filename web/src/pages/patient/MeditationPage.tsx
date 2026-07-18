import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SessionType = 'breathing' | 'guided';
type AmbientType = 'none' | 'rain' | 'forest' | 'ocean';
type BreathPhase = 'inspire' | 'segure' | 'expire';

interface SessionDef {
  id: string;
  title: string;
  subtitle: string;
  durationMin: number;
  type: SessionType;
  icon: string;
  color: string;
  audience: 'self' | 'support';
  steps: Array<{ text: string; durationSec: number }>;
}

// ─── Conteúdo das sessões ─────────────────────────────────────────────────────

const SESSIONS: SessionDef[] = [
  {
    id: 'breathing-444',
    title: 'Respiração 4-4-4',
    subtitle: 'Acalma o sistema nervoso em minutos',
    durationMin: 3,
    type: 'breathing',
    icon: '🌬️',
    color: 'from-blue-900 to-indigo-950',
    audience: 'self',
    steps: [],
  },
  {
    id: 'crisis-3min',
    title: 'Calma em 3 minutos',
    subtitle: 'Para momentos de crise ou ansiedade aguda',
    durationMin: 3,
    type: 'guided',
    icon: '🌊',
    color: 'from-teal-900 to-cyan-950',
    audience: 'self',
    steps: [
      { text: 'Encontre uma posição confortável. Pode fechar os olhos, ou apenas suavizar o olhar.', durationSec: 10 },
      { text: 'Coloque uma mão no peito e outra na barriga. Sinta o toque.', durationSec: 8 },
      { text: 'Inspire lentamente pelo nariz... conte 1, 2, 3, 4...', durationSec: 8 },
      { text: 'Segure o ar por um momento... 1, 2, 3, 4...', durationSec: 6 },
      { text: 'Expire devagar pela boca... deixe ir...', durationSec: 8 },
      { text: 'Muito bem. Repita mais duas vezes, no seu ritmo.', durationSec: 30 },
      { text: 'Agora observe: o que você está sentindo no corpo? Onde está a tensão?', durationSec: 12 },
      { text: 'Não precisa resolver nada agora. Só precisa estar aqui, presente.', durationSec: 10 },
      { text: 'Você está seguro neste momento. Este momento vai passar.', durationSec: 10 },
      { text: 'Inspire... segure... expire... Tudo bem. Você chegou até aqui.', durationSec: 12 },
      { text: 'Quando estiver pronto, abra os olhos devagar. Você fez bem.', durationSec: 10 },
    ],
  },
  {
    id: 'stress-5min',
    title: 'Alívio do estresse',
    subtitle: 'Relaxamento progressivo para tensão acumulada',
    durationMin: 5,
    type: 'guided',
    icon: '🍃',
    color: 'from-green-900 to-emerald-950',
    audience: 'self',
    steps: [
      { text: 'Sente-se ou deite-se confortavelmente. Feche os olhos.', durationSec: 8 },
      { text: 'Respire fundo três vezes. Cada expiração solta um pouco da tensão.', durationSec: 18 },
      { text: 'Agora, aperte os punhos com força por 5 segundos... e solte. Sinta a diferença.', durationSec: 12 },
      { text: 'Aperte os ombros em direção às orelhas... e solte. Deixe cair.', durationSec: 12 },
      { text: 'Feche os olhos com força... e relaxe. Deixe o rosto amolecer.', durationSec: 10 },
      { text: 'Observe sua respiração. Não precisa controlá-la. Só observe.', durationSec: 15 },
      { text: 'Pense em um lugar onde você se sente seguro. Pode ser real ou imaginado.', durationSec: 12 },
      { text: 'O que você vê neste lugar? O que ouve? Que temperatura sente?', durationSec: 15 },
      { text: 'Fique aqui por um momento. Você merece este descanso.', durationSec: 20 },
      { text: 'Tensão é informação — ela te diz que algo importa. Obrigado, tensão.', durationSec: 12 },
      { text: 'Respire fundo mais uma vez. Expire devagar.', durationSec: 10 },
      { text: 'Quando estiver pronto, mova os dedos dos pés e das mãos e abra os olhos.', durationSec: 10 },
    ],
  },
  {
    id: 'sleep-prep',
    title: 'Preparação para dormir',
    subtitle: 'Body scan para desacelerar antes de dormir',
    durationMin: 8,
    type: 'guided',
    icon: '🌙',
    color: 'from-purple-950 to-slate-950',
    audience: 'self',
    steps: [
      { text: 'Deite-se na sua posição preferida para dormir. Feche os olhos.', durationSec: 8 },
      { text: 'Respire suavemente. Não há nada que você precisa fazer agora.', durationSec: 12 },
      { text: 'Leve a atenção para os pés. Sinta-os relaxar completamente.', durationSec: 15 },
      { text: 'Suba pelas panturrilhas e pelos joelhos. Deixe-os afundar no colchão.', durationSec: 15 },
      { text: 'Coxas e quadris — pesados, soltos, relaxados.', durationSec: 15 },
      { text: 'Barriga e peito — a cada expiração, afundam um pouquinho mais.', durationSec: 15 },
      { text: 'Costas — toda a tensão escorregando para longe.', durationSec: 12 },
      { text: 'Braços e mãos — pesados como chumbo. Dedos separados e soltos.', durationSec: 15 },
      { text: 'Pescoço, mandíbula, bochechas — tudo amolece.', durationSec: 12 },
      { text: 'Testa e couro cabeludo — liso, relaxado, solto.', durationSec: 12 },
      { text: 'Seu corpo está completamente relaxado. Sua mente pode descansar agora.', durationSec: 20 },
      { text: 'Se um pensamento aparecer, apenas observe e deixe passar como uma nuvem.', durationSec: 20 },
      { text: 'Você está seguro. Você está descansando. Pode soltar tudo...', durationSec: 30 },
    ],
  },
  {
    id: 'support-loved',
    title: 'Para quem apoia',
    subtitle: 'Para familiares e amigos de alguém em sofrimento',
    durationMin: 5,
    type: 'guided',
    icon: '🤝',
    color: 'from-rose-900 to-pink-950',
    audience: 'support',
    steps: [
      { text: 'Você está aqui porque se importa. Isso já é muito.', durationSec: 10 },
      { text: 'Cuidar de alguém que sofre é difícil. Você também precisa de cuidado.', durationSec: 10 },
      { text: 'Feche os olhos. Respire fundo. Este momento é seu.', durationSec: 12 },
      { text: 'Não é fraqueza pedir ajuda. É coragem. Para você e para quem você ama.', durationSec: 12 },
      { text: 'Você não precisa ter todas as respostas. Sua presença já é terapêutica.', durationSec: 12 },
      { text: 'Respire... Você pode escutar sem resolver. Pode estar sem consertar.', durationSec: 14 },
      { text: 'Às vezes a coisa mais importante é dizer: "Estou aqui. Não estou indo a lugar nenhum."', durationSec: 14 },
      { text: 'Cuide-se também. Você não pode dar o que não tem.', durationSec: 10 },
      { text: 'Respire mais uma vez — fundo, devagar. Para você.', durationSec: 12 },
      { text: 'Obrigado por estar aqui. Sua presença faz diferença.', durationSec: 10 },
    ],
  },
];

// ─── Web Audio API — Sons ambientais ─────────────────────────────────────────

class AmbientPlayer {
  private ctx: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private gainNode: GainNode | null = null;
  start(type: AmbientType, volume: number) {
    this.stop();
    if (type === 'none') return;
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = volume;
    this.gainNode.connect(this.ctx.destination);

    if (type === 'rain') this.buildRain();
    if (type === 'forest') this.buildForest();
    if (type === 'ocean') this.buildOcean();
  }

  private buildRain() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3000;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 300;

    src.connect(lp);
    lp.connect(hp);
    hp.connect(this.gainNode);
    src.start();
    this.nodes.push(src);
  }

  private buildForest() {
    if (!this.ctx || !this.gainNode) return;
    // Soft wind (low-pass noise)
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const wind = this.ctx.createBufferSource();
    wind.buffer = buffer;
    wind.loop = true;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.3;
    wind.connect(lp);
    lp.connect(windGain);
    windGain.connect(this.gainNode);
    wind.start();
    this.nodes.push(wind);

    // Bird chirps — occasional sine bursts
    const buildBird = (freq: number, delay: number, interval: number) => {
      if (!this.ctx || !this.gainNode) return;
      const scheduleChirp = () => {
        if (!this.ctx || !this.gainNode) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.3, this.ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(freq, this.ctx.currentTime + 0.2);

        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0, this.ctx.currentTime);
        env.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.05);
        env.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);

        osc.connect(env);
        env.connect(this.gainNode!);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.25);
        this.nodes.push(osc);

        setTimeout(scheduleChirp, interval + Math.random() * 2000);
      };
      setTimeout(scheduleChirp, delay);
    };

    buildBird(2200, 800, 4000);
    buildBird(1800, 2500, 6000);
    buildBird(2600, 5000, 8000);
  }

  private buildOcean() {
    if (!this.ctx || !this.gainNode) return;
    // White noise shaped as ocean waves with LFO
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 600;
    bp.Q.value = 0.5;

    // LFO for wave rhythm (~0.15 Hz = ~6.5s period)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.4;

    const waveGain = this.ctx.createGain();
    waveGain.gain.value = 0.6;

    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);
    src.connect(bp);
    bp.connect(waveGain);
    waveGain.connect(this.gainNode);

    src.start();
    lfo.start();
    this.nodes.push(src, lfo);
  }

  setVolume(v: number) {
    if (this.gainNode) this.gainNode.gain.value = v;
  }

  stop() {
    for (const n of this.nodes) {
      try { (n as AudioBufferSourceNode).stop?.(); } catch { /* already stopped */ }
    }
    this.nodes = [];
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.gainNode = null;
  }
}

// ─── Breathing animation ──────────────────────────────────────────────────────

const BREATH_PHASES: Array<{ phase: BreathPhase; label: string; duration: number; scale: number }> = [
  { phase: 'inspire', label: 'Inspire', duration: 4, scale: 1.4 },
  { phase: 'segure',  label: 'Segure',  duration: 4, scale: 1.4 },
  { phase: 'expire',  label: 'Expire',  duration: 4, scale: 1.0 },
];

function BreathingPlayer({ onEnd }: { onEnd: () => void }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const [cyclesDone, setCyclesDone] = useState(0);
  const TOTAL_CYCLES = 8;

  const current = BREATH_PHASES[phaseIdx];

  useEffect(() => {
    if (cyclesDone >= TOTAL_CYCLES) { onEnd(); return; }
    const id = setInterval(() => {
      setTick(t => {
        const next = t + 1;
        if (next >= current.duration) {
          const nextIdx = (phaseIdx + 1) % BREATH_PHASES.length;
          setPhaseIdx(nextIdx);
          if (nextIdx === 0) setCyclesDone(c => c + 1);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phaseIdx, cyclesDone, current.duration, onEnd]);

  const progress = tick / current.duration;
  const SIZE = 200;
  const R = 80;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const dashoffset = CIRCUMFERENCE * (1 - progress);

  const phaseColors: Record<BreathPhase, string> = {
    inspire: '#818cf8',
    segure:  '#a78bfa',
    expire:  '#6ee7b7',
  };
  const color = phaseColors[current.phase];

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {/* Background circle */}
        <svg width={SIZE} height={SIZE} className="absolute inset-0">
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
        </svg>
        {/* Progress ring */}
        <svg width={SIZE} height={SIZE} className="absolute inset-0 -rotate-90">
          <circle
            cx={SIZE/2} cy={SIZE/2} r={R}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashoffset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.8s ease' }}
          />
        </svg>
        {/* Inner pulsing blob */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `scale(${0.8 + (current.scale - 0.8) * progress})`,
            transition: 'transform 1s ease',
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: 100,
              height: 100,
              background: `radial-gradient(circle, ${color}55, ${color}11)`,
              boxShadow: `0 0 40px ${color}44`,
            }}
          />
        </div>
        {/* Seconds */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-light text-white tabular-nums">
            {current.duration - tick}
          </span>
        </div>
      </div>

      {/* Phase label */}
      <div className="text-center">
        <p className="text-2xl font-light text-white tracking-wider">{current.label}</p>
        <p className="text-sm text-white/40 mt-1">Ciclo {cyclesDone + 1} de {TOTAL_CYCLES}</p>
      </div>

      {/* Phase indicators */}
      <div className="flex gap-3">
        {BREATH_PHASES.map((p, i) => (
          <div
            key={p.phase}
            className={`h-1 w-10 rounded-full transition-colors ${
              i === phaseIdx ? 'bg-white' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Guided text player ───────────────────────────────────────────────────────

function GuidedPlayer({ session, onEnd }: { session: SessionDef; onEnd: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const totalSecs = session.steps.reduce((s, step) => s + step.durationSec, 0);
  const elapsed = session.steps.slice(0, stepIdx).reduce((s, step) => s + step.durationSec, 0) + tick;
  const globalProgress = totalSecs > 0 ? elapsed / totalSecs : 0;

  const current = session.steps[stepIdx];

  useEffect(() => {
    if (stepIdx >= session.steps.length) { onEnd(); return; }
    const id = setInterval(() => {
      setTick(t => {
        if (t + 1 >= current.durationSec) {
          setStepIdx(i => i + 1);
          return 0;
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stepIdx, current?.durationSec, session.steps.length, onEnd]);

  const remaining = Math.ceil(totalSecs - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="flex flex-col items-center gap-8 max-w-sm text-center">
      {/* Global progress bar */}
      <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/60 rounded-full transition-all duration-1000"
          style={{ width: `${globalProgress * 100}%` }}
        />
      </div>

      {/* Text */}
      <div className="min-h-32 flex items-center justify-center px-4">
        <p
          key={stepIdx}
          className="text-xl font-light text-white leading-relaxed"
          style={{ animation: 'fadeIn 0.8s ease' }}
        >
          {current?.text ?? '…'}
        </p>
      </div>

      {/* Step dots */}
      <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
        {session.steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 w-4 rounded-full transition-colors ${
              i < stepIdx ? 'bg-white/60' :
              i === stepIdx ? 'bg-white' : 'bg-white/15'
            }`}
          />
        ))}
      </div>

      {/* Timer */}
      <p className="text-white/40 text-sm tabular-nums">
        {mins}:{secs.toString().padStart(2, '0')} restando
      </p>
    </div>
  );
}

// ─── Ambient controls ─────────────────────────────────────────────────────────

const AMBIENTS: Array<{ id: AmbientType; label: string; icon: string }> = [
  { id: 'none',   label: 'Silêncio', icon: '🔇' },
  { id: 'rain',   label: 'Chuva',    icon: '🌧️' },
  { id: 'forest', label: 'Floresta', icon: '🌿' },
  { id: 'ocean',  label: 'Mar',      icon: '🌊' },
];

function AmbientControls({ ambient, onChange }: {
  ambient: AmbientType;
  onChange: (type: AmbientType) => void;
}) {
  return (
    <div className="flex gap-2">
      {AMBIENTS.map(a => (
        <button
          key={a.id}
          onClick={() => onChange(a.id)}
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs transition-colors ${
            ambient === a.id
              ? 'bg-white/20 text-white'
              : 'text-white/40 hover:text-white/70 hover:bg-white/10'
          }`}
        >
          <span className="text-lg">{a.icon}</span>
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({ session, onStart }: { session: SessionDef; onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className={`text-left rounded-2xl bg-gradient-to-br ${session.color} p-5 hover:scale-[1.02] transition-transform`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{session.icon}</span>
        <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
          {session.durationMin} min
        </span>
      </div>
      <h3 className="font-semibold text-white text-base">{session.title}</h3>
      <p className="text-white/60 text-xs mt-1 leading-relaxed">{session.subtitle}</p>
      {session.audience === 'support' && (
        <span className="mt-2 inline-block text-xs bg-rose-800/50 text-rose-200 px-2 py-0.5 rounded-full">
          Para quem apoia
        </span>
      )}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MeditationPage() {
  const [activeSession, setActiveSession] = useState<SessionDef | null>(null);
  const [sessionDone, setSessionDone] = useState(false);
  const [ambient, setAmbient] = useState<AmbientType>('none');
  const playerRef = useRef<AmbientPlayer>(new AmbientPlayer());

  const changeAmbient = useCallback((type: AmbientType) => {
    setAmbient(type);
    playerRef.current.stop();
    if (type !== 'none') playerRef.current.start(type, 0.3);
  }, []);

  const startSession = (session: SessionDef) => {
    setActiveSession(session);
    setSessionDone(false);
  };

  const endSession = useCallback(() => {
    setSessionDone(true);
  }, []);

  const closeSession = () => {
    playerRef.current.stop();
    setAmbient('none');
    setActiveSession(null);
    setSessionDone(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { playerRef.current.stop(); };
  }, []);

  // ── Player (tela imersiva) ───────────────────────────────────────────────
  if (activeSession) {
    return (
      <div className={`fixed inset-0 z-40 bg-gradient-to-b ${activeSession.color} flex flex-col overflow-hidden`}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <button
            onClick={closeSession}
            className="text-white/50 hover:text-white text-sm"
          >
            ← Sair
          </button>
          <h2 className="text-white/80 text-sm font-medium">{activeSession.title}</h2>
          <div className="w-12" />
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-6">
          {sessionDone ? (
            <div className="text-center space-y-6">
              <div className="text-6xl">✨</div>
              <h3 className="text-2xl font-light text-white">Bem feito</h3>
              <p className="text-white/60 text-sm max-w-xs">
                Você dedicou tempo a si mesmo. Isso importa.
              </p>
              <button
                onClick={closeSession}
                className="mt-4 px-8 py-3 bg-white/20 text-white rounded-2xl hover:bg-white/30 transition-colors"
              >
                Concluir
              </button>
            </div>
          ) : activeSession.type === 'breathing' ? (
            <BreathingPlayer onEnd={endSession} />
          ) : (
            <GuidedPlayer session={activeSession} onEnd={endSession} />
          )}
        </div>

        {/* Bottom — ambient controls */}
        {!sessionDone && (
          <div className="px-6 pb-8 flex flex-col items-center gap-3">
            <p className="text-white/30 text-xs">Sons ambientais</p>
            <AmbientControls ambient={ambient} onChange={changeAmbient} />
          </div>
        )}
      </div>
    );
  }

  // ── Listagem de sessões ──────────────────────────────────────────────────
  const selfSessions  = SESSIONS.filter(s => s.audience === 'self');
  const supportSessions = SESSIONS.filter(s => s.audience === 'support');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Meditação e respiro</h1>
        <p className="text-sm text-gray-400 mt-0.5">Técnicas práticas para momentos difíceis</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {/* Breathing highlight */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Respiração
          </h2>
          <button
            onClick={() => startSession(SESSIONS[0])}
            className="w-full rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 p-6 text-left hover:scale-[1.01] transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl shrink-0">
                🌬️
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Respiração 4-4-4</h3>
                <p className="text-white/60 text-sm mt-0.5">
                  Inspire 4s · Segure 4s · Expire 4s · 8 ciclos · ~3 min
                </p>
                <p className="text-white/40 text-xs mt-1">
                  Ativa o sistema parassimpático e reduz ansiedade imediatamente
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Guided meditations */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Meditações guiadas
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {selfSessions.slice(1).map(session => (
              <SessionCard key={session.id} session={session} onStart={() => startSession(session)} />
            ))}
          </div>
        </div>

        {/* Support section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Para familiares e amigos
          </h2>
          <p className="text-xs text-gray-400 mb-3">Para quem acompanha alguém em sofrimento</p>
          <div className="grid grid-cols-1 gap-3">
            {supportSessions.map(session => (
              <SessionCard key={session.id} session={session} onStart={() => startSession(session)} />
            ))}
          </div>
        </div>

        {/* Note about audio */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">📌 Sobre áudios com voz</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            A integração com áudios narrados (estilo Headspace) está prevista após avaliação de
            licenciamento — Insight Timer, Smiling Mind e produções próprias estão em análise.
            Por ora, as sessões são guiadas por texto com sons ambientais gerados localmente.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
