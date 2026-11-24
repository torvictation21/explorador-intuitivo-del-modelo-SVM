import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Compass,
} from 'lucide-react';
import {
  SVM_QUIZ_QUESTIONS,
  computeQuizBadge,
  type QuizDiagramType,
} from '../data/quizQuestions';
import type { DatasetTier, NodeId, QuizAttemptResult } from '../types/svm';

interface KnowledgeQuizViewProps {
  savedResult: QuizAttemptResult | null;
  onCompleteQuiz: (result: QuizAttemptResult) => void;
  onPracticeNodeInLab: (tier: DatasetTier) => void;
}

const NODE_LABELS: Record<NodeId, { title: string; tier: DatasetTier }> = {
  N1_SV: { title: '1. Puntos Clave (Pilares)', tier: 'TIER_1_LINEAR' },
  N2_MARGIN: { title: '2. Calle Segura (Margen)', tier: 'TIER_1_LINEAR' },
  N3_CPARAM: { title: '3. Puntos Rebeldes (C)', tier: 'TIER_2_SOFT_MARGIN' },
  N4_KERNEL: { title: '4. Truco 3D (Kernel)', tier: 'TIER_3_KERNEL_NONLINEAR' },
};

function QuizMiniDiagram({ type }: { type: QuizDiagramType }) {
  if (type === 'FAR_POINT_MOVE' || type === 'SUPPORT_RING') {
    return (
      <svg viewBox="0 0 280 120" className="w-full max-w-[280px] h-28 rounded-xl bg-[#f8faff] border border-[#dae2fd]" aria-hidden="true">
        <line x1="20" y1="98" x2="260" y2="28" stroke="#059669" strokeWidth="3" />
        <line x1="20" y1="74" x2="260" y2="4" stroke="#059669" strokeWidth="1.5" strokeDasharray="4 4" />
        <line x1="20" y1="120" x2="260" y2="52" stroke="#059669" strokeWidth="1.5" strokeDasharray="4 4" />
        {/* Far blue point with movement arrow */}
        <circle cx="42" cy="24" r="6" fill="#2563eb" />
        <path d="M52 24 L74 24 M68 19 L74 24 L68 29" stroke="#2563eb" strokeWidth="2" fill="none" />
        <circle cx="84" cy="24" r="6" fill="#2563eb" opacity="0.45" />
        {/* Support vectors with violet rings */}
        <circle cx="120" cy="45" r="11" fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="3 2" />
        <circle cx="120" cy="45" r="6" fill="#2563eb" />
        <circle cx="176" cy="76" r="11" fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="3 2" />
        <polygon points="176,69 183,76 176,83 169,76" fill="#ea580c" />
        <polygon points="228,96 234,102 228,108 222,102" fill="#ea580c" />
      </svg>
    );
  }

  if (type === 'WIDE_VS_NARROW') {
    return (
      <svg viewBox="0 0 280 120" className="w-full max-w-[280px] h-28 rounded-xl bg-[#f8faff] border border-[#dae2fd]" aria-hidden="true">
        <polygon points="40,110 230,10 265,28 75,120" fill="#10b981" fillOpacity="0.16" />
        <line x1="55" y1="116" x2="248" y2="18" stroke="#059669" strokeWidth="3" />
        <line x1="120" y1="115" x2="155" y2="10" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="65" cy="36" r="6" fill="#2563eb" />
        <circle cx="95" cy="52" r="6" fill="#2563eb" />
        <circle cx="122" cy="34" r="6" fill="#2563eb" />
        <polygon points="195,82 202,89 195,96 188,89" fill="#ea580c" />
        <polygon points="225,70 232,77 225,84 218,77" fill="#ea580c" />
        <polygon points="168,94 175,101 168,108 161,101" fill="#ea580c" />
      </svg>
    );
  }

  if (type === 'REGRESSION_VS_SVM') {
    return (
      <svg viewBox="0 0 280 120" className="w-full max-w-[280px] h-28 rounded-xl bg-[#f8faff] border border-[#dae2fd]" aria-hidden="true">
        {/* Red trend line crossing through points */}
        <line x1="25" y1="22" x2="255" y2="102" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5 4" />
        {/* Green SVM fence separating groups */}
        <line x1="40" y1="108" x2="240" y2="14" stroke="#059669" strokeWidth="3" />
        <circle cx="60" cy="38" r="6" fill="#2563eb" />
        <circle cx="95" cy="48" r="6" fill="#2563eb" />
        <circle cx="122" cy="30" r="6" fill="#2563eb" />
        <polygon points="180,82 187,89 180,96 173,89" fill="#ea580c" />
        <polygon points="220,74 227,81 220,88 213,81" fill="#ea580c" />
        <text x="28" y="16" fontSize="10" fill="#dc2626" fontWeight="700">Tendencia</text>
        <text x="192" y="20" fontSize="10" fill="#059669" fontWeight="700">Cerca SVM</text>
      </svg>
    );
  }

  if (type === 'HIGH_C_OVERFIT' || type === 'OUTLIER_C' || type === 'SPAM_FILTER') {
    return (
      <svg viewBox="0 0 280 120" className="w-full max-w-[280px] h-28 rounded-xl bg-[#f8faff] border border-[#dae2fd]" aria-hidden="true">
        <line x1="138" y1="10" x2="138" y2="112" stroke="#059669" strokeWidth="3" />
        <line x1="110" y1="10" x2="110" y2="112" stroke="#059669" strokeWidth="1.5" strokeDasharray="4 4" />
        <line x1="166" y1="10" x2="166" y2="112" stroke="#059669" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="46" cy="34" r="6" fill="#2563eb" />
        <circle cx="72" cy="76" r="6" fill="#2563eb" />
        <circle cx="96" cy="44" r="6" fill="#2563eb" />
        {/* Infiltrator orange inside blue zone */}
        <circle cx="88" cy="84" r="11" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
        <polygon points="88,77 95,84 88,91 81,84" fill="#ea580c" />
        <polygon points="190,34 197,41 190,48 183,41" fill="#ea580c" />
        <polygon points="222,74 229,81 222,88 215,81" fill="#ea580c" />
        <polygon points="244,44 251,51 244,58 237,51" fill="#ea580c" />
      </svg>
    );
  }

  // ISLAND_3D
  return (
    <svg viewBox="0 0 280 120" className="w-full max-w-[280px] h-28 rounded-xl bg-[#0f172a] border border-[#334155]" aria-hidden="true">
      {/* Green cutting sheet */}
      <polygon points="40,68 140,42 240,68 140,94" fill="#10b981" fillOpacity="0.32" stroke="#34d399" strokeWidth="2" />
      {/* Elevated blue island */}
      <circle cx="140" cy="30" r="6.5" fill="#60a5fa" />
      <circle cx="122" cy="38" r="6" fill="#60a5fa" />
      <circle cx="158" cy="38" r="6" fill="#60a5fa" />
      {/* Lower orange ring */}
      <polygon points="78,84 84,90 78,96 72,90" fill="#fb923c" />
      <polygon points="202,84 208,90 202,96 196,90" fill="#fb923c" />
      <polygon points="140,98 146,104 140,110 134,104" fill="#fb923c" />
      <text x="12" y="20" fontSize="10" fill="#6ee7b7" fontWeight="700">Corte plano en 3D</text>
    </svg>
  );
}

export const KnowledgeQuizView: React.FC<KnowledgeQuizViewProps> = ({
  savedResult,
  onCompleteQuiz,
  onPracticeNodeInLab,
}) => {
  const [mode, setMode] = useState<'ACTIVE' | 'SUMMARY'>(savedResult ? 'SUMMARY' : 'ACTIVE');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [revealedCurrent, setRevealedCurrent] = useState<boolean>(false);

  const currentQuestion = SVM_QUIZ_QUESTIONS[currentIdx];
  const chosenOptionId = selectedAnswers[currentQuestion.id];
  const isCurrentCorrect = chosenOptionId === currentQuestion.correctOptionId;

  const handleChooseOption = (optionId: string) => {
    if (revealedCurrent) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
    setRevealedCurrent(true);
  };

  const handleNextOrFinish = () => {
    if (currentIdx + 1 < SVM_QUIZ_QUESTIONS.length) {
      setCurrentIdx((i) => i + 1);
      setRevealedCurrent(false);
      return;
    }

    // Compute final score and per-node breakdown
    const nodeScores: Record<NodeId, { correct: number; total: number }> = {
      N1_SV: { correct: 0, total: 0 },
      N2_MARGIN: { correct: 0, total: 0 },
      N3_CPARAM: { correct: 0, total: 0 },
      N4_KERNEL: { correct: 0, total: 0 },
    };

    let correctCount = 0;
    for (const q of SVM_QUIZ_QUESTIONS) {
      nodeScores[q.nodeId].total += 1;
      if (selectedAnswers[q.id] === q.correctOptionId) {
        correctCount += 1;
        nodeScores[q.nodeId].correct += 1;
      }
    }

    const scorePercent = Math.round((correctCount / SVM_QUIZ_QUESTIONS.length) * 100);
    const badge = computeQuizBadge(scorePercent);

    const result: QuizAttemptResult = {
      completedAtIso: new Date().toISOString(),
      totalQuestions: SVM_QUIZ_QUESTIONS.length,
      correctCount,
      scorePercent,
      answersByQuestionId: selectedAnswers,
      nodeScores,
      badgeTitle: badge.title,
    };

    onCompleteQuiz(result);
    setMode('SUMMARY');
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setCurrentIdx(0);
    setRevealedCurrent(false);
    setMode('ACTIVE');
  };

  if (mode === 'SUMMARY' && savedResult) {
    const badge = computeQuizBadge(savedResult.scorePercent);
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5" data-testid="quiz-summary">
        <section className="bg-white rounded-2xl border border-[#dae2fd] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#d1fae5] text-[#006243] font-mono text-xs font-bold">
              <Award className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Evaluación guardada · {badge.title}</span>
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#131b2e]">
              Tu Resultado: {savedResult.correctCount} de {savedResult.totalQuestions} ({savedResult.scorePercent}%)
            </h1>
            <p className="text-sm text-[#434655] max-w-xl">{badge.message}</p>
          </div>

          <button
            type="button"
            onClick={handleRetake}
            className="px-4 py-2.5 rounded-xl bg-[#004ac6] hover:bg-[#003ea8] text-white font-display text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-center cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Volver a intentar</span>
          </button>
        </section>

        <section className="bg-white rounded-2xl border border-[#dae2fd] p-5 space-y-3.5">
          <h2 className="font-display text-lg font-bold text-[#131b2e]">
            ¿Cómo te fue en cada idea clave?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(NODE_LABELS) as NodeId[]).map((nodeId) => {
              const info = NODE_LABELS[nodeId];
              const stat = savedResult.nodeScores[nodeId] ?? { correct: 0, total: 2 };
              const perfect = stat.correct === stat.total;
              return (
                <div
                  key={nodeId}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                    perfect
                      ? 'bg-[#ecfdf5] border-[#a7f3d0]'
                      : 'bg-[#f2f3ff] border-[#dae2fd]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold text-[#131b2e]">
                      {info.title}
                    </span>
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                        perfect
                          ? 'bg-[#d1fae5] text-[#006243]'
                          : 'bg-white text-[#004ac6]'
                      }`}
                    >
                      {stat.correct}/{stat.total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#434655]">
                    <span>{perfect ? '¡Idea súper clara!' : 'Puedes reforzarlo probando en el mapa'}</span>
                    <button
                      type="button"
                      onClick={() => onPracticeNodeInLab(info.tier)}
                      className="font-display font-semibold text-[#004ac6] hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Practicar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5" data-testid="quiz-active">
      {/* Header + Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="font-mono text-xs font-semibold text-[#004ac6]">
            Evaluación Rápida · Sin presión ni notas negativas
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#131b2e] mt-0.5">
            ¿Cuánto entendiste de SVM?
          </h1>
        </div>
        <div className="font-mono text-xs font-bold text-[#131b2e] bg-[#f2f3ff] border border-[#dae2fd] px-3 py-1.5 rounded-lg self-start sm:self-auto">
          Pregunta {currentIdx + 1} de {SVM_QUIZ_QUESTIONS.length}
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2.5 rounded-full bg-[#e2e7ff] overflow-hidden">
        <div
          className="h-full bg-[#004ac6] transition-all duration-300"
          style={{
            width: `${((currentIdx + (revealedCurrent ? 1 : 0)) / SVM_QUIZ_QUESTIONS.length) * 100}%`,
          }}
        />
      </div>

      {/* Question Card */}
      <article className="bg-white rounded-2xl border border-[#dae2fd] p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#dbe1ff] text-[#004ac6] font-mono text-[11px] font-bold">
              {currentQuestion.topicLabel}
            </span>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#131b2e] leading-snug">
              {currentQuestion.prompt}
            </h2>
          </div>
          <QuizMiniDiagram type={currentQuestion.diagram} />
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {currentQuestion.options.map((opt) => {
            const isSelected = chosenOptionId === opt.id;
            const isCorrectOpt = opt.id === currentQuestion.correctOptionId;

            let btnStyle =
              'bg-[#faf8ff] border-[#dae2fd] hover:bg-[#f2f3ff] text-[#131b2e]';
            if (revealedCurrent) {
              if (isCorrectOpt) {
                btnStyle = 'bg-[#ecfdf5] border-[#059669] text-[#002114] font-semibold';
              } else if (isSelected && !isCorrectOpt) {
                btnStyle = 'bg-[#fef2f2] border-[#dc2626] text-[#7f1d1d]';
              } else {
                btnStyle = 'bg-white border-[#eaedff] text-[#64748b] opacity-75';
              }
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={revealedCurrent}
                onClick={() => handleChooseOption(opt.id)}
                className={`w-full p-3.5 rounded-xl border text-left text-sm leading-snug flex items-center justify-between gap-3 transition-colors ${btnStyle} ${
                  revealedCurrent ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white border border-[#dae2fd] font-mono text-xs font-bold flex items-center justify-center shrink-0 uppercase text-[#004ac6]">
                    {opt.id}
                  </span>
                  <span>{opt.label}</span>
                </span>
                {revealedCurrent && isCorrectOpt && (
                  <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" aria-hidden="true" />
                )}
                {revealedCurrent && isSelected && !isCorrectOpt && (
                  <XCircle className="w-5 h-5 text-[#dc2626] shrink-0" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Formative Feedback */}
        {revealedCurrent && (
          <div
            data-testid="quiz-feedback"
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isCurrentCorrect
                ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#002114]'
                : 'bg-[#fffbeb] border-[#fde68a] text-[#78350f]'
            }`}
          >
            <div className="space-y-1 text-sm">
              <div className="font-display font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isCurrentCorrect ? '¡Muy bien!' : 'Buen intento, mira por qué:'}</span>
              </div>
              <p className="leading-snug">{currentQuestion.explanation}</p>
            </div>
            <button
              type="button"
              onClick={handleNextOrFinish}
              className="px-4 py-2.5 rounded-xl bg-[#004ac6] hover:bg-[#003ea8] text-white font-display text-sm font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer self-end sm:self-center"
            >
              <span>
                {currentIdx + 1 < SVM_QUIZ_QUESTIONS.length
                  ? 'Siguiente pregunta'
                  : 'Ver mi resultado'}
              </span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </article>
    </div>
  );
};
