export type PointClass = 'A' | 'B';
export type KernelType = 'LINEAR' | 'POLY' | 'RBF';
export type DatasetTier =
  | 'TIER_1_LINEAR'
  | 'TIER_2_SOFT_MARGIN'
  | 'TIER_3_KERNEL_NONLINEAR';

export type ScaffoldingPhase =
  | 'EXPLORACION'
  | 'EXPLORACION_GUIADA'
  | 'DESESTABILIZACION'
  | 'TRANSFERENCIA';

export type NodeId = 'N1_SV' | 'N2_MARGIN' | 'N3_CPARAM' | 'N4_KERNEL';

export type MissionId = 'mission-1' | 'mission-2' | 'mission-3' | 'mission-4';

export type NodeStatus =
  | 'NO_INICIADO'
  | 'EN_PROGRESO'
  | 'EVIDENCIA_UNILATERAL'
  | 'EN_CONFLICTO'
  | 'CONSOLIDADO';

export type MasteryLevel = 'INICIAL' | 'BASICO' | 'AUTONOMO' | 'DESTACADO';

export type MisconceptionCode =
  | 'ERR_CENTROID'
  | 'ERR_RIGID_MARGIN'
  | 'ERR_REGRESSION'
  | 'ERR_2D_FIXATION';

export type CounterexampleType =
  | 'HIGHLIGHT_SUPPORT_VECTORS'
  | 'INJECT_OVERFIT_TEST_BURST'
  | 'COMPARE_FENCE_VS_TREND'
  | 'ANIMATE_2D_TO_3D_ELEVATION';

export type TelemetryEventType =
  | 'POINT_ADDED'
  | 'POINT_REMOVED'
  | 'POINT_DRAGGED_INTERIOR'
  | 'POINT_DRAGGED_SV'
  | 'POINT_ON_HYPERPLANE'
  | 'C_SLIDER_CHANGED'
  | 'KERNEL_SWITCHED'
  | 'VIEW_3D_TOGGLED'
  | 'DATASET_TIER_LOADED'
  | 'IDLE_THRESHOLD_REACHED';

export type StudentCognitiveState =
  | 'STATE_INITIAL_OBSERVATION'
  | 'STATE_FLUID_EXPLORATION'
  | 'STATE_AWAITING_STUDENT_TURN'
  | 'STATE_COGNITIVE_STALL'
  | 'STATE_SYSTEMATIC_ERROR'
  | 'STATE_FRUSTRATION_OR_SHORTCUT';

export type AppView = 'lab' | 'challenges' | 'glossary' | 'quiz';

export type HighlightLayer = 'ALL' | 'CLASS_A' | 'CLASS_B' | 'SV' | 'HYPERPLANE';

export interface DataPoint2D {
  id: string;
  x: number;
  y: number;
  cls: PointClass;
  isSupportVector?: boolean;
  isMarginViolator?: boolean;
  isTestBurst?: boolean;
  alpha?: number;
}

export interface SvmModelState {
  weights: [number, number];
  bias: number;
  alphas: number[];
  trainPoints: Array<{ id: string; x: number; y: number; yLabel: 1 | -1 }>;
  kernel: KernelType;
  cParam: number;
  gamma: number;
  polyDegree: number;
  supportVectorIds: string[];
  violatorIds: string[];
  marginWidth: number;
  hyperplaneAngleDeg: number;
  trainAccuracy: number;
  hiddenTestAccuracy: number;
  computeLatencyMs: number;
  decisionFn: (x: number, y: number) => number;
}

export interface TelemetryEvent {
  id: string;
  timestampMs: number;
  type: TelemetryEventType;
  payload: {
    pointId?: string;
    x?: number;
    y?: number;
    marginWidth: number;
    svCount: number;
    cValue: number;
    kernel: KernelType;
    hyperplaneDeltaAngle?: number;
    isSupportVector?: boolean;
  };
}

export interface DialogueTurn {
  turnId: number;
  sender: 'STUDENT' | 'TUTOR';
  text: string;
  timestampMs: number;
  tag?: string;
  hintTier?: 0 | 1 | 2 | 3;
  detectedMisconception?: MisconceptionCode | 'NONE';
  counterexampleTriggered?: CounterexampleType | null;
  isError?: boolean;
}

export interface NodeProgress {
  id: NodeId;
  shortTitle: string;
  label: string;
  scenarioHint: string;
  status: NodeStatus;
  masteryLevel: MasteryLevel;
  score: number;
  canvasVerified: boolean;
  verbalVerified: boolean;
  convergentHits: number;
  consecutiveErrors: number;
}

export interface MisconceptionTracker {
  code: MisconceptionCode;
  name: string;
  occurrences: number;
  hintLevelReached: 0 | 1 | 2 | 3;
  resolved: boolean;
  lastIntervention: string | null;
}

export interface CounterexampleCommand {
  counterexampleType: CounterexampleType;
  targetNode: NodeId;
  misconceptionCode: MisconceptionCode;
  durationMs: number;
  caption: string;
}

export type TeacherAlertCode =
  | 'ALERT_CONCEPTUAL_LOOP'
  | 'ALERT_PROLONGED_STALL'
  | 'ALERT_AFFECTIVE_DISTRESS'
  | 'ALERT_PREREQUISITE_GAP';

export interface TeacherAlertPayload {
  alertId: string;
  alertCode: TeacherAlertCode;
  sessionToken: string;
  stationLabel: string;
  severity: 'MODERATE_STALL' | 'CRITICAL_COGNITIVE_BLOCK';
  timestampIso: string;
  activeTier: DatasetTier;
  stalledNode: NodeId;
  exhaustedMisconception: MisconceptionCode | 'UNCLASSIFIED_FRUSTRATION';
  scaffoldingHistory: string[];
  diagnosticSummary: string;
  recommendedTeacherAction: string;
}

export interface SessionProfileVector {
  sessionToken: string;
  stationLabel: string;
  createdAtMs: number;
  expiresAtMs: number;
  grade: '9no_Secundaria';
  activeTier: DatasetTier;
  scaffoldingPhase: ScaffoldingPhase;
  currentHintTier: 0 | 1 | 2 | 3;
  cognitiveState: StudentCognitiveState;
  nodes: Record<NodeId, NodeProgress>;
  misconceptions: Record<MisconceptionCode, MisconceptionTracker>;
  exhaustedAnalogies: string[];
  metrics: {
    interiorDrags: number;
    svDrags: number;
    hyperplanePlacements: number;
    cSliderChanges: number;
    kernelSwitches: number;
    resetClicks: number;
    visualDemosTriggered: CounterexampleType[];
    idleSeconds: number;
  };
}

export interface MissionStepProgress {
  [stepId: string]: boolean;
}

export interface QuizAttemptResult {
  completedAtIso: string;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  answersByQuestionId: Record<string, string>;
  nodeScores: Record<NodeId, { correct: number; total: number }>;
  badgeTitle: string;
}

export interface PersistedStudentProgress {
  version: number;
  sessionIdentity: { token: string; displayId: string; stationLabel: string };
  profile: SessionProfileVector;
  dialogue: DialogueTurn[];
  activeMissionId: MissionId | null;
  missionSteps: MissionStepProgress;
  completedMissionIds: MissionId[];
  quizResult: QuizAttemptResult | null;
  highContrast: boolean;
  savedAtMs: number;
}

export interface DapiDocumentMeta {
  id: string;
  number: string;
  code: string;
  shortTitle: string;
  fullTitle: string;
  category: string;
  statusLabel: string;
  summary: string;
  highlights: string[];
  filePath: string;
}
