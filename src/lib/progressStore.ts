import type {
  MissionId,
  MissionStepProgress,
  PersistedStudentProgress,
  TelemetryEvent,
} from '../types/svm';
import { GUIDED_MISSIONS } from '../data/missions';

export const PROGRESS_STORAGE_KEY = 'svm_mocavi_student_progress_v2';
export const PROGRESS_SCHEMA_VERSION = 2;

export function loadStudentProgress(): PersistedStudentProgress | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedStudentProgress;
    if (
      !parsed ||
      parsed.version !== PROGRESS_SCHEMA_VERSION ||
      !parsed.profile ||
      !parsed.sessionIdentity
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStudentProgress(data: PersistedStudentProgress): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota/private-browsing storage errors gracefully
  }
}

export function clearStudentProgress(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function computeCompletedMissions(steps: MissionStepProgress): MissionId[] {
  return GUIDED_MISSIONS.filter((mission) =>
    mission.steps.every((step) => Boolean(steps[step.id]))
  ).map((m) => m.id);
}

export function evaluateMissionStepsFromTelemetry(
  currentSteps: MissionStepProgress,
  activeMissionId: MissionId | null,
  event: TelemetryEvent
): {
  nextSteps: MissionStepProgress;
  newlyCompletedSteps: string[];
  completedMissionIds: MissionId[];
} {
  const next: MissionStepProgress = { ...currentSteps };
  const newlyCompletedSteps: string[] = [];

  const mark = (stepId: string) => {
    if (!next[stepId]) {
      next[stepId] = true;
      newlyCompletedSteps.push(stepId);
    }
  };

  // Mission 1: Drag interior point + Drag SV
  if (event.type === 'POINT_DRAGGED_INTERIOR') {
    mark('m1-drag-far');
  }
  if (event.type === 'POINT_DRAGGED_SV') {
    mark('m1-drag-sv');
    if (activeMissionId === 'mission-2' || next['m1-drag-far']) {
      mark('m2-narrow-street');
    }
  }

  // Mission 2: Add a new point
  if (event.type === 'POINT_ADDED') {
    mark('m2-add-point');
  }

  // Mission 3: Parameter C strict (>= 4.0) & relaxed (<= 1.5)
  if (event.type === 'C_SLIDER_CHANGED') {
    if (event.payload.cValue >= 4.0) {
      mark('m3-strict-c');
    }
    if (event.payload.cValue <= 1.5) {
      mark('m3-relaxed-c');
    }
  }

  // Mission 4: Non-linear kernel + 3D view
  if (
    event.type === 'KERNEL_SWITCHED' &&
    (event.payload.kernel === 'RBF' || event.payload.kernel === 'POLY')
  ) {
    mark('m4-kernel-rbf');
  }
  if (event.type === 'VIEW_3D_TOGGLED') {
    mark('m4-open-3d');
  }

  return {
    nextSteps: next,
    newlyCompletedSteps,
    completedMissionIds: computeCompletedMissions(next),
  };
}

export function evaluateMissionStepsFromDialogue(
  currentSteps: MissionStepProgress,
  activeMissionId: MissionId | null,
  studentMessage: string
): {
  nextSteps: MissionStepProgress;
  newlyCompletedSteps: string[];
  completedMissionIds: MissionId[];
} {
  const next: MissionStepProgress = { ...currentSteps };
  const newlyCompletedSteps: string[] = [];

  const mark = (stepId: string) => {
    if (!next[stepId]) {
      next[stepId] = true;
      newlyCompletedSteps.push(stepId);
    }
  };

  const trimmed = studentMessage.trim();
  if (trimmed.length >= 6) {
    if (activeMissionId === 'mission-1') mark('m1-explain');
    if (activeMissionId === 'mission-2') mark('m2-explain');
    if (activeMissionId === 'mission-3') mark('m3-explain');
    if (activeMissionId === 'mission-4') mark('m4-explain');

    // Also allow organic completion if student reflects on a concept after doing its canvas steps
    const lower = trimmed.toLowerCase();
    if (
      (next['m1-drag-far'] || next['m1-drag-sv']) &&
      (lower.includes('pilar') ||
        lower.includes('violeta') ||
        lower.includes('borde') ||
        lower.includes('no cambió') ||
        lower.includes('no cambio') ||
        lower.includes('lejos') ||
        lower.includes('no se mov'))
    ) {
      mark('m1-explain');
    }
    if (
      (next['m2-narrow-street'] || next['m2-add-point']) &&
      (lower.includes('ancha') ||
        lower.includes('pasillo') ||
        lower.includes('segur') ||
        lower.includes('margen') ||
        lower.includes('espacio'))
    ) {
      mark('m2-explain');
    }
    if (
      (next['m3-strict-c'] || next['m3-relaxed-c']) &&
      (lower.includes('infiltrad') ||
        lower.includes('rebelde') ||
        lower.includes('estricto') ||
        lower.includes('relajado') ||
        lower.includes('equilib') ||
        lower.includes('rigidez') ||
        lower.includes(' c'))
    ) {
      mark('m3-explain');
    }
    if (
      (next['m4-kernel-rbf'] || next['m4-open-3d']) &&
      (lower.includes('3d') ||
        lower.includes('montaña') ||
        lower.includes('montana') ||
        lower.includes('eleva') ||
        lower.includes('sube') ||
        lower.includes('hoja') ||
        lower.includes('lámina') ||
        lower.includes('lamina') ||
        lower.includes('isla') ||
        lower.includes('kernel'))
    ) {
      mark('m4-explain');
    }
  }

  return {
    nextSteps: next,
    newlyCompletedSteps,
    completedMissionIds: computeCompletedMissions(next),
  };
}
