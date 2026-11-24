import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Send,
  Compass,
  Brain,
  Clock,
  Smile,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import type {
  DialogueTurn,
  NodeId,
  NodeProgress,
  SessionProfileVector,
} from '../types/svm';
import { getGuidedQuickReplies } from '../lib/mocaviEngine';

interface MocaviTutorPanelProps {
  profile: SessionProfileVector;
  dialogue: DialogueTurn[];
  silenceSeconds: number;
  isDraggingCanvas: boolean;
  isThinking: boolean;
  onSendMessage: (message: string) => void;
  onRetryLastQuestion?: () => void;
}

const KID_NODE_META: Record<NodeId, { title: string; idleHint: string }> = {
  N1_SV: { title: '1. Puntos Clave', idleHint: 'Anillo violeta' },
  N2_MARGIN: { title: '2. Calle Segura', idleHint: 'Pasillo ancho' },
  N3_CPARAM: { title: '3. Regla C', idleHint: 'Infiltrados' },
  N4_KERNEL: { title: '4. Truco 3D', idleHint: 'Elevar islas' },
};

function renderNodeIcon(node: NodeProgress) {
  if (node.status === 'CONSOLIDADO') {
    return <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />;
  }
  if (node.status === 'EN_CONFLICTO') {
    return <AlertTriangle className="w-4 h-4 text-[#b45309] shrink-0" aria-hidden="true" />;
  }
  if (node.status === 'EN_PROGRESO' || node.status === 'EVIDENCIA_UNILATERAL') {
    return <CheckCircle2 className="w-4 h-4 text-[#004ac6] shrink-0" aria-hidden="true" />;
  }
  return <Circle className="w-4 h-4 text-[#737686] shrink-0" aria-hidden="true" />;
}

export const MocaviTutorPanel: React.FC<MocaviTutorPanelProps> = ({
  profile,
  dialogue,
  silenceSeconds,
  isDraggingCanvas,
  isThinking,
  onSendMessage,
  onRetryLastQuestion,
}) => {
  const [draft, setDraft] = useState('');
  const feedEndRef = useRef<HTMLDivElement | null>(null);
  const quickReplies = getGuidedQuickReplies(profile.activeTier);
  const nodeList = Object.values(profile.nodes);
  const consolidatedCount = nodeList.filter((n) => n.status === 'CONSOLIDADO').length;

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [dialogue.length, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draft.trim();
    if (!cleaned || isThinking) return;
    setDraft('');
    onSendMessage(cleaned);
  };

  const silenceStatusText = isThinking
    ? 'Pensando una respuesta clara...'
    : isDraggingCanvas
      ? 'Mirando tu experimento...'
      : silenceSeconds > 0
        ? `Silencio Activo: ${silenceSeconds}s (Prueba tranquilo)`
        : 'Listo para tus preguntas';

  return (
    <aside
      aria-label="Tutor SVM MOCAVI"
      className="w-full flex flex-col gap-3.5"
    >
      {/* Card 1: 4 Kid-Friendly Core Ideas Progress */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#dae2fd] shadow-[0_1px_4px_rgba(19,27,46,0.04)] flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Compass className="w-4 h-4 text-[#004ac6] shrink-0" aria-hidden="true" />
            <h2 className="font-display text-[14.5px] font-bold text-[#131b2e] truncate">
              Tu Mapa de 4 Ideas
            </h2>
          </div>
          <span
            data-testid="scaffolding-phase"
            className="px-2 py-0.5 rounded-md font-mono text-[10.5px] font-semibold whitespace-nowrap bg-[#d1fae5] text-[#006243] tabular-nums"
          >
            {consolidatedCount}/4 dominadas
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5" data-testid="ontology-nodes-grid">
          {nodeList.map((node) => {
            const meta = KID_NODE_META[node.id];
            const isConsolidated = node.status === 'CONSOLIDADO';
            const isConflict = node.status === 'EN_CONFLICTO';
            const isActive =
              node.status === 'EN_PROGRESO' || node.status === 'EVIDENCIA_UNILATERAL';

            const cardCls = isConsolidated
              ? 'bg-[#ecfdf5] text-[#002114] border-[#a7f3d0]'
              : isConflict
                ? 'bg-[#fffbeb] text-[#78350f] border-[#fde68a]'
                : isActive
                  ? 'bg-[#dbe1ff]/55 text-[#003ea8] border-[#b4c5ff]'
                  : 'bg-[#f2f3ff] text-[#434655] border-transparent';

            const subtext = isConsolidated
              ? '¡Dominado!'
              : isConflict
                ? 'Pista activa'
                : node.status === 'EVIDENCIA_UNILATERAL'
                  ? node.canvasVerified
                    ? 'Cuéntalo al tutor'
                    : 'Pruébalo en mapa'
                  : meta.idleHint;

            return (
              <div
                key={node.id}
                data-testid={`node-card-${node.id}`}
                data-status={node.status}
                className={`p-2 rounded-xl border flex items-center gap-2 transition-colors ${cardCls}`}
              >
                {renderNodeIcon(node)}
                <div className="min-w-0 flex flex-col">
                  <span className="font-display text-[12px] font-semibold leading-tight truncate">
                    {meta.title}
                  </span>
                  <span className="font-mono text-[10px] opacity-85 truncate">{subtext}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card 2: Interactive Socratic Tutor Chat */}
      <div className="flex-1 bg-white rounded-2xl border border-[#dae2fd] shadow-[0_1px_4px_rgba(19,27,46,0.04)] flex flex-col overflow-hidden min-h-[430px]">
        {/* Tutor Header + Active Silence Timer */}
        <div className="px-3.5 py-2.5 bg-[#f2f3ff] border-b border-[#e2e7ff] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#004ac6] to-[#006243] text-white font-display text-sm font-bold flex items-center justify-center shrink-0">
              TM
            </div>
            <div className="min-w-0">
              <div className="font-display text-[14px] font-semibold text-[#131b2e] leading-tight">
                Tutor SVM (MOCAVI)
              </div>
              <div
                data-testid="active-silence-status"
                className="font-mono text-[10.5px] text-[#006243] flex items-center gap-1 truncate tabular-nums"
              >
                <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{silenceStatusText}</span>
              </div>
            </div>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-[#dae2fd] text-[#004ac6] font-semibold whitespace-nowrap">
            Grado 9°
          </span>
        </div>

        {/* Scrollable Socratic Dialogue Feed */}
        <div
          data-testid="chat-feed"
          className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-2.5 max-h-[360px]"
        >
          {dialogue.map((turn, index) => {
            const isStudent = turn.sender === 'STUDENT';
            const isLatestTutorQuestion = !isStudent && index === dialogue.length - 1;

            if (isStudent) {
              return (
                <div key={turn.turnId} className="flex justify-end">
                  <div className="bg-[#004ac6] text-white px-3.5 py-2 rounded-2xl rounded-tr-xs max-w-[88%] text-[13px] leading-snug">
                    {turn.text}
                  </div>
                </div>
              );
            }

            return (
              <div key={turn.turnId} className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full bg-[#dbe1ff] text-[#004ac6] flex items-center justify-center text-[10.5px] font-display font-bold shrink-0 mt-0.5">
                  TM
                </div>
                <div
                  className={`p-3 rounded-2xl rounded-tl-xs max-w-[90%] text-[13px] leading-snug ${
                    turn.isError
                      ? 'bg-[#fef2f2] border border-[#fecaca] text-[#991b1b]'
                      : isLatestTutorQuestion
                        ? 'bg-[#ecfdf5]/85 border border-[#a7f3d0] text-[#131b2e]'
                        : 'bg-[#f2f3ff] text-[#131b2e]'
                  }`}
                >
                  {turn.tag && (
                    <div className="flex items-center gap-1 font-mono text-[10px] font-semibold text-[#006243] mb-1">
                      {turn.hintTier === 3 ? (
                        <Sparkles className="w-3 h-3 shrink-0" aria-hidden="true" />
                      ) : (
                        <Brain className="w-3 h-3 shrink-0" aria-hidden="true" />
                      )}
                      <span>{turn.tag}</span>
                    </div>
                  )}
                  <p className={turn.isError ? 'text-[#991b1b]' : 'text-[#131b2e]'}>{turn.text}</p>
                  {turn.isError && onRetryLastQuestion && (
                    <button
                      type="button"
                      onClick={onRetryLastQuestion}
                      className="mt-2 px-2.5 py-1 rounded-lg bg-[#004ac6] text-white font-display text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" aria-hidden="true" />
                      <span>Intentar de nuevo</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex gap-2 items-start" data-testid="tutor-thinking">
              <div className="w-7 h-7 rounded-full bg-[#dbe1ff] text-[#004ac6] flex items-center justify-center text-[10.5px] font-display font-bold shrink-0 mt-0.5">
                TM
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-xs bg-[#f2f3ff] text-[#434655] text-xs font-medium">
                Leyendo tu pregunta y mirando tu mapa...
              </div>
            </div>
          )}
          <div ref={feedEndRef} />
        </div>

        {/* Guided Quick-Reply Buttons */}
        <div className="px-3.5 pt-2 pb-2 bg-white border-t border-[#eaedff] flex flex-col gap-1.5">
          <span className="font-mono text-[10px] text-[#434655] font-semibold">
            Preguntas rápidas (o escribe la tuya abajo):
          </span>
          <div className="flex flex-wrap gap-1.5" data-testid="quick-replies">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                disabled={isThinking}
                onClick={() => onSendMessage(reply)}
                className="px-2.5 py-1.5 rounded-lg bg-[#f2f3ff] hover:bg-[#e2e7ff] disabled:opacity-60 text-[#131b2e] text-[11.5px] text-left leading-tight transition-colors cursor-pointer"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        {/* Student Input Form */}
        <div className="p-3 bg-[#f2f3ff] border-t border-[#e2e7ff] flex flex-col gap-1.5">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <label htmlFor="mocavi-chat-input" className="sr-only">
              Haz una pregunta o cuenta lo que ves en el mapa
            </label>
            <input
              id="mocavi-chat-input"
              type="text"
              value={draft}
              disabled={isThinking}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Pregunta lo que quieras o cuenta qué pasó..."
              className="flex-1 bg-white text-[#131b2e] border border-[#dae2fd] px-3 py-2 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#004ac6] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isThinking}
              aria-label="Enviar pregunta al tutor"
              className="w-10 h-10 rounded-xl bg-[#006243] hover:bg-[#059669] disabled:opacity-60 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10.5px] text-[#434655] px-0.5">
            <span className="flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-[#006243]" aria-hidden="true" />
              <span>Pregunta sin miedo</span>
            </span>
            <span>Progreso guardado automáticamente</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
