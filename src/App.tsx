import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ShieldCheck,
  ClipboardList,
  Contrast,
  Lock,
} from 'lucide-react';
import type {
  AppView,
  CounterexampleCommand,
  DataPoint2D,
  DatasetTier,
  DialogueTurn,
  KernelType,
  MissionId,
  MissionStepProgress,
  QuizAttemptResult,
  SessionProfileVector,
  TeacherAlertPayload,
  TelemetryEvent,
  TelemetryEventType,
} from './types/svm';
import { getPresetDataset, trainSvmModel } from './lib/svmEngine';
import {
  ACTIVE_SILENCE_INITIAL_SECONDS,
  INACTIVITY_STALL_SECONDS,
  MAX_DIALOGUE_WINDOW,
  MAX_TELEMETRY_WINDOW,
  applyCanvasTelemetryToProfile,
  createInitialSessionProfile,
  generateEphemeralSessionToken,
  processStudentDialogue,
  sanitizePII,
} from './lib/mocaviEngine';
import {
  GUIDED_MISSIONS,
  getMissionById,
  getNextMissionId,
  type GuidedMissionDef,
} from './data/missions';
import {
  PROGRESS_SCHEMA_VERSION,
  clearStudentProgress,
  evaluateMissionStepsFromDialogue,
  evaluateMissionStepsFromTelemetry,
  loadStudentProgress,
  saveStudentProgress,
} from './lib/progressStore';
import { SvmCanvasLab } from './components/SvmCanvasLab';
import { MocaviTutorPanel } from './components/MocaviTutorPanel';
import { TeacherPanelModal } from './components/TeacherPanelModal';
import { GuidedChallengesView } from './components/GuidedChallengesView';
import { GeometricGlossaryView } from './components/GeometricGlossaryView';
import { KnowledgeQuizView } from './components/KnowledgeQuizView';

const INITIAL_TUTOR_TURNS: DialogueTurn[] = [
  {
    turnId: 1,
    sender: 'TUTOR',
    timestampMs: Date.now() - 2000,
    tag: '¡Bienvenido! · Explorador SVM',
    text: '¡Hola! La línea verde intenta abrir la calle más ancha posible entre el equipo Azul y el Naranja. Si mueves un punto azul lejano del fondo, ¿crees que la calle verde se mueve o se queda quieta?',
  },
];

function describeTelemetryAction(evt: TelemetryEvent): string {
  switch (evt.type) {
    case 'POINT_DRAGGED_INTERIOR':
      return `Movió punto lejano (cambio de ángulo ${(evt.payload.hyperplaneDeltaAngle ?? 0).toFixed(1)}°)`;
    case 'POINT_DRAGGED_SV':
      return `Movió un punto clave con anillo violeta (ancho actual ${evt.payload.marginWidth.toFixed(2)})`;
    case 'POINT_ADDED':
      return 'Agregó un punto nuevo en el mapa';
    case 'POINT_REMOVED':
      return 'Eliminó un punto del mapa';
    case 'POINT_ON_HYPERPLANE':
      return 'Colocó un punto justo encima de la línea verde';
    case 'C_SLIDER_CHANGED':
      return `Ajustó Rigidez C a ${evt.payload.cValue.toFixed(1)} (ancho ${evt.payload.marginWidth.toFixed(2)})`;
    case 'KERNEL_SWITCHED':
      return `Cambió la forma de frontera a ${evt.payload.kernel}`;
    case 'VIEW_3D_TOGGLED':
      return 'Abrió la Vista 3D interactiva';
    case 'DATASET_TIER_LOADED':
      return 'Cambió de mapa de prueba';
    default:
      return evt.type;
  }
}

export default function App() {
  const persisted = useMemo(() => loadStudentProgress(), []);

  const [sessionIdentity, setSessionIdentity] = useState(
    () => persisted?.sessionIdentity ?? generateEphemeralSessionToken()
  );
  const [profile, setProfile] = useState<SessionProfileVector>(
    () =>
      persisted?.profile ??
      createInitialSessionProfile({
        token: sessionIdentity.token,
        stationLabel: sessionIdentity.stationLabel,
      })
  );

  // Navigation, Accessibility & Mission Continuity State (Persisted in localStorage, Zero PII)
  const [activeView, setActiveView] = useState<AppView>('lab');
  const [mobilePane, setMobilePane] = useState<'canvas' | 'tutor'>('canvas');
  const [highContrast, setHighContrast] = useState<boolean>(
    () => persisted?.highContrast ?? false
  );
  const [teacherModalOpen, setTeacherModalOpen] = useState<boolean>(false);

  const [activeMissionId, setActiveMissionId] = useState<MissionId | null>(
    () => persisted?.activeMissionId ?? 'mission-1'
  );
  const [missionSteps, setMissionSteps] = useState<MissionStepProgress>(
    () => persisted?.missionSteps ?? {}
  );
  const [completedMissionIds, setCompletedMissionIds] = useState<MissionId[]>(
    () => persisted?.completedMissionIds ?? []
  );
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(
    () => persisted?.quizResult ?? null
  );

  // Real Mathematical SVM State
  const [activeTier, setActiveTier] = useState<DatasetTier>(
    () => persisted?.profile?.activeTier ?? 'TIER_1_LINEAR'
  );
  const [points, setPoints] = useState<DataPoint2D[]>(
    () => getPresetDataset(persisted?.profile?.activeTier ?? 'TIER_1_LINEAR').points
  );
  const [cParam, setCParam] = useState<number>(
    () => getPresetDataset(persisted?.profile?.activeTier ?? 'TIER_1_LINEAR').defaultC
  );
  const [kernel, setKernel] = useState<KernelType>(
    () => getPresetDataset(persisted?.profile?.activeTier ?? 'TIER_1_LINEAR').defaultKernel
  );
  const [is3DView, setIs3DView] = useState<boolean>(false);

  // Dual Memory & Socratic State
  const [dialogue, setDialogue] = useState<DialogueTurn[]>(
    () => (persisted?.dialogue?.length ? persisted.dialogue : INITIAL_TUTOR_TURNS)
  );
  const [isTutorThinking, setIsTutorThinking] = useState<boolean>(false);
  const [lastStudentMessage, setLastStudentMessage] = useState<string>('');
  const [telemetryBuffer, setTelemetryBuffer] = useState<TelemetryEvent[]>([]);
  const [teacherAlerts, setTeacherAlerts] = useState<TeacherAlertPayload[]>([]);
  const [counterexample, setCounterexample] = useState<CounterexampleCommand | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [silenceSeconds, setSilenceSeconds] = useState<number>(ACTIVE_SILENCE_INITIAL_SECONDS);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);

  const inactivitySecRef = useRef<number>(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counterexampleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTurnIdRef = useRef<number>(
    (persisted?.dialogue?.reduce((max, t) => Math.max(max, t.turnId), 1) ?? 1) + 1
  );

  const activeMission = useMemo(() => getMissionById(activeMissionId), [activeMissionId]);

  // Train real Soft-Margin Dual SMO SVM instantaneously (< 5ms)
  const model = useMemo(
    () => trainSvmModel(points, kernel, cParam, activeTier),
    [points, kernel, cParam, activeTier]
  );

  // Sync high contrast class on document root
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  // Auto-save student progress to localStorage (Zero PII)
  useEffect(() => {
    saveStudentProgress({
      version: PROGRESS_SCHEMA_VERSION,
      sessionIdentity,
      profile,
      dialogue: dialogue.slice(-14),
      activeMissionId,
      missionSteps,
      completedMissionIds,
      quizResult,
      highContrast,
      savedAtMs: Date.now(),
    });
  }, [
    sessionIdentity,
    profile,
    dialogue,
    activeMissionId,
    missionSteps,
    completedMissionIds,
    quizResult,
    highContrast,
  ]);

  // Active Silence countdown (18s) + 45s gentle nudge
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDraggingCanvas || teacherModalOpen || activeView !== 'lab' || isTutorThinking) return;

      setSilenceSeconds((prev) => (prev > 0 ? prev - 1 : 0));

      inactivitySecRef.current += 1;
      if (inactivitySecRef.current === INACTIVITY_STALL_SECONDS) {
        setDialogue((prev) => {
          const last = prev[prev.length - 1];
          if (last?.tag === 'Pista Suave · Silencio Activo') return prev;
          return [
            ...prev,
            {
              turnId: nextTurnIdRef.current++,
              sender: 'TUTOR',
              timestampMs: Date.now(),
              tag: 'Pista Suave · Silencio Activo',
              hintTier: 1,
              text: '¡Tómate tu tiempo! Prueba arrastrar uno de los puntos que tienen anillo violeta hacia el centro: ¿ves cómo reacciona la calle verde?',
            },
          ];
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDraggingCanvas, teacherModalOpen, activeView, isTutorThinking]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const triggerVisualCounterexample = useCallback((cmd: CounterexampleCommand | null) => {
    if (counterexampleTimerRef.current) clearTimeout(counterexampleTimerRef.current);
    setCounterexample(cmd);
    if (cmd) {
      if (cmd.counterexampleType === 'ANIMATE_2D_TO_3D_ELEVATION') {
        setIs3DView(true);
      }
      counterexampleTimerRef.current = setTimeout(() => {
        setCounterexample(null);
      }, cmd.durationMs);
    }
  }, []);

  // Push telemetry into bounded FIFO window, update profile, AND auto-check active mission steps!
  const handleEmitTelemetry = useCallback(
    (type: TelemetryEventType, payload: TelemetryEvent['payload']) => {
      inactivitySecRef.current = 0;

      const evt: TelemetryEvent = {
        id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        timestampMs: Date.now(),
        type,
        payload,
      };

      setTelemetryBuffer((prev) => {
        const next = [...prev, evt];
        return next.length > MAX_TELEMETRY_WINDOW
          ? next.slice(next.length - MAX_TELEMETRY_WINDOW)
          : next;
      });

      setMissionSteps((prevSteps) => {
        const evaluated = evaluateMissionStepsFromTelemetry(prevSteps, activeMissionId, evt);
        if (evaluated.newlyCompletedSteps.length > 0) {
          setCompletedMissionIds(evaluated.completedMissionIds);
          showToast('¡Paso de misión completado y guardado!');
        }
        return evaluated.nextSteps;
      });

      setProfile((prev) => {
        const res = applyCanvasTelemetryToProfile(prev, evt);
        if (res.toastMessage) showToast(res.toastMessage);
        if (res.counterexample) triggerVisualCounterexample(res.counterexample);
        if (res.proactiveMessage) {
          setDialogue((dPrev) => [
            ...dPrev,
            {
              turnId: nextTurnIdRef.current++,
              sender: 'TUTOR',
              timestampMs: Date.now(),
              tag: res.proactiveTag ?? 'Observación en el Mapa',
              text: res.proactiveMessage!,
            },
          ]);
        }
        return res.updatedProfile;
      });
    },
    [activeMissionId, showToast, triggerVisualCounterexample]
  );

  // Switch scenario (Tier 1, Tier 2, Tier 3)
  const handleSelectTier = useCallback((tier: DatasetTier, customIntro?: string) => {
    const preset = getPresetDataset(tier);
    setActiveTier(tier);
    setPoints(preset.points);
    setCParam(preset.defaultC);
    setKernel(preset.defaultKernel);
    setIs3DView(false);
    setCounterexample(null);
    setSilenceSeconds(ACTIVE_SILENCE_INITIAL_SECONDS);
    inactivitySecRef.current = 0;

    setProfile((prev) => ({
      ...prev,
      activeTier: tier,
      scaffoldingPhase: 'EXPLORACION',
      cognitiveState: 'STATE_INITIAL_OBSERVATION',
      nodes: {
        ...prev.nodes,
        N3_CPARAM:
          tier === 'TIER_2_SOFT_MARGIN' && prev.nodes.N3_CPARAM.status === 'NO_INICIADO'
            ? { ...prev.nodes.N3_CPARAM, status: 'EN_PROGRESO', scenarioHint: 'Activo ahora' }
            : prev.nodes.N3_CPARAM,
        N4_KERNEL:
          tier === 'TIER_3_KERNEL_NONLINEAR' && prev.nodes.N4_KERNEL.status === 'NO_INICIADO'
            ? { ...prev.nodes.N4_KERNEL, status: 'EN_PROGRESO', scenarioHint: 'Activo ahora' }
            : prev.nodes.N4_KERNEL,
      },
    }));

    const tierIntros: Record<DatasetTier, string> = {
      TIER_1_LINEAR:
        'Mapa 1 listo: aquí una línea recta separa fácil ambos equipos. Prueba mover un punto lejano y luego uno con anillo violeta: ¿cuál movió la calle verde?',
      TIER_2_SOFT_MARGIN:
        'Mapa 2 listo: hay 2 infiltrados en el barrio contrario. Mueve el deslizador de Rigidez (C) entre Relajado y Estricto: ¿en qué zona queda la calle más segura?',
      TIER_3_KERNEL_NONLINEAR:
        'Mapa 3 listo: el equipo Azul es una isla rodeada de puntos Naranjas. Cambia a "Burbujas (Islas)" o pulsa "Ver en 3D": ¿cómo logra separarlos?',
    };

    setDialogue((prev) => [
      ...prev,
      {
        turnId: nextTurnIdRef.current++,
        sender: 'TUTOR',
        timestampMs: Date.now(),
        tag:
          tier === 'TIER_1_LINEAR'
            ? 'Mapa 1 · Fácil (Recta)'
            : tier === 'TIER_2_SOFT_MARGIN'
              ? 'Mapa 2 · Con Infiltrados'
              : 'Mapa 3 · Isla Rodeada',
        text: customIntro ?? tierIntros[tier],
      },
    ]);
  }, []);

  // Launch a guided mission cleanly with full continuity
  const handleStartMission = useCallback(
    (mission: GuidedMissionDef) => {
      setActiveMissionId(mission.id);
      handleSelectTier(mission.tier, mission.socraticIntro);
      setKernel(mission.kernel);
      setCParam(mission.cParam);
      setIs3DView(Boolean(mission.open3D));
      setActiveView('lab');
      setMobilePane('canvas');
    },
    [handleSelectTier]
  );

  const handleAdvanceNextMission = useCallback(() => {
    if (!activeMissionId) return;
    const nextId = getNextMissionId(activeMissionId);
    if (!nextId) {
      setActiveView('quiz');
      return;
    }
    const nextMission = getMissionById(nextId);
    if (nextMission) {
      handleStartMission(nextMission);
    }
  }, [activeMissionId, handleStartMission]);

  // Student sends message in Socratic chat -> MOCAVI guardrails + Real Server-Side Gemini 4 Hydrogen API
  const handleSendMessage = useCallback(
    async (rawMessage: string, isRetry = false) => {
      const sanitized = sanitizePII(rawMessage.trim());
      if (!sanitized || isTutorThinking) return;

      inactivitySecRef.current = 0;
      setSilenceSeconds(0);
      setLastStudentMessage(sanitized);

      // 1. Run deterministic MOCAVI pedagogical state machine (misconceptions, N1-N3 ladder, counterexamples, teacher alerts)
      const prevConsolidatedIds = new Set(
        Object.values(profile.nodes)
          .filter((n) => n.status === 'CONSOLIDADO')
          .map((n) => n.id)
      );
      const mocaviResult = processStudentDialogue(profile, telemetryBuffer, sanitized);
      setProfile(mocaviResult.updatedProfile);

      const newlyConsolidatedNode = Object.values(mocaviResult.updatedProfile.nodes).find(
        (n) => n.status === 'CONSOLIDADO' && !prevConsolidatedIds.has(n.id)
      );

      // Auto-check mission reflection step
      setMissionSteps((prevSteps) => {
        const evaluated = evaluateMissionStepsFromDialogue(
          prevSteps,
          activeMissionId,
          sanitized
        );
        if (evaluated.newlyCompletedSteps.length > 0) {
          setCompletedMissionIds(evaluated.completedMissionIds);
        }
        return evaluated.nextSteps;
      });

      if (mocaviResult.counterexampleCommand) {
        triggerVisualCounterexample(mocaviResult.counterexampleCommand);
        showToast(mocaviResult.counterexampleCommand.caption);
      }

      if (mocaviResult.teacherAlert) {
        setTeacherAlerts((prev) => [mocaviResult.teacherAlert!, ...prev]);
      }

      // Append student bubble immediately (skip duplicate student bubble on retry)
      if (!isRetry) {
        const studentTurn: DialogueTurn = {
          turnId: nextTurnIdRef.current++,
          sender: 'STUDENT',
          text: sanitized,
          timestampMs: Date.now(),
        };
        setDialogue((prev) => [...prev, studentTurn]);
      } else {
        // Remove previous error bubble before retrying
        setDialogue((prev) => prev.filter((t, idx) => !(idx === prev.length - 1 && t.isError)));
      }

      // 2. Ask server-side Gemini 4 Hydrogen Socratic tutor (/api/tutor) for a genuinely contextual 9th-grade response
      setIsTutorThinking(true);
      try {
        const tierLabel =
          activeTier === 'TIER_1_LINEAR'
            ? 'Mapa 1: Fácil (dos grupos separables con recta)'
            : activeTier === 'TIER_2_SOFT_MARGIN'
              ? 'Mapa 2: Con 2 infiltrados en el barrio contrario'
              : 'Mapa 3: Isla azul central rodeada por anillo naranja';

        const kernelLabel =
          kernel === 'LINEAR'
            ? 'Línea Recta'
            : kernel === 'POLY'
              ? 'Curva Suave (Polinomial)'
              : 'Burbujas / Islas (RBF)';

        const nextStepObj = activeMission?.steps.find((s) => !missionSteps[s.id]);

        const resp = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentMessage: sanitized,
            history: dialogue.slice(-6).map((t) => ({ sender: t.sender, text: t.text })),
            canvasContext: {
              tierLabel,
              kernelLabel,
              cParam,
              marginWidth: model.marginWidth,
              svCount: model.supportVectorIds.length,
              trainAccuracy: model.trainAccuracy,
              hiddenTestAccuracy: model.hiddenTestAccuracy,
              is3DView,
              activeMissionTitle: activeMission
                ? `Misión ${activeMission.order}: ${activeMission.title}`
                : null,
              nextMissionStep: nextStepObj?.label ?? null,
            },
            recentActions: telemetryBuffer.slice(-4).map(describeTelemetryAction),
            pedagogicalSignal: {
              detectedMisconception: mocaviResult.detectedMisconception,
              hintTier: mocaviResult.hintTier,
              counterexampleCaption: mocaviResult.counterexampleCommand?.caption ?? null,
              asksDirectAnswer:
                mocaviResult.tag.includes('Autonomía Cognitiva') ||
                mocaviResult.updatedProfile.cognitiveState === 'STATE_FRUSTRATION_OR_SHORTCUT',
              isFrustrated: mocaviResult.tag.includes('Contención Empática'),
              nodeJustConsolidated: newlyConsolidatedNode?.shortTitle ?? null,
              teacherAlertTriggered: Boolean(mocaviResult.teacherAlert),
            },
          }),
        });

        const data = (await resp.json().catch(() => ({}))) as {
          reply?: string;
          error?: string;
        };

        if (!resp.ok || !data.reply) {
          throw new Error(
            data.error ||
              'No pudimos conectar con el tutor en este momento. Intenta enviar tu pregunta de nuevo.'
          );
        }

        const tutorTurn: DialogueTurn = {
          turnId: nextTurnIdRef.current++,
          sender: 'TUTOR',
          text: data.reply,
          timestampMs: Date.now(),
          tag: newlyConsolidatedNode
            ? `¡Idea Dominada! · ${newlyConsolidatedNode.shortTitle}`
            : mocaviResult.counterexampleCommand
              ? 'Pista Visual Automática (N3)'
              : mocaviResult.detectedMisconception !== 'NONE'
                ? `Pista N${mocaviResult.hintTier} · Tutor Socrático`
                : 'Tutor SVM MOCAVI',
          hintTier: mocaviResult.hintTier,
          detectedMisconception: mocaviResult.detectedMisconception,
          counterexampleTriggered: mocaviResult.counterexampleCommand?.counterexampleType ?? null,
        };
        setDialogue((prev) => [...prev, tutorTurn]);
      } catch (err: unknown) {
        const errorText =
          err instanceof Error
            ? err.message
            : 'No se pudo obtener respuesta del tutor. Intenta de nuevo.';
        setDialogue((prev) => [
          ...prev,
          {
            turnId: nextTurnIdRef.current++,
            sender: 'TUTOR',
            text: errorText,
            timestampMs: Date.now(),
            tag: 'Error de conexión con el tutor',
            isError: true,
          },
        ]);
      } finally {
        setIsTutorThinking(false);
      }
    },
    [
      isTutorThinking,
      profile,
      telemetryBuffer,
      activeMissionId,
      activeMission,
      missionSteps,
      activeTier,
      kernel,
      cParam,
      model.marginWidth,
      model.supportVectorIds.length,
      model.trainAccuracy,
      model.hiddenTestAccuracy,
      is3DView,
      dialogue,
      triggerVisualCounterexample,
      showToast,
    ]
  );

  const handleCParamChange = useCallback(
    (val: number) => {
      setCParam(val);
      handleEmitTelemetry('C_SLIDER_CHANGED', {
        marginWidth: model.marginWidth,
        svCount: model.supportVectorIds.length,
        cValue: val,
        kernel,
      });
    },
    [handleEmitTelemetry, model.marginWidth, model.supportVectorIds.length, kernel]
  );

  const handleKernelChange = useCallback(
    (nextKernel: KernelType) => {
      setKernel(nextKernel);
      handleEmitTelemetry('KERNEL_SWITCHED', {
        marginWidth: model.marginWidth,
        svCount: model.supportVectorIds.length,
        cValue: cParam,
        kernel: nextKernel,
      });
    },
    [handleEmitTelemetry, model.marginWidth, model.supportVectorIds.length, cParam]
  );

  const handleToggle3D = useCallback(() => {
    setIs3DView((prev) => {
      const next = !prev;
      if (next) {
        handleEmitTelemetry('VIEW_3D_TOGGLED', {
          marginWidth: model.marginWidth,
          svCount: model.supportVectorIds.length,
          cValue: cParam,
          kernel,
        });
      }
      return next;
    });
  }, [handleEmitTelemetry, model.marginWidth, model.supportVectorIds.length, cParam, kernel]);

  const handleResetScene = useCallback(() => {
    const preset = getPresetDataset(activeTier);
    setPoints(preset.points);
    setCParam(preset.defaultC);
    setKernel(preset.defaultKernel);
    setIs3DView(false);
    setCounterexample(null);
    setSilenceSeconds(ACTIVE_SILENCE_INITIAL_SECONDS);
    setProfile((prev) => ({
      ...prev,
      metrics: { ...prev.metrics, resetClicks: prev.metrics.resetClicks + 1 },
    }));
    showToast('Mapa restaurado a su forma original.');
  }, [activeTier, showToast]);

  const handleResetAllProgress = useCallback(() => {
    clearStudentProgress();
    const freshIdentity = generateEphemeralSessionToken();
    setSessionIdentity(freshIdentity);
    setProfile(
      createInitialSessionProfile({
        token: freshIdentity.token,
        stationLabel: freshIdentity.stationLabel,
      })
    );
    setDialogue(INITIAL_TUTOR_TURNS);
    setActiveMissionId('mission-1');
    setMissionSteps({});
    setCompletedMissionIds([]);
    setQuizResult(null);
    setTeacherAlerts([]);
    setTelemetryBuffer([]);
    const preset = getPresetDataset('TIER_1_LINEAR');
    setActiveTier('TIER_1_LINEAR');
    setPoints(preset.points);
    setCParam(preset.defaultC);
    setKernel(preset.defaultKernel);
    setIs3DView(false);
    showToast('Progreso reiniciado desde cero.');
  }, [showToast]);

  const dialogueWindowFifo = useMemo(() => dialogue.slice(-MAX_DIALOGUE_WINDOW), [dialogue]);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8ff] text-[#131b2e]">
      {/* UNIFIED TOP HEADER */}
      <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-[#dae2fd]">
        <div className="max-w-[1560px] mx-auto h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          {/* Zone 1: Brand Lockup */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#004ac6] to-[#0053db] text-white flex items-center justify-center shadow-xs shrink-0">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="6" cy="6" fill="currentColor" fillOpacity="0.28" r="2.8" />
                <circle cx="18" cy="18" fill="currentColor" fillOpacity="0.28" r="2.8" />
                <line strokeWidth="2.4" x1="3" x2="21" y1="21" y2="3" />
                <line strokeDasharray="2 2" strokeWidth="1.4" x1="7" x2="21" y1="21" y2="7" />
                <line strokeDasharray="2 2" strokeWidth="1.4" x1="3" x2="17" y1="17" y2="3" />
              </svg>
            </div>
            <div className="leading-tight min-w-0">
              <span className="font-display text-[14px] sm:text-[16px] font-bold text-[#131b2e] tracking-tight block truncate">
                Explorador SVM
              </span>
              <span className="font-mono text-[10.5px] sm:text-[11px] text-[#434655] block truncate">
                Tutor MOCAVI · Grado 9°
              </span>
            </div>
          </div>

          {/* Zone 2: Primary Navigation (4 Kid-Friendly Tabs) */}
          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-1 bg-[#f2f3ff] p-1 rounded-xl"
          >
            {(
              [
                { id: 'lab', label: 'Explorar' },
                { id: 'challenges', label: `Misiones (${completedMissionIds.length}/4)` },
                { id: 'glossary', label: 'Mini-Guía' },
                {
                  id: 'quiz',
                  label: quizResult
                    ? `Evaluación (${quizResult.correctCount}/${quizResult.totalQuestions})`
                    : 'Evaluación',
                },
              ] as const
            ).map((navItem) => {
              const active = activeView === navItem.id;
              return (
                <button
                  key={navItem.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setActiveView(navItem.id)}
                  className={`px-3.5 py-1.5 rounded-lg font-display text-[13px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#2563eb] text-white shadow-2xs'
                      : 'text-[#434655] hover:text-[#131b2e] hover:bg-[#e2e7ff]/70'
                  }`}
                >
                  {navItem.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Teacher Panel CTA + Working High-Contrast Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="hidden xl:inline-flex items-center gap-1.5 text-xs text-[#006243] font-medium mr-1 whitespace-nowrap">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Cero PII</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-semibold">{sessionIdentity.displayId}</span>
            </span>

            <button
              type="button"
              onClick={() => setTeacherModalOpen(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#283044] hover:bg-[#131b2e] text-[#eef0ff] font-display text-[12px] sm:text-[13px] font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-[#85f8c4] shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Panel Docente</span>
              <span className="sm:hidden">Docente</span>
              {teacherAlerts.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-[#fd651e] text-white font-mono text-[10px] font-bold">
                  {teacherAlerts.length}
                </span>
              )}
            </button>

            <button
              type="button"
              data-testid="high-contrast-toggle"
              onClick={() => setHighContrast((v) => !v)}
              aria-pressed={highContrast}
              aria-label="Alternar modo de alto contraste"
              title={highContrast ? 'Desactivar Alto Contraste' : 'Activar Alto Contraste (WCAG AAA)'}
              className={`px-2.5 py-2 rounded-xl border font-display text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                highContrast
                  ? 'bg-[#facc15] text-[#000000] border-[#ffffff]'
                  : 'bg-[#f2f3ff] text-[#131b2e] border-[#dae2fd] hover:bg-[#e2e7ff]'
              }`}
            >
              <Contrast className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline">{highContrast ? 'Contraste ON' : 'Contraste'}</span>
            </button>
          </div>
        </div>

        {/* Mobile View Navigation Strip */}
        <div className="md:hidden border-t border-[#eaedff] px-2 py-1.5 grid grid-cols-4 gap-1 bg-white">
          {(
            [
              { id: 'lab', label: 'Explorar' },
              { id: 'challenges', label: `Misiones ${completedMissionIds.length}/4` },
              { id: 'glossary', label: 'Guía' },
              { id: 'quiz', label: 'Quiz' },
            ] as const
          ).map((navItem) => (
            <button
              key={navItem.id}
              type="button"
              onClick={() => setActiveView(navItem.id)}
              className={`py-1.5 px-1 rounded-lg font-display text-[11.5px] font-semibold text-center cursor-pointer truncate ${
                activeView === navItem.id
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-[#f2f3ff] text-[#434655]'
              }`}
            >
              {navItem.label}
            </button>
          ))}
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col">
        {activeView === 'lab' && (
          <div className="w-full max-w-[1560px] mx-auto px-3 sm:px-6 py-4 flex-1 flex flex-col gap-3">
            {/* Mobile Pane Switcher */}
            <div className="lg:hidden flex items-center gap-1 p-1 bg-[#f2f3ff] rounded-xl border border-[#dae2fd]">
              <button
                type="button"
                onClick={() => setMobilePane('canvas')}
                className={`flex-1 py-2 rounded-lg font-display text-xs font-semibold cursor-pointer ${
                  mobilePane === 'canvas'
                    ? 'bg-white text-[#004ac6] shadow-2xs'
                    : 'text-[#434655]'
                }`}
              >
                Mapa Interactivo 2D/3D
              </button>
              <button
                type="button"
                onClick={() => setMobilePane('tutor')}
                className={`flex-1 py-2 rounded-lg font-display text-xs font-semibold cursor-pointer ${
                  mobilePane === 'tutor'
                    ? 'bg-white text-[#004ac6] shadow-2xs'
                    : 'text-[#434655]'
                }`}
              >
                Tutor SVM ({dialogue.length})
              </button>
            </div>

            {/* 68% Lab / 32% Socratic Tutor Split */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 items-stretch">
              <div
                className={`${
                  mobilePane === 'canvas' ? 'flex' : 'hidden'
                } lg:flex flex-1 min-w-0`}
              >
                <SvmCanvasLab
                  activeTier={activeTier}
                  points={points}
                  model={model}
                  cParam={cParam}
                  kernel={kernel}
                  is3DView={is3DView}
                  highContrast={highContrast}
                  activeMission={activeMission}
                  missionSteps={missionSteps}
                  counterexample={counterexample}
                  toastMessage={toastMessage}
                  onSelectTier={(tier) => handleSelectTier(tier)}
                  onPointsChange={setPoints}
                  onCParamChange={handleCParamChange}
                  onKernelChange={handleKernelChange}
                  onToggle3D={handleToggle3D}
                  onResetScene={handleResetScene}
                  onEmitTelemetry={handleEmitTelemetry}
                  onDraggingStateChange={setIsDraggingCanvas}
                  onNextMission={handleAdvanceNextMission}
                  onOpenQuiz={() => setActiveView('quiz')}
                  onDismissMission={() => setActiveMissionId(null)}
                />
              </div>

              <div
                className={`${
                  mobilePane === 'tutor' ? 'flex' : 'hidden'
                } lg:flex lg:w-[32%] shrink-0`}
              >
                <div className="w-full flex flex-col">
                  <MocaviTutorPanel
                    profile={profile}
                    dialogue={dialogue}
                    silenceSeconds={silenceSeconds}
                    isDraggingCanvas={isDraggingCanvas}
                    isThinking={isTutorThinking}
                    onSendMessage={(msg) => void handleSendMessage(msg, false)}
                    onRetryLastQuestion={
                      lastStudentMessage
                        ? () => void handleSendMessage(lastStudentMessage, true)
                        : undefined
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'challenges' && (
          <GuidedChallengesView
            activeMissionId={activeMissionId}
            missionSteps={missionSteps}
            completedMissionIds={completedMissionIds}
            quizResult={quizResult}
            onStartMission={handleStartMission}
            onOpenQuiz={() => setActiveView('quiz')}
            onResetProgress={handleResetAllProgress}
          />
        )}

        {activeView === 'glossary' && (
          <GeometricGlossaryView
            onExploreInLab={(tier) => {
              handleSelectTier(tier);
              setActiveView('lab');
              setMobilePane('canvas');
            }}
          />
        )}

        {activeView === 'quiz' && (
          <KnowledgeQuizView
            savedResult={quizResult}
            onCompleteQuiz={(result) => {
              setQuizResult(result);
              showToast(
                `¡Evaluación guardada! Obtuviste ${result.correctCount}/${result.totalQuestions}.`
              );
            }}
            onPracticeNodeInLab={(tier) => {
              handleSelectTier(tier);
              setActiveView('lab');
              setMobilePane('canvas');
            }}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="w-full py-3 px-4 sm:px-6 border-t border-[#eaedff] bg-white">
        <div className="max-w-[1560px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-[#434655]">
          <div>Tutoría Inteligente MOCAVI · Aprende SVM experimentando (Grado 9°)</div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-[#006243] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Privacidad Estudiantil (Cero PII)</span>
            </span>
            <span>Progreso guardado localmente</span>
          </div>
        </div>
      </footer>

      {/* TEACHER PANEL MODAL (All 9 DAPI Documents 01-09 + Live Observability + Quiz Score) */}
      <TeacherPanelModal
        isOpen={teacherModalOpen}
        onClose={() => setTeacherModalOpen(false)}
        profile={profile}
        displaySessionId={sessionIdentity.displayId}
        model={model}
        telemetryBuffer={telemetryBuffer}
        dialogueBuffer={dialogueWindowFifo}
        teacherAlerts={teacherAlerts}
        silenceSeconds={silenceSeconds}
        completedMissionsCount={completedMissionIds.length}
        quizResult={quizResult}
      />
    </div>
  );
}
