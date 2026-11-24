import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateMissionStepsFromTelemetry,
  evaluateMissionStepsFromDialogue,
  computeCompletedMissions,
} from './progressStore';
import { computeQuizBadge } from '../data/quizQuestions';
import type { TelemetryEvent } from '../types/svm';

function makeEvt(
  type: TelemetryEvent['type'],
  overrides?: Partial<TelemetryEvent['payload']>
): TelemetryEvent {
  return {
    id: 'evt_test',
    timestampMs: Date.now(),
    type,
    payload: {
      marginWidth: 2.1,
      svCount: 4,
      cValue: 2.0,
      kernel: 'LINEAR',
      ...overrides,
    },
  };
}

test('Mission 1 auto-completes all 3 steps sequentially via canvas actions and student explanation', () => {
  const s1 = evaluateMissionStepsFromTelemetry({}, 'mission-1', makeEvt('POINT_DRAGGED_INTERIOR'));
  assert.equal(s1.nextSteps['m1-drag-far'], true);
  assert.deepEqual(s1.completedMissionIds, []);

  const s2 = evaluateMissionStepsFromTelemetry(
    s1.nextSteps,
    'mission-1',
    makeEvt('POINT_DRAGGED_SV')
  );
  assert.equal(s2.nextSteps['m1-drag-sv'], true);
  assert.deepEqual(s2.completedMissionIds, []);

  const s3 = evaluateMissionStepsFromDialogue(
    s2.nextSteps,
    'mission-1',
    'El punto con anillo violeta fue el único que movió la calle verde'
  );
  assert.equal(s3.nextSteps['m1-explain'], true);
  assert.deepEqual(s3.completedMissionIds, ['mission-1']);
});

test('Mission 3 tracks strict and relaxed C parameter exploration automatically', () => {
  const r1 = evaluateMissionStepsFromTelemetry(
    {},
    'mission-3',
    makeEvt('C_SLIDER_CHANGED', { cValue: 4.5 })
  );
  assert.equal(r1.nextSteps['m3-strict-c'], true);
  assert.equal(r1.nextSteps['m3-relaxed-c'], undefined);

  const r2 = evaluateMissionStepsFromTelemetry(
    r1.nextSteps,
    'mission-3',
    makeEvt('C_SLIDER_CHANGED', { cValue: 1.0 })
  );
  assert.equal(r2.nextSteps['m3-relaxed-c'], true);
});

test('Mission 4 tracks non-linear kernel selection, 3D exploration, and reflection', () => {
  const r1 = evaluateMissionStepsFromTelemetry(
    {},
    'mission-4',
    makeEvt('KERNEL_SWITCHED', { kernel: 'RBF' })
  );
  const r2 = evaluateMissionStepsFromTelemetry(
    r1.nextSteps,
    'mission-4',
    makeEvt('VIEW_3D_TOGGLED', { kernel: 'RBF' })
  );
  const r3 = evaluateMissionStepsFromDialogue(
    r2.nextSteps,
    'mission-4',
    'En 3D la montaña eleva la isla azul y la hoja plana los separa'
  );
  assert.ok(computeCompletedMissions(r3.nextSteps).includes('mission-4'));
});

test('Quiz mastery badge tiers map cleanly to score percentages', () => {
  assert.equal(computeQuizBadge(100).title, 'Maestro de Fronteras SVM');
  assert.equal(computeQuizBadge(75).title, 'Constructor Geométrico');
  assert.equal(computeQuizBadge(50).title, 'Aprendiz de Fronteras');
  assert.equal(computeQuizBadge(12).title, 'Explorador Inicial');
});
