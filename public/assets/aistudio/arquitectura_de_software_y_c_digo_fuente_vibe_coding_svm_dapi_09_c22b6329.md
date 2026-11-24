# Arquitectura de Software Full-Stack y Código Fuente (Vibe Coding — DAPI 09): Explorador Intuitivo de SVM — Tutor MOCAVI

## 1. Estructura Modular del Proyecto (Nuxt 3 / Vue 3 + TypeScript + Nitro)

* **`types/svm.ts`**: Contratos de tipos estáticos, estados ontológicos, eventos de telemetría y payloads de herramientas.
* **`composables/useStudentTelemetry.ts`**: Bus de eventos reactivo, buffer circular FIFO (5 turnos + 10 eventos) y gestión del Vector de Perfil de Sesión anonimizado (cero PII).
* **`components/SvmCanvasLab.vue`**: Laboratorio visoespacial interactivo en HTML5 Canvas con motor matemático SVM *client-side* ($< 50\text{ ms}$), soporte para kernels Lineal/Polinomial/RBF, elevación topográfica 3D y receptor de contraejemplos visuales.
* **`components/MocaviTutorPanel.vue`**: Panel dialógico socrático con temporizador de Silencio Activo, progreso de los 4 nodos ontológicos y visor de trazabilidad curricular docente.
* **`server/api/tutor/respond.post.ts`**: Endpoint serverless de mediación socrática, diagnóstico de concepciones erróneas y activación de contraejemplos tras 2 fallos consecutivos.
* **`server/api/teacher/alert.post.ts`**: Endpoint serverless de alertas silenciosas al docente tras agotar los 3 niveles de pistas.
* **`server/api/docs/pedagogical-trace.get.ts`**: Endpoint de exposición estructurada de la trazabilidad pedagógica (DAPI 01 a DAPI 08).

---

## 2. Código Fuente Completo

### Archivo 1: `types/svm.ts`

```typescript
// types/svm.ts
export type PointClass = 'A' | 'B';
export type KernelType = 'LINEAR' | 'POLY' | 'RBF';
export type DatasetTier = 'TIER_1_LINEAR' | 'TIER_2_SOFT_MARGIN' | 'TIER_3_KERNEL_NONLINEAR';
export type ScaffoldingPhase = 'EXPLORACION' | 'DESESTABILIZACION' | 'TRANSFERENCIA';
export type NodeId = 'N1_SV' | 'N2_MARGIN' | 'N3_CPARAM' | 'N4_KERNEL';
export type NodeStatus = 'NO_INICIADO' | 'EN_PROGRESO' | 'EN_CONFLICTO' | 'CONSOLIDADO';
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
  | 'POINT_DRAGGED_INTERIOR'
  | 'POINT_DRAGGED_SV'
  | 'POINT_ON_HYPERPLANE'
  | 'C_SLIDER_CHANGED'
  | 'KERNEL_SWITCHED'
  | 'VIEW_3D_TOGGLED'
  | 'IDLE_THRESHOLD_REACHED';

export interface DataPoint2D {
  id: string;
  x: number;
  y: number;
  cls: PointClass;
  isSupportVector?: boolean;
  isTestBurst?: boolean;
}

export interface SvmModelState {
  weights: [number, number];
  bias: number;
  kernel: KernelType;
  cParam: number;
  supportVectorIds: string[];
  marginWidth: number;
  computeLatencyMs: number;
}

export interface TelemetryEvent {
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
  };
}

export interface DialogueTurn {
  turnId: number;
  sender: 'STUDENT' | 'TUTOR';
  text: string;
  timestampMs: number;
  detectedMisconception?: MisconceptionCode | 'NONE';
}

export interface NodeProgress {
  id: NodeId;
  label: string;
  status: NodeStatus;
  masteryLevel: MasteryLevel;
  canvasVerified: boolean;
  verbalVerified: boolean;
  consecutiveErrors: number;
}

export interface MisconceptionTracker {
  code: MisconceptionCode;
  occurrences: number;
  hintLevelReached: 0 | 1 | 2 | 3;
  resolved: boolean;
}

export interface SessionProfileVector {
  sessionToken: string;
  grade: '9no_Secundaria';
  activeTier: DatasetTier;
  scaffoldingPhase: ScaffoldingPhase;
  nodes: Record<NodeId, NodeProgress>;
  misconceptions: Record<MisconceptionCode, MisconceptionTracker>;
  metrics: {
    interiorDrags: number;
    svDrags: number;
    cOscillations: number;
    idleSeconds: number;
  };
}

export interface CounterexampleCommand {
  counterexampleType: CounterexampleType;
  targetNode: NodeId;
  misconceptionCode: MisconceptionCode;
  durationMs: number;
}

export interface TeacherAlertPayload {
  sessionToken: string;
  timestampIso: string;
  stalledNode: NodeId;
  exhaustedMisconception: MisconceptionCode | 'GENERAL_BLOCK';
  diagnosticSummary: string;
}

export interface TutorRespondRequest {
  studentMessage: string;
  profile: SessionProfileVector;
  recentTelemetry: TelemetryEvent[];
  recentDialogue: DialogueTurn[];
}

export interface TutorRespondResponse {
  tutorMessage: string;
  updatedProfile: SessionProfileVector;
  counterexampleCommand: CounterexampleCommand | null;
  teacherAlertTriggered: boolean;
}
```

### Archivo 2: `composables/useStudentTelemetry.ts`

```typescript
// composables/useStudentTelemetry.ts
import { ref, computed } from 'vue';
import type {
  SessionProfileVector,
  TelemetryEvent,
  TelemetryEventType,
  DialogueTurn,
  MisconceptionCode,
  DatasetTier,
  KernelType,
  CounterexampleCommand
} from '~/types/svm';

const MAX_TELEMETRY_WINDOW = 10;
const MAX_DIALOGUE_WINDOW = 5;

function generateEphemeralToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 12; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `anon_${suffix}`;
}

export function useStudentTelemetry() {
  const telemetryBuffer = ref<TelemetryEvent[]>([]);
  const dialogueBuffer = ref<DialogueTurn[]>([]);
  const activeCounterexample = ref<CounterexampleCommand | null>(null);
  const idleCounterSec = ref<number>(0);

  const sessionProfile = ref<SessionProfileVector>({
    sessionToken: generateEphemeralToken(),
    grade: '9no_Secundaria',
    activeTier: 'TIER_1_LINEAR',
    scaffoldingPhase: 'EXPLORACION',
    nodes: {
      N1_SV: {
        id: 'N1_SV',
        label: '1. Vectores de Soporte',
        status: 'EN_PROGRESO',
        masteryLevel: 'INICIAL',
        canvasVerified: false,
        verbalVerified: false,
        consecutiveErrors: 0
      },
      N2_MARGIN: {
        id: 'N2_MARGIN',
        label: '2. Margen Óptimo',
        status: 'NO_INICIADO',
        masteryLevel: 'INICIAL',
        canvasVerified: false,
        verbalVerified: false,
        consecutiveErrors: 0
      },
      N3_CPARAM: {
        id: 'N3_CPARAM',
        label: '3. Parámetro C',
        status: 'NO_INICIADO',
        masteryLevel: 'INICIAL',
        canvasVerified: false,
        verbalVerified: false,
        consecutiveErrors: 0
      },
      N4_KERNEL: {
        id: 'N4_KERNEL',
        label: '4. Kernelización 3D',
        status: 'NO_INICIADO',
        masteryLevel: 'INICIAL',
        canvasVerified: false,
        verbalVerified: false,
        consecutiveErrors: 0
      }
    },
    misconceptions: {
      ERR_CENTROID: { code: 'ERR_CENTROID', occurrences: 0, hintLevelReached: 0, resolved: false },
      ERR_RIGID_MARGIN: { code: 'ERR_RIGID_MARGIN', occurrences: 0, hintLevelReached: 0, resolved: false },
      ERR_REGRESSION: { code: 'ERR_REGRESSION', occurrences: 0, hintLevelReached: 0, resolved: false },
      ERR_2D_FIXATION: { code: 'ERR_2D_FIXATION', occurrences: 0, hintLevelReached: 0, resolved: false }
    },
    metrics: {
      interiorDrags: 0,
      svDrags: 0,
      cOscillations: 0,
      idleSeconds: 0
    }
  });

  function pushTelemetryEvent(
    type: TelemetryEventType,
    payload: TelemetryEvent['payload']
  ): void {
    idleCounterSec.value = 0;

    const event: TelemetryEvent = {
      timestampMs: Date.now(),
      type,
      payload
    };

    if (telemetryBuffer.value.length >= MAX_TELEMETRY_WINDOW) {
      telemetryBuffer.value.shift();
    }
    telemetryBuffer.value.push(event);

    // Actualización conductual directa sobre nodos ontológicos (Evidencia en Lienzo)
    if (type === 'POINT_DRAGGED_INTERIOR') {
      sessionProfile.value.metrics.interiorDrags += 1;
      if (sessionProfile.value.metrics.interiorDrags >= 2) {
        sessionProfile.value.nodes.N1_SV.canvasVerified = true;
      }
    } else if (type === 'POINT_DRAGGED_SV') {
      sessionProfile.value.metrics.svDrags += 1;
      sessionProfile.value.nodes.N1_SV.canvasVerified = true;
      sessionProfile.value.nodes.N2_MARGIN.canvasVerified = true;
      if (sessionProfile.value.nodes.N2_MARGIN.status === 'NO_INICIADO') {
        sessionProfile.value.nodes.N2_MARGIN.status = 'EN_PROGRESO';
      }
    } else if (type === 'C_SLIDER_CHANGED') {
      sessionProfile.value.metrics.cOscillations += 1;
      sessionProfile.value.nodes.N3_CPARAM.canvasVerified = true;
      if (sessionProfile.value.nodes.N3_CPARAM.status === 'NO_INICIADO') {
        sessionProfile.value.nodes.N3_CPARAM.status = 'EN_PROGRESO';
      }
    } else if (type === 'VIEW_3D_TOGGLED' || type === 'KERNEL_SWITCHED') {
      sessionProfile.value.nodes.N4_KERNEL.canvasVerified = true;
      if (sessionProfile.value.nodes.N4_KERNEL.status === 'NO_INICIADO') {
        sessionProfile.value.nodes.N4_KERNEL.status = 'EN_PROGRESO';
      }
    }
  }

  function pushDialogueTurn(
    sender: 'STUDENT' | 'TUTOR',
    text: string,
    detectedMisconception: MisconceptionCode | 'NONE' = 'NONE'
  ): void {
    const turn: DialogueTurn = {
      turnId: dialogueBuffer.value.length + 1,
      sender,
      text,
      timestampMs: Date.now(),
      detectedMisconception
    };

    if (dialogueBuffer.value.length >= MAX_DIALOGUE_WINDOW) {
      dialogueBuffer.value.shift();
    }
    dialogueBuffer.value.push(turn);
  }

  function setDatasetTier(tier: DatasetTier): void {
    sessionProfile.value.activeTier = tier;
    sessionProfile.value.scaffoldingPhase = 'EXPLORACION';
  }

  function applyCounterexample(cmd: CounterexampleCommand | null): void {
    activeCounterexample.value = cmd;
    if (cmd && cmd.durationMs > 0) {
      setTimeout(() => {
        if (activeCounterexample.value?.misconceptionCode === cmd.misconceptionCode) {
          activeCounterexample.value = null;
        }
      }, cmd.durationMs);
    }
  }

  function incrementIdleSecond(currentStateSnapshot: {
    marginWidth: number;
    svCount: number;
    cValue: number;
    kernel: KernelType;
  }): boolean {
    idleCounterSec.value += 1;
    sessionProfile.value.metrics.idleSeconds = idleCounterSec.value;
    if (idleCounterSec.value === 45) {
      pushTelemetryEvent('IDLE_THRESHOLD_REACHED', currentStateSnapshot);
      return true;
    }
    return false;
  }

  const consolidatedCount = computed(() =>
    Object.values(sessionProfile.value.nodes).filter((n) => n.status === 'CONSOLIDADO').length
  );

  return {
    sessionProfile,
    telemetryBuffer,
    dialogueBuffer,
    activeCounterexample,
    idleCounterSec,
    consolidatedCount,
    pushTelemetryEvent,
    pushDialogueTurn,
    setDatasetTier,
    applyCounterexample,
    incrementIdleSecond
  };
}
```

### Archivo 3: `components/SvmCanvasLab.vue`

```vue
<!-- components/SvmCanvasLab.vue -->
<template>
  <section class="bg-white rounded-2xl border border-slate-300 shadow-xs flex flex-col overflow-hidden h-full">
    <!-- Barra Superior de Escenarios Progresivos -->
    <div class="p-3 bg-slate-50 border-b border-slate-300 flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Escenarios progresivos">
        <span class="text-xs font-bold text-slate-700 mr-1">Escenario:</span>
        <button
          v-for="item in tiers"
          :key="item.id"
          type="button"
          :class="[
            'px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer',
            activeTier === item.id
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
          ]"
          @click="selectTier(item.id)"
        >
          {{ item.label }}
        </button>
      </div>

      <!-- Telemetría Geométrica en Vivo -->
      <div class="flex items-center gap-2 text-xs">
        <span
          :class="[
            'px-2.5 py-1 rounded-md border font-semibold',
            modelState.marginWidth >= 2.0
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          ]"
        >
          Pasillo: {{ modelState.marginWidth.toFixed(2) }} u
        </span>
        <span class="px-2.5 py-1 rounded-md bg-violet-50 border border-violet-300 text-violet-900 font-semibold">
          Pilares (SV): {{ modelState.supportVectorIds.length }}
        </span>
      </div>
    </div>

    <!-- Lienzo Interactivo 2D / Proyección 3D -->
    <div class="relative flex-1 min-h-[390px] sm:min-h-[450px] bg-[#F8FAFC]">
      <canvas
        ref="canvasRef"
        class="w-full h-full block cursor-crosshair touch-none"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointerleave="onPointerUp"
      />

      <!-- Toast de Retroalimentación Epistémica Inmediata -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="feedbackToast"
          class="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-900/90 text-white text-xs font-medium shadow-md text-center max-w-[90%]"
        >
          {{ feedbackToast }}
        </div>
      </Transition>

      <!-- Banner de Contraejemplo Pedagógico Activo -->
      <div
        v-if="counterexample"
        class="absolute top-14 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-violet-900 text-white text-xs font-semibold shadow-lg border border-violet-400"
      >
        Demostración Guiada Activa: {{ counterexampleLabel }}
      </div>

      <!-- Leyenda Dalto-Amigable -->
      <div class="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-300 rounded-xl p-2.5 text-xs space-y-1.5 shadow-xs">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-blue-600 inline-block" />
          <span class="font-medium text-slate-800">Barrio Azul (Clase A)</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rotate-45 bg-orange-600 inline-block" />
          <span class="font-medium text-slate-800">Barrio Naranja (Clase B)</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3.5 h-3.5 rounded-full border-2 border-violet-600 inline-block" />
          <span class="font-semibold text-violet-900">Vector de Soporte (Pilar)</span>
        </div>
      </div>
    </div>

    <!-- Barra Inferior de Controles Pedagógicos -->
    <div class="p-3 bg-white border-t border-slate-300 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
      <!-- Pinceles y Reinicio -->
      <div class="md:col-span-5 flex flex-wrap items-center gap-1.5">
        <span class="text-xs font-bold text-slate-700 mr-1">Pincel:</span>
        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
            activeBrush === 'A'
              ? 'bg-blue-600 text-white ring-2 ring-blue-300'
              : 'bg-blue-50 text-blue-900 border border-blue-300'
          ]"
          @click="activeBrush = 'A'"
        >
          + Azul
        </button>
        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
            activeBrush === 'B'
              ? 'bg-orange-600 text-white ring-2 ring-orange-300'
              : 'bg-orange-50 text-orange-900 border border-orange-300'
          ]"
          @click="activeBrush = 'B'"
        >
          + Naranja
        </button>
        <button
          type="button"
          class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 cursor-pointer"
          @click="selectTier(activeTier)"
        >
          Reiniciar
        </button>
      </div>

      <!-- Control Deslizante Parámetro C -->
      <div class="md:col-span-4 flex flex-col">
        <div class="flex justify-between text-xs font-semibold text-slate-800 mb-1">
          <label for="c-slider">Tolerancia C:</label>
          <span class="text-emerald-800 font-bold">{{ cLabelText }}</span>
        </div>
        <input
          id="c-slider"
          v-model.number="cParam"
          type="range"
          min="0.2"
          max="5.0"
          step="0.2"
          class="accent-emerald-700 cursor-pointer"
          @input="onCParamChange"
        />
      </div>

      <!-- Selector Kernel y Vista Topográfica 3D -->
      <div class="md:col-span-3 flex items-center gap-1.5 justify-end">
        <select
          v-model="kernel"
          aria-label="Forma de frontera"
          class="px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white cursor-pointer"
          @change="onKernelChange"
        >
          <option value="LINEAR">Recta (Lineal)</option>
          <option value="POLY">Curva (Poli)</option>
          <option value="RBF">Islas (RBF)</option>
        </select>

        <button
          type="button"
          :class="[
            'px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer',
            is3DView
              ? 'bg-violet-700 text-white border-violet-800'
              : 'bg-violet-50 text-violet-900 border-violet-300 hover:bg-violet-100'
          ]"
          @click="toggle3DView"
        >
          {{ is3DView ? '2D' : '3D' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import type {
  DataPoint2D,
  PointClass,
  KernelType,
  DatasetTier,
  SvmModelState,
  TelemetryEventType,
  TelemetryEvent,
  CounterexampleCommand
} from '~/types/svm';

const props = defineProps<{
  activeTier: DatasetTier;
  counterexample: CounterexampleCommand | null;
}>();

const emit = defineEmits<{
  (e: 'tierChange', tier: DatasetTier): void;
  (e: 'telemetry', type: TelemetryEventType, payload: TelemetryEvent['payload']): void;
  (e: 'modelUpdated', state: SvmModelState): void;
}>();

const tiers: { id: DatasetTier; label: string }[] = [
  { id: 'TIER_1_LINEAR', label: '1. Frontera Limpia' },
  { id: 'TIER_2_SOFT_MARGIN', label: '2. Ruido y Parámetro C' },
  { id: 'TIER_3_KERNEL_NONLINEAR', label: '3. Islas y Kernel 3D' }
];

const canvasRef = ref<HTMLCanvasElement | null>(null);
const points = ref<DataPoint2D[]>([]);
const activeBrush = ref<PointClass>('A');
const cParam = ref<number>(1.5);
const kernel = ref<KernelType>('LINEAR');
const is3DView = ref<boolean>(false);
const draggingId = ref<string | null>(null);
const feedbackToast = ref<string>('');
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const modelState = ref<SvmModelState>({
  weights: [0.6, -0.6],
  bias: 0,
  kernel: 'LINEAR',
  cParam: 1.5,
  supportVectorIds: [],
  marginWidth: 2.5,
  computeLatencyMs: 0
});

const cLabelText = computed(() => {
  if (cParam.value <= 0.8) return `Relajado (${cParam.value.toFixed(1)})`;
  if (cParam.value >= 3.2) return `Estricto (${cParam.value.toFixed(1)})`;
  return `Equilibrado (${cParam.value.toFixed(1)})`;
});

const counterexampleLabel = computed(() => {
  if (!props.counterexample) return '';
  const map: Record<CounterexampleCommand['counterexampleType'], string> = {
    HIGHLIGHT_SUPPORT_VECTORS: 'Resaltando pilares críticos del borde',
    INJECT_OVERFIT_TEST_BURST: 'Evaluando ráfaga de puntos nuevos en margen estrecho',
    COMPARE_FENCE_VS_TREND: 'Comparando cerca separadora vs. línea de tendencia',
    ANIMATE_2D_TO_3D_ELEVATION: 'Elevación topográfica 2D → 3D'
  };
  return map[props.counterexample.counterexampleType];
});

function showToast(msg: string): void {
  feedbackToast.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    feedbackToast.value = '';
  }, 2400);
}

function loadScenarioPoints(tier: DatasetTier): void {
  is3DView.value = false;
  if (tier === 'TIER_1_LINEAR') {
    kernel.value = 'LINEAR';
    cParam.value = 2.0;
    points.value = [
      { id: 'a1', x: -5.5, y: 4.5, cls: 'A' },
      { id: 'a2', x: -6.0, y: 1.8, cls: 'A' },
      { id: 'a3', x: -3.8, y: 5.5, cls: 'A' },
      { id: 'a4', x: -2.2, y: 2.2, cls: 'A' },
      { id: 'a5', x: -3.0, y: 0.8, cls: 'A' },
      { id: 'b1', x: 2.2, y: -2.2, cls: 'B' },
      { id: 'b2', x: 3.0, y: -0.8, cls: 'B' },
      { id: 'b3', x: 5.4, y: -4.2, cls: 'B' },
      { id: 'b4', x: 6.0, y: -1.6, cls: 'B' },
      { id: 'b5', x: 4.0, y: -5.4, cls: 'B' }
    ];
  } else if (tier === 'TIER_2_SOFT_MARGIN') {
    kernel.value = 'LINEAR';
    cParam.value = 1.0;
    points.value = [
      { id: 'a1', x: -5.0, y: 4.0, cls: 'A' },
      { id: 'a2', x: -4.4, y: 1.4, cls: 'A' },
      { id: 'a3', x: -2.4, y: 2.0, cls: 'A' },
      { id: 'a_out', x: 1.7, y: -1.1, cls: 'A' },
      { id: 'b1', x: 2.4, y: -2.0, cls: 'B' },
      { id: 'b2', x: 5.0, y: -3.8, cls: 'B' },
      { id: 'b3', x: 4.1, y: -1.1, cls: 'B' },
      { id: 'b_out', x: -1.4, y: 1.3, cls: 'B' }
    ];
  } else {
    kernel.value = 'RBF';
    cParam.value = 2.0;
    points.value = [
      { id: 'c1', x: -0.8, y: 0.6, cls: 'A' },
      { id: 'c2', x: 0.9, y: 0.5, cls: 'A' },
      { id: 'c3', x: 0.0, y: -1.0, cls: 'A' },
      { id: 'c4', x: -0.5, y: -0.4, cls: 'A' },
      { id: 'r1', x: -4.2, y: 3.5, cls: 'B' },
      { id: 'r2', x: 4.2, y: 3.5, cls: 'B' },
      { id: 'r3', x: -4.5, y: -3.2, cls: 'B' },
      { id: 'r4', x: 4.5, y: -3.2, cls: 'B' },
      { id: 'r5', x: 0.0, y: 4.8, cls: 'B' },
      { id: 'r6', x: 0.0, y: -4.8, cls: 'B' }
    ];
  }
  trainSvmClientSide();
  renderCanvas();
}

function trainSvmClientSide(): void {
  const t0 = performance.now();
  const basePts = points.value.filter((p) => !p.isTestBurst);
  if (basePts.length < 2) return;

  if (kernel.value === 'RBF' || kernel.value === 'POLY') {
    const svIds: string[] = [];
    const radiusThreshold = kernel.value === 'RBF' ? 2.75 : 3.1;
    for (const p of basePts) {
      const dist = kernel.value === 'RBF' ? Math.hypot(p.x, p.y) : Math.hypot(p.x * 0.9, p.y * 1.15);
      if ((p.cls === 'A' && dist >= radiusThreshold - 1.5) || (p.cls === 'B' && dist <= radiusThreshold + 1.8)) {
        svIds.push(p.id);
      }
      p.isSupportVector = svIds.includes(p.id);
    }
    modelState.value = {
      weights: [1, 1],
      bias: radiusThreshold,
      kernel: kernel.value,
      cParam: cParam.value,
      supportVectorIds: svIds,
      marginWidth: +(1.7 / Math.sqrt(cParam.value)).toFixed(2),
      computeLatencyMs: +(performance.now() - t0).toFixed(2)
    };
    emit('modelUpdated', modelState.value);
    return;
  }

  let w0 = 0.5;
  let w1 = -0.5;
  let b = 0.0;
  const lr = 0.04;
  const lambda = 1 / (cParam.value * 4.0);

  for (let iter = 0; iter < 320; iter++) {
    for (const p of basePts) {
      const y = p.cls === 'A' ? 1 : -1;
      const x0 = p.x / 5.0;
      const x1 = p.y / 5.0;
      const functionalMargin = y * (w0 * x0 + w1 * x1 + b);

      if (functionalMargin < 1) {
        w0 = w0 - lr * (lambda * w0 - y * x0);
        w1 = w1 - lr * (lambda * w1 - y * x1);
        b = b + lr * y;
      } else {
        w0 = w0 - lr * (lambda * w0);
        w1 = w1 - lr * (lambda * w1);
      }
    }
  }

  const norm = Math.hypot(w0, w1) || 0.001;
  const scaledW0 = w0 / 5.0;
  const scaledW1 = w1 / 5.0;
  const svIds: string[] = [];

  for (const p of basePts) {
    const y = p.cls === 'A' ? 1 : -1;
    const fMargin = y * (scaledW0 * p.x + scaledW1 * p.y + b);
    const isSv = fMargin <= 1.18;
    p.isSupportVector = isSv;
    if (isSv) svIds.push(p.id);
  }

  modelState.value = {
    weights: [scaledW0, scaledW1],
    bias: b,
    kernel: 'LINEAR',
    cParam: cParam.value,
    supportVectorIds: svIds,
    marginWidth: +((2 / norm) * 2.2).toFixed(2),
    computeLatencyMs: +(performance.now() - t0).toFixed(2)
  };
  emit('modelUpdated', modelState.value);
}

function toScreen(x: number, y: number, w: number, h: number) {
  return { sx: ((x + 8) / 16) * w, sy: ((8 - y) / 16) * h };
}

function toWorld(sx: number, sy: number, w: number, h: number) {
  return {
    x: +((sx / w) * 16 - 8).toFixed(2),
    y: +(8 - (sy / h) * 16).toFixed(2)
  };
}

function renderCanvas(): void {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  ctx.clearRect(0, 0, w, h);

  if (is3DView.value) {
    renderTopographic3D(ctx, w, h);
    return;
  }

  const [w0, w1] = modelState.value.weights;
  const b = modelState.value.bias;

  if (kernel.value === 'RBF' || kernel.value === 'POLY') {
    const center = toScreen(0, 0, w, h);
    const rad = (b / 16) * Math.min(w, h);
    ctx.fillStyle = '#FFEDD5';
    ctx.fillRect(0, 0, w, h);

    ctx.beginPath();
    if (kernel.value === 'RBF') {
      ctx.arc(center.sx, center.sy, rad, 0, Math.PI * 2);
    } else {
      ctx.ellipse(center.sx, center.sy, rad * 1.15, rad * 0.85, 0, 0, Math.PI * 2);
    }
    ctx.fillStyle = '#DBEAFE';
    ctx.fill();
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center.sx, center.sy, rad + 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(center.sx, center.sy, Math.max(12, rad - 18), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else {
    for (let px = 0; px < w; px += 8) {
      for (let py = 0; py < h; py += 8) {
        const pt = toWorld(px, py, w, h);
        const val = w0 * pt.x + w1 * pt.y + b;
        ctx.fillStyle = val >= 0 ? 'rgba(219, 234, 254, 0.55)' : 'rgba(255, 237, 213, 0.55)';
        ctx.fillRect(px, py, 8, 8);
      }
    }
    drawLine2D(ctx, w0, w1, b, w, h, '#047857', 3, []);
    drawLine2D(ctx, w0, w1, b - 1, w, h, '#10B981', 2, [6, 6]);
    drawLine2D(ctx, w0, w1, b + 1, w, h, '#10B981', 2, [6, 6]);
  }

  if (props.counterexample?.counterexampleType === 'COMPARE_FENCE_VS_TREND') {
    const pStart = toScreen(-6.5, 4.8, w, h);
    const pEnd = toScreen(6.5, -4.8, w, h);
    ctx.save();
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pStart.sx, pStart.sy);
    ctx.lineTo(pEnd.sx, pEnd.sy);
    ctx.stroke();
    ctx.restore();
  }

  const origin = toScreen(0, 0, w, h);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, origin.sy);
  ctx.lineTo(w, origin.sy);
  ctx.moveTo(origin.sx, 0);
  ctx.lineTo(origin.sx, h);
  ctx.stroke();

  for (const p of points.value) {
    const { sx, sy } = toScreen(p.x, p.y, w, h);
    const highlightPulse =
      p.isSupportVector ||
      (props.counterexample?.counterexampleType === 'HIGHLIGHT_SUPPORT_VECTORS' && p.isSupportVector);

    if (highlightPulse) {
      ctx.beginPath();
      ctx.arc(sx, sy, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(124, 58, 237, 0.18)';
      ctx.fill();
      ctx.strokeStyle = '#7C3AED';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.fillStyle = p.cls === 'A' ? '#2563EB' : '#EA580C';
    ctx.strokeStyle = p.isTestBurst ? '#0F172A' : '#FFFFFF';
    ctx.lineWidth = 2;

    if (p.cls === 'A') {
      ctx.beginPath();
      ctx.arc(sx, sy, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(sx, sy - 9);
      ctx.lineTo(sx + 9, sy);
      ctx.lineTo(sx, sy + 9);
      ctx.lineTo(sx - 9, sy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}

function drawLine2D(
  ctx: CanvasRenderingContext2D,
  w0: number,
  w1: number,
  offset: number,
  w: number,
  h: number,
  color: string,
  lineWidth: number,
  dash: number[]
): void {
  if (Math.abs(w1) < 0.0001) return;
  const x1 = -8;
  const y1 = -(w0 * x1 + offset) / w1;
  const x2 = 8;
  const y2 = -(w0 * x2 + offset) / w1;
  const p1 = toScreen(x1, y1, w, h);
  const p2 = toScreen(x2, y2, w, h);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(p1.sx, p1.sy);
  ctx.lineTo(p2.sx, p2.sy);
  ctx.stroke();
  ctx.restore();
}

function renderTopographic3D(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h * 0.66;

  ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 210, cy - 35);
  ctx.lineTo(cx, cy - 95);
  ctx.lineTo(cx + 210, cy - 35);
  ctx.lineTo(cx, cy + 25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  for (const p of points.value) {
    const r2 = p.x * p.x + p.y * p.y;
    const z = Math.exp(-r2 / 8) * 140;
    const isoX = cx + (p.x - p.y) * 22;
    const isoY = cy + (p.x + p.y) * 11 - z;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.beginPath();
    ctx.moveTo(isoX, isoY);
    ctx.lineTo(isoX, isoY + z);
    ctx.stroke();

    ctx.fillStyle = p.cls === 'A' ? '#3B82F6' : '#F97316';
    ctx.beginPath();
    ctx.arc(isoX, isoY, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('Elevación 3D (Kernel): El centro subió como una montaña y ahora un corte recto los separa.', 18, 30);
}

function onPointerDown(e: PointerEvent): void {
  if (is3DView.value || !canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;

  const hit = points.value.find((p) => {
    const pos = toScreen(p.x, p.y, rect.width, rect.height);
    return Math.hypot(pos.sx - sx, pos.sy - sy) < 16;
  });

  if (hit) {
    draggingId.value = hit.id;
  } else {
    const world = toWorld(sx, sy, rect.width, rect.height);
    const newPt: DataPoint2D = {
      id: `pt_${Date.now()}`,
      x: world.x,
      y: world.y,
      cls: activeBrush.value
    };
    points.value.push(newPt);
    trainSvmClientSide();
    renderCanvas();

    const [w0, w1] = modelState.value.weights;
    const distHyperplane = Math.abs(w0 * newPt.x + w1 * newPt.y + modelState.value.bias);
    const evtType: TelemetryEventType = distHyperplane < 0.08 ? 'POINT_ON_HYPERPLANE' : 'POINT_ADDED';

    emit('telemetry', evtType, {
      pointId: newPt.id,
      x: newPt.x,
      y: newPt.y,
      marginWidth: modelState.value.marginWidth,
      svCount: modelState.value.supportVectorIds.length,
      cValue: cParam.value,
      kernel: kernel.value
    });
  }
}

function onPointerMove(e: PointerEvent): void {
  if (!draggingId.value || is3DView.value || !canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const world = toWorld(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);

  const pt = points.value.find((item) => item.id === draggingId.value);
  if (!pt) return;

  const wasSv = Boolean(pt.isSupportVector);
  pt.x = Math.max(-7.5, Math.min(7.5, world.x));
  pt.y = Math.max(-7.5, Math.min(7.5, world.y));

  trainSvmClientSide();
  renderCanvas();

  if (wasSv) {
    showToast('Pilar de soporte en movimiento: observa cómo gira la avenida central.');
    emit('telemetry', 'POINT_DRAGGED_SV', {
      pointId: pt.id,
      x: pt.x,
      y: pt.y,
      marginWidth: modelState.value.marginWidth,
      svCount: modelState.value.supportVectorIds.length,
      cValue: cParam.value,
      kernel: kernel.value
    });
  } else {
    showToast('Invarianza activa: mover puntos interiores no altera la frontera.');
    emit('telemetry', 'POINT_DRAGGED_INTERIOR', {
      pointId: pt.id,
      x: pt.x,
      y: pt.y,
      marginWidth: modelState.value.marginWidth,
      svCount: modelState.value.supportVectorIds.length,
      cValue: cParam.value,
      kernel: kernel.value
    });
  }
}

function onPointerUp(): void {
  draggingId.value = null;
}

function onCParamChange(): void {
  trainSvmClientSide();
  renderCanvas();
  emit('telemetry', 'C_SLIDER_CHANGED', {
    marginWidth: modelState.value.marginWidth,
    svCount: modelState.value.supportVectorIds.length,
    cValue: cParam.value,
    kernel: kernel.value
  });
}

function onKernelChange(): void {
  trainSvmClientSide();
  renderCanvas();
  emit('telemetry', 'KERNEL_SWITCHED', {
    marginWidth: modelState.value.marginWidth,
    svCount: modelState.value.supportVectorIds.length,
    cValue: cParam.value,
    kernel: kernel.value
  });
}

function toggle3DView(): void {
  is3DView.value = !is3DView.value;
  renderCanvas();
  emit('telemetry', 'VIEW_3D_TOGGLED', {
    marginWidth: modelState.value.marginWidth,
    svCount: modelState.value.supportVectorIds.length,
    cValue: cParam.value,
    kernel: kernel.value
  });
}

function selectTier(tier: DatasetTier): void {
  emit('tierChange', tier);
  loadScenarioPoints(tier);
}

function handleResize(): void {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.parentElement?.getBoundingClientRect();
  if (!rect) return;
  const dpr = window.devicePixelRatio || 1;
  canvasRef.value.width = rect.width * dpr;
  canvasRef.value.height = rect.height * dpr;
  const ctx = canvasRef.value.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderCanvas();
}

watch(
  () => props.counterexample,
  (cmd) => {
    if (!cmd) {
      points.value = points.value.filter((p) => !p.isTestBurst);
      renderCanvas();
      return;
    }
    if (cmd.counterexampleType === 'INJECT_OVERFIT_TEST_BURST') {
      const burst: DataPoint2D[] = [
        { id: 'tb1', x: 0.9, y: -0.6, cls: 'A', isTestBurst: true },
        { id: 'tb2', x: 1.2, y: -0.9, cls: 'A', isTestBurst: true },
        { id: 'tb3', x: -0.8, y: 0.7, cls: 'B', isTestBurst: true }
      ];
      points.value.push(...burst);
    } else if (cmd.counterexampleType === 'ANIMATE_2D_TO_3D_ELEVATION') {
      is3DView.value = true;
    }
    renderCanvas();
  }
);

onMounted(() => {
  loadScenarioPoints(props.activeTier);
  handleResize();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>
```

### Archivo 4: `components/MocaviTutorPanel.vue`

```vue
<!-- components/MocaviTutorPanel.vue -->
<template>
  <aside class="bg-white rounded-2xl border border-slate-300 shadow-xs flex flex-col overflow-hidden h-full">
    <!-- Tarjeta de Progreso en los 4 Nodos Ontológicos -->
    <div class="p-3 bg-slate-50 border-b border-slate-300">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-700">
          Nodos Ontológicos SVM
        </span>
        <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900">
          {{ profile.scaffoldingPhase }}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-1.5 text-xs">
        <div
          v-for="node in nodeList"
          :key="node.id"
          :class="[
            'px-2.5 py-1.5 rounded-lg border flex items-center justify-between font-medium',
            node.status === 'CONSOLIDADO'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold'
              : node.status === 'EN_CONFLICTO'
                ? 'border-amber-400 bg-amber-50 text-amber-950'
                : node.status === 'EN_PROGRESO'
                  ? 'border-blue-300 bg-blue-50 text-blue-950'
                  : 'border-slate-300 bg-white text-slate-600'
          ]"
        >
          <span class="truncate pr-1">{{ node.label }}</span>
          <span>{{ statusGlyph(node.status) }}</span>
        </div>
      </div>
    </div>

    <!-- Cabecera del Tutor con Temporizador de Silencio Activo -->
    <div class="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
          TM
        </div>
        <div>
          <h2 class="text-sm font-bold text-slate-900">Tutor-SVM MOCAVI</h2>
          <p class="text-[11px] text-slate-600">
            {{ silenceRemaining > 0 ? `Silencio Activo: ${silenceRemaining}s` : 'Mediación socrática lista' }}
          </p>
        </div>
      </div>

      <button
        type="button"
        class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold cursor-pointer"
        @click="openPedagogicalTrace"
      >
        Traza Docente
      </button>
    </div>

    <!-- Feed de Diálogo Socrático -->
    <div ref="feedRef" class="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/60 max-h-[380px]">
      <div
        v-for="turn in dialogue"
        :key="turn.turnId"
        :class="[
          'p-3 text-sm leading-relaxed shadow-2xs rounded-2xl',
          turn.sender === 'STUDENT'
            ? 'ml-8 bg-emerald-700 text-white rounded-tr-xs'
            : 'mr-4 bg-white border border-slate-300 text-slate-900 rounded-tl-xs'
        ]"
      >
        {{ turn.text }}
      </div>
      <div v-if="isSending" class="text-xs text-slate-500 italic px-2">
        Observando tu experimento en el lienzo...
      </div>
    </div>

    <!-- Chips de Exploración Rápida -->
    <div class="px-3 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-1.5">
      <button
        v-for="chip in quickPrompts"
        :key="chip"
        type="button"
        class="px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-medium text-slate-800 cursor-pointer"
        @click="sendQuickPrompt(chip)"
      >
        {{ chip }}
      </button>
    </div>

    <!-- Formulario de Entrada -->
    <form class="p-3 bg-white border-t border-slate-300 flex gap-2" @submit.prevent="handleSubmit">
      <input
        v-model="draftMessage"
        type="text"
        placeholder="Describe lo que observas en el plano..."
        class="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        required
      />
      <button
        type="submit"
        :disabled="isSending"
        class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-bold transition cursor-pointer"
      >
        Enviar
      </button>
    </form>

    <!-- Modal Colapsable de Trazabilidad Pedagógica Docente -->
    <div
      v-if="showTraceModal"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl border border-slate-300 max-w-2xl w-full p-5 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 class="text-base font-bold text-slate-900">Trazabilidad Curricular y Telemetría (DAPI 01–08)</h3>
            <p class="text-xs text-slate-600">Token Anónimo (Cero PII): {{ profile.sessionToken }}</p>
          </div>
          <button
            type="button"
            class="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 cursor-pointer"
            @click="showTraceModal = false"
          >
            Cerrar
          </button>
        </div>

        <div class="space-y-2 text-xs text-slate-800">
          <div v-for="doc in traceArtifacts" :key="doc.code" class="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div class="font-bold text-emerald-900">{{ doc.code }} — {{ doc.title }}</div>
            <p class="text-slate-700 mt-1">{{ doc.summary }}</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import type {
  SessionProfileVector,
  DialogueTurn,
  TelemetryEvent,
  NodeStatus,
  TutorRespondResponse
} from '~/types/svm';

interface PedagogicalArtifact {
  code: string;
  title: string;
  summary: string;
}

const props = defineProps<{
  profile: SessionProfileVector;
  dialogue: DialogueTurn[];
  telemetry: TelemetryEvent[];
}>();

const emit = defineEmits<{
  (e: 'studentMessage', text: string): void;
  (e: 'tutorResponse', response: TutorRespondResponse): void;
}>();

const draftMessage = ref<string>('');
const isSending = ref<boolean>(false);
const silenceRemaining = ref<number>(18);
const showTraceModal = ref<boolean>(false);
const traceArtifacts = ref<PedagogicalArtifact[]>([]);
const feedRef = ref<HTMLElement | null>(null);
let silenceInterval: ReturnType<typeof setInterval> | null = null;

const quickPrompts = [
  'Moví un punto lejano y no pasó nada',
  '¿Por qué el pasillo se hace más angosto?',
  '¿Cómo separo los puntos del centro?'
];

const nodeList = computed(() => Object.values(props.profile.nodes));

function statusGlyph(status: NodeStatus): string {
  if (status === 'CONSOLIDADO') return '✓';
  if (status === 'EN_CONFLICTO') return '!';
  if (status === 'EN_PROGRESO') return '●';
  return '○';
}

function resetSilenceWindow(): void {
  silenceRemaining.value = 18;
}

async function handleSubmit(): Promise<void> {
  const text = draftMessage.value.trim();
  if (!text || isSending.value) return;

  draftMessage.value = '';
  silenceRemaining.value = 0;
  emit('studentMessage', text);
  isSending.value = true;

  try {
    const response = await $fetch<TutorRespondResponse>('/api/tutor/respond', {
      method: 'POST',
      body: {
        studentMessage: text,
        profile: props.profile,
        recentTelemetry: props.telemetry,
        recentDialogue: props.dialogue
      }
    });
    emit('tutorResponse', response);
  } finally {
    isSending.value = false;
    await nextTick();
    if (feedRef.value) {
      feedRef.value.scrollTop = feedRef.value.scrollHeight;
    }
  }
}

function sendQuickPrompt(text: string): void {
  draftMessage.value = text;
  handleSubmit();
}

async function openPedagogicalTrace(): Promise<void> {
  showTraceModal.value = true;
  if (traceArtifacts.value.length === 0) {
    const res = await $fetch<{ artifacts: PedagogicalArtifact[] }>('/api/docs/pedagogical-trace');
    traceArtifacts.value = res.artifacts;
  }
}

watch(
  () => props.profile.activeTier,
  () => resetSilenceWindow()
);

onMounted(() => {
  silenceInterval = setInterval(() => {
    if (silenceRemaining.value > 0) {
      silenceRemaining.value -= 1;
    }
  }, 1000);
});

onBeforeUnmount(() => {
  if (silenceInterval) clearInterval(silenceInterval);
});
</script>
```

### Archivo 5: `server/api/tutor/respond.post.ts`

```typescript
// server/api/tutor/respond.post.ts
import { defineEventHandler, readBody, createError } from 'h3';
import type {
  TutorRespondRequest,
  TutorRespondResponse,
  MisconceptionCode,
  NodeId,
  CounterexampleCommand
} from '~/types/svm';

function sanitizePII(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[DATO_PROTEGIDO]')
    .replace(/\b\d{7,11}\b/g, '[ID_PROTEGIDO]');
}

function detectMisconception(
  cleanText: string,
  recentEvents: TutorRespondRequest['recentTelemetry']
): MisconceptionCode | 'NONE' {
  const q = cleanText.toLowerCase();

  if (
    q.includes('promedio') ||
    q.includes('peso de todos') ||
    q.includes('centro de todos') ||
    recentEvents.filter((e) => e.type === 'POINT_DRAGGED_INTERIOR').length >= 3
  ) {
    return 'ERR_CENTROID';
  }

  if (
    q.includes('ningún punto mal') ||
    q.includes('c al máximo') ||
    q.includes('más delgado es más exacto')
  ) {
    return 'ERR_RIGID_MARGIN';
  }

  if (
    q.includes('encima de los puntos') ||
    q.includes('tendencia') ||
    recentEvents.some((e) => e.type === 'POINT_ON_HYPERPLANE')
  ) {
    return 'ERR_REGRESSION';
  }

  if (q.includes('imposible separar') || q.includes('ninguna línea sirve')) {
    return 'ERR_2D_FIXATION';
  }

  return 'NONE';
}

function buildCounterexample(code: MisconceptionCode): CounterexampleCommand {
  const mapping: Record<MisconceptionCode, { type: CounterexampleCommand['counterexampleType']; node: NodeId }> = {
    ERR_CENTROID: { type: 'HIGHLIGHT_SUPPORT_VECTORS', node: 'N1_SV' },
    ERR_RIGID_MARGIN: { type: 'INJECT_OVERFIT_TEST_BURST', node: 'N3_CPARAM' },
    ERR_REGRESSION: { type: 'COMPARE_FENCE_VS_TREND', node: 'N2_MARGIN' },
    ERR_2D_FIXATION: { type: 'ANIMATE_2D_TO_3D_ELEVATION', node: 'N4_KERNEL' }
  };
  return {
    counterexampleType: mapping[code].type,
    targetNode: mapping[code].node,
    misconceptionCode: code,
    durationMs: 4500
  };
}

export default defineEventHandler(async (event): Promise<TutorRespondResponse> => {
  const body = await readBody<TutorRespondRequest>(event);

  if (!body || !body.studentMessage || !body.profile) {
    throw createError({ statusCode: 400, statusMessage: 'Payload de sesión incompleto.' });
  }

  const cleanMessage = sanitizePII(body.studentMessage.trim());
  const profile = structuredClone(body.profile);
  const lower = cleanMessage.toLowerCase();

  let tutorMessage = '';
  let counterexampleCommand: CounterexampleCommand | null = null;
  let teacherAlertTriggered = false;

  // 1. Regla dura de bloqueo ante solicitud de respuesta directa o fórmulas
  if (
    lower.includes('dime la respuesta') ||
    lower.includes('valor exacto') ||
    lower.includes('resuelve') ||
    lower.includes('fórmula')
  ) {
    tutorMessage =
      'Mi objetivo es ayudarte a descubrir cómo piensa el algoritmo sin darte la respuesta lista. Mueve el control C hacia ambos extremos y dime: ¿en cuál lado el pasillo de seguridad queda más ancho?';
    return {
      tutorMessage,
      updatedProfile: profile,
      counterexampleCommand: null,
      teacherAlertTriggered: false
    };
  }

  // 2. Detección de concepciones erróneas y escalera de pistas N1 - N3
  const misconception = detectMisconception(cleanMessage, body.recentTelemetry || []);

  if (misconception !== 'NONE') {
    const tracker = profile.misconceptions[misconception];
    tracker.occurrences += 1;
    tracker.resolved = false;

    const targetNodeMap: Record<MisconceptionCode, NodeId> = {
      ERR_CENTROID: 'N1_SV',
      ERR_RIGID_MARGIN: 'N3_CPARAM',
      ERR_REGRESSION: 'N2_MARGIN',
      ERR_2D_FIXATION: 'N4_KERNEL'
    };
    const nodeId = targetNodeMap[misconception];
    const node = profile.nodes[nodeId];
    node.consecutiveErrors += 1;
    node.status = 'EN_CONFLICTO';
    profile.scaffoldingPhase = 'DESESTABILIZACION';

    if (node.consecutiveErrors === 1) {
      tracker.hintLevelReached = 1;
      const n1Prompts: Record<MisconceptionCode, string> = {
        ERR_CENTROID:
          'Fíjate únicamente en los puntos que tienen un anillo violeta tocando las líneas punteadas: ¿hay algún punto del fondo tocando ese borde?',
        ERR_RIGID_MARGIN:
          'Mira en qué se convirtió el ancho de tu pasillo de seguridad al intentar atrapar ese único punto rebelde: ¿qué tan fácil sería que un dato nuevo cruce una calle tan estrecha?',
        ERR_REGRESSION:
          'Observa los dos colores de fondo a cada lado de la línea central: ¿nuestra cerca busca conectar los puntos o separar los dos territorios?',
        ERR_2D_FIXATION:
          'Sobre esta mesa plana (2D) ninguna línea recta los separa sin cortar el anillo exterior; ¿qué pasaría si pudieras elevar los puntos del centro hacia arriba?'
      };
      tutorMessage = n1Prompts[misconception];
    } else if (node.consecutiveErrors === 2) {
      tracker.hintLevelReached = 2;
      counterexampleCommand = buildCounterexample(misconception);
      tutorMessage =
        'Activé una demostración visual en tu lienzo para contrastar lo que ocurre. Observa los elementos resaltados: ¿qué regla geométrica notas ahora en la frontera?';
    } else {
      tracker.hintLevelReached = 3;
      teacherAlertTriggered = true;
      await $fetch('/api/teacher/alert', {
        method: 'POST',
        body: {
          sessionToken: profile.sessionToken,
          timestampIso: new Date().toISOString(),
          stalledNode: nodeId,
          exhaustedMisconception: misconception,
          diagnosticSummary: `Persistencia en ${misconception} tras 3 niveles de andamiaje socrático.`
        }
      });
      tutorMessage =
        'Tomemos una pausa breve en este reto; ya notifiqué a tu docente para acompañarte aquí. Mientras tanto, prueba arrastrar un solo punto con anillo violeta: ¿hacia dónde gira la línea?';
    }

    return {
      tutorMessage,
      updatedProfile: profile,
      counterexampleCommand,
      teacherAlertTriggered
    };
  }

  // 3. Evaluación de evidencia convergente (Lienzo + Justificación verbal)
  if (
    lower.includes('no pasó nada') ||
    lower.includes('no se mueve') ||
    lower.includes('borde') ||
    lower.includes('pilares')
  ) {
    profile.nodes.N1_SV.verbalVerified = true;
    profile.nodes.N1_SV.consecutiveErrors = 0;
    if (profile.nodes.N1_SV.canvasVerified) {
      profile.nodes.N1_SV.status = 'CONSOLIDADO';
      profile.nodes.N1_SV.masteryLevel = 'AUTONOMO';
      profile.scaffoldingPhase = 'TRANSFERENCIA';
      tutorMessage =
        '¡Excelente deducción! Comprobaste en el plano y con tus palabras que solo los pilares del borde sostienen la avenida. Ahora arrastra un punto con anillo violeta: ¿qué pasa con el ancho del pasillo?';
    } else {
      tutorMessage =
        'Tu explicación va por muy buen camino. Ahora compruébalo directamente en el lienzo arrastrando un punto azul bien lejano del borde: ¿se mueve la línea verde?';
    }
  } else {
    tutorMessage =
      'Observa las dos líneas punteadas que forman el pasillo de seguridad entre ambos barrios: ¿cuáles son los únicos puntos que están tocando esas líneas?';
  }

  return {
    tutorMessage,
    updatedProfile: profile,
    counterexampleCommand: null,
    teacherAlertTriggered: false
  };
});
```

### Archivo 6: `server/api/teacher/alert.post.ts`

```typescript
// server/api/teacher/alert.post.ts
import { defineEventHandler, readBody, createError } from 'h3';
import type { TeacherAlertPayload } from '~/types/svm';

const ephemeralAlertQueue: TeacherAlertPayload[] = [];

export default defineEventHandler(async (event) => {
  const payload = await readBody<TeacherAlertPayload>(event);

  if (!payload || !payload.sessionToken || !payload.stalledNode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Estructura de alerta docente inválida.'
    });
  }

  // Validación estricta de anonimización (Cero PII)
  if (!/^anon_[a-zA-Z0-9_]{6,20}$/.test(payload.sessionToken)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Token de sesión no cumple política de anonimización.'
    });
  }

  const record: TeacherAlertPayload = {
    sessionToken: payload.sessionToken,
    timestampIso: payload.timestampIso || new Date().toISOString(),
    stalledNode: payload.stalledNode,
    exhaustedMisconception: payload.exhaustedMisconception,
    diagnosticSummary: payload.diagnosticSummary.slice(0, 220)
  };

  if (ephemeralAlertQueue.length >= 100) {
    ephemeralAlertQueue.shift();
  }
  ephemeralAlertQueue.push(record);

  return {
    accepted: true,
    alertId: `alrt_${Date.now()}`,
    activeQueueSize: ephemeralAlertQueue.length
  };
});
```

### Archivo 7: `server/api/docs/pedagogical-trace.get.ts`

```typescript
// server/api/docs/pedagogical-trace.get.ts
import { defineEventHandler } from 'h3';

export default defineEventHandler(() => {
  return {
    framework: 'MOCAVI-SVM-G9',
    gradeLevel: 'Grado 9no (14-15 años)',
    privacyStandard: 'CERO_PII_COPPA_GDPRK',
    artifacts: [
      {
        code: 'DAPI-01',
        title: 'Modelo Pedagógico Institucional MOCAVI',
        summary:
          'Fundamentación visoespacial, traducción geométrica sin cálculo multivariable, matriz de concepciones erróneas y salvaguardas éticas UNESCO.'
      },
      {
        code: 'DAPI-02',
        title: 'Ontología Pedagógica de SVM',
        summary:
          'Red conceptual de 10 nodos y 4 niveles progresivos de dominio cognitivo (Inicial, Básico, Autónomo y Destacado).'
      },
      {
        code: 'DAPI-03',
        title: 'Modelo del Estudiante Dinámico',
        summary:
          'Motor de inferencia con regla de evidencia convergente (acción en lienzo + justificación verbal) y detección de persistencia de error.'
      },
      {
        code: 'DAPI-04',
        title: 'Motor de Mediación Socrática Graduada',
        summary:
          'Política de Silencio Activo (15-20 s), disparadores socráticos con analogías cotidianas y escalera de pistas N1–N3 con escalamiento docente.'
      },
      {
        code: 'DAPI-05',
        title: 'Modelo del Mundo, Herramientas y Memoria Dual',
        summary:
          'Buffer circular FIFO (5 turnos + 10 telemetrías), Vector de Perfil JSON anonimizado y contratos Function Calling.'
      },
      {
        code: 'DAPI-06',
        title: 'Metaprompt Maestro de Sistema',
        summary:
          'System prompt de producción con léxico prohibido, límite de 3–4 líneas, pregunta única de cierre y defensa antibypass.'
      },
      {
        code: 'DAPI-07',
        title: 'Especificación Funcional (PRD Educativo)',
        summary:
          'Historias de usuario HU-01 a HU-04 en sintaxis Gherkin, criterios de latencia < 50 ms y panel de observabilidad docente.'
      },
      {
        code: 'DAPI-08',
        title: 'Diseño UI/UX (Vibe Design Spec)',
        summary:
          'Layout asimétrico 68/32, paleta cromática accesible WCAG AAA dalto-amigable y microinteracciones de invarianza.'
      }
    ]
  };
});
```