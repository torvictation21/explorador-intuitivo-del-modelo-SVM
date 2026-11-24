import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Compass,
  ShieldAlert,
  Sliders,
  Box,
  Award,
  RotateCcw,
} from 'lucide-react';
import { GUIDED_MISSIONS, type GuidedMissionDef } from '../data/missions';
import type {
  MissionId,
  MissionStepProgress,
  QuizAttemptResult,
} from '../types/svm';

interface GuidedChallengesViewProps {
  activeMissionId: MissionId | null;
  missionSteps: MissionStepProgress;
  completedMissionIds: MissionId[];
  quizResult: QuizAttemptResult | null;
  onStartMission: (mission: GuidedMissionDef) => void;
  onOpenQuiz: () => void;
  onResetProgress: () => void;
}

const MISSION_ICONS: Record<MissionId, React.ReactNode> = {
  'mission-1': <Compass className="w-5 h-5 text-[#004ac6]" aria-hidden="true" />,
  'mission-2': <ShieldAlert className="w-5 h-5 text-[#006243]" aria-hidden="true" />,
  'mission-3': <Sliders className="w-5 h-5 text-[#a73a00]" aria-hidden="true" />,
  'mission-4': <Box className="w-5 h-5 text-[#7c3aed]" aria-hidden="true" />,
};

export const GuidedChallengesView: React.FC<GuidedChallengesViewProps> = ({
  activeMissionId,
  missionSteps,
  completedMissionIds,
  quizResult,
  onStartMission,
  onOpenQuiz,
  onResetProgress,
}) => {
  const totalSteps = GUIDED_MISSIONS.reduce((acc, m) => acc + m.steps.length, 0);
  const doneSteps = GUIDED_MISSIONS.reduce(
    (acc, m) => acc + m.steps.filter((s) => Boolean(missionSteps[s.id])).length,
    0
  );
  const progressPct = Math.round((doneSteps / totalSteps) * 100);

  // Recommend next incomplete mission so the student always has clear continuity
  const nextRecommended =
    GUIDED_MISSIONS.find((m) => !completedMissionIds.includes(m.id)) ?? GUIDED_MISSIONS[0];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Compact Header + Saved Progress Banner */}
      <div className="bg-white rounded-2xl border border-[#dae2fd] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <p className="font-mono text-xs text-[#004ac6] font-semibold">
            Tu progreso se guarda automáticamente en este equipo
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#131b2e]">
            Ruta de 4 Misiones para entender SVM
          </h1>
          <p className="text-sm text-[#434655]">
            Cada misión tiene 3 pasos cortos que se marcan solos mientras juegas en el simulador.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span
              data-testid="missions-progress-badge"
              className="font-mono text-xs font-bold text-[#006243] bg-[#d1fae5] px-3 py-1.5 rounded-lg tabular-nums"
            >
              {completedMissionIds.length}/4 Misiones · {progressPct}%
            </span>
            <button
              type="button"
              onClick={onResetProgress}
              title="Borrar progreso guardado y empezar desde cero"
              className="px-2.5 py-1.5 rounded-lg bg-[#f2f3ff] hover:bg-[#e2e7ff] text-[#434655] text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reiniciar</span>
            </button>
          </div>
          <div className="w-full sm:w-56 h-2 rounded-full bg-[#e2e7ff] overflow-hidden">
            <div
              className="h-full bg-[#059669] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4 Continuous Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GUIDED_MISSIONS.map((mission) => {
          const isCompleted = completedMissionIds.includes(mission.id);
          const isActive = activeMissionId === mission.id;
          const isRecommended = nextRecommended.id === mission.id && !isCompleted;
          const completedCount = mission.steps.filter((s) => Boolean(missionSteps[s.id])).length;

          return (
            <article
              key={mission.id}
              data-testid={`mission-card-${mission.id}`}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between gap-4 shadow-xs transition-colors ${
                isCompleted
                  ? 'border-[#a7f3d0]'
                  : isActive || isRecommended
                    ? 'border-[#004ac6] ring-1 ring-[#dbe1ff]'
                    : 'border-[#dae2fd]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#f2f3ff] flex items-center justify-center shrink-0">
                      {MISSION_ICONS[mission.id]}
                    </div>
                    <div>
                      <span className="font-mono text-[11px] font-bold text-[#004ac6]">
                        Misión {mission.order} · {mission.subtitle}
                      </span>
                      <h2 className="font-display text-base font-bold text-[#131b2e] leading-snug">
                        {mission.title}
                      </h2>
                    </div>
                  </div>
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#d1fae5] text-[#006243] font-mono text-[11px] font-bold shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Completada</span>
                    </span>
                  ) : isActive ? (
                    <span className="px-2 py-0.5 rounded-md bg-[#dbe1ff] text-[#004ac6] font-mono text-[11px] font-bold shrink-0">
                      En curso
                    </span>
                  ) : null}
                </div>

                <p className="text-[13.5px] text-[#334155] leading-snug">{mission.simpleGoal}</p>

                {/* Auto-checked Steps Checklist */}
                <ul className="space-y-1.5">
                  {mission.steps.map((step) => {
                    const checked = Boolean(missionSteps[step.id]);
                    return (
                      <li
                        key={step.id}
                        className={`flex items-start gap-2 text-[13px] leading-snug ${
                          checked ? 'text-[#006243]' : 'text-[#131b2e]'
                        }`}
                      >
                        {checked ? (
                          <CheckCircle2
                            className="w-4 h-4 text-[#059669] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            className="w-4 h-4 text-[#94a3b8] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                        )}
                        <span className={checked ? 'line-through opacity-80' : ''}>
                          {step.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="pt-3 border-t border-[#eaedff] flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-[#434655]">
                  Pasos listos: <strong className="text-[#131b2e]">{completedCount}/3</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onStartMission(mission)}
                  className="px-4 py-2 rounded-xl bg-[#004ac6] hover:bg-[#003ea8] text-white font-display text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>
                    {isCompleted
                      ? 'Repetir en Laboratorio'
                      : completedCount > 0 || isActive
                        ? 'Continuar Misión'
                        : 'Empezar Misión'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Step 5 Finale Card: Link straight to Knowledge Evaluation */}
      <section className="bg-[#f2f3ff] rounded-2xl border border-[#dae2fd] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#006243] text-white flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <span className="font-mono text-[11px] font-bold text-[#006243]">
              Paso Final · Evaluación de Conocimiento
            </span>
            <h2 className="font-display text-base font-bold text-[#131b2e]">
              {quizResult
                ? `Ya completaste la evaluación: ${quizResult.correctCount}/${quizResult.totalQuestions} (${quizResult.badgeTitle})`
                : '¿Listo para comprobar cuánto aprendiste sobre SVM?'}
            </h2>
            <p className="text-xs text-[#434655] mt-0.5">
              8 preguntas rápidas con dibujos y explicación inmediata. Tu resultado queda guardado.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenQuiz}
          className="px-4 py-2.5 rounded-xl bg-[#006243] hover:bg-[#059669] text-white font-display text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
        >
          <span>{quizResult ? 'Ver mi resultado' : 'Ir a la Evaluación'}</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </section>
    </div>
  );
};
