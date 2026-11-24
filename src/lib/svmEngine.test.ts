import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPresetDataset,
  trainSvmModel,
  computeElevationZ,
} from './svmEngine';

test('Linear SMO achieves 100% accuracy and positive margin on Tier 1 clean data', () => {
  const { points, defaultC } = getPresetDataset('TIER_1_LINEAR');
  const model = trainSvmModel(points, 'LINEAR', defaultC, 'TIER_1_LINEAR');

  assert.equal(model.trainAccuracy, 1, 'Expected 100% accuracy on linearly separable Tier 1');
  assert.ok(model.marginWidth > 1.0, `Expected positive wide margin, got ${model.marginWidth}`);
  assert.ok(model.supportVectorIds.length >= 2, 'Expected at least 2 support vectors');
  assert.ok(model.supportVectorIds.length <= 6, 'Interior points should not all be SVs');
});

test('Structural invariance: moving a deep interior point keeps hyperplane angle unchanged', () => {
  const { points, defaultC } = getPresetDataset('TIER_1_LINEAR');
  const before = trainSvmModel(points, 'LINEAR', defaultC, 'TIER_1_LINEAR');

  // Identify a guaranteed non-SV interior point
  const interiorIdx = points.findIndex(
    (p) => !before.supportVectorIds.includes(p.id) && p.cls === 'A'
  );
  assert.ok(interiorIdx !== -1, 'Expected at least one interior point in Tier 1');

  const movedPoints = points.map((p, i) =>
    i === interiorIdx ? { ...p, x: p.x - 0.8, y: p.y + 0.4 } : p
  );
  const after = trainSvmModel(movedPoints, 'LINEAR', defaultC, 'TIER_1_LINEAR');

  const angleDiff = Math.abs(after.hyperplaneAngleDeg - before.hyperplaneAngleDeg);
  assert.ok(
    angleDiff < 0.5,
    `Expected hyperplane invariance (< 0.5 deg), got delta=${angleDiff.toFixed(3)} deg`
  );
});

test('Support vector sensitivity: moving a support vector shifts hyperplane or margin', () => {
  const { points, defaultC } = getPresetDataset('TIER_1_LINEAR');
  const before = trainSvmModel(points, 'LINEAR', defaultC, 'TIER_1_LINEAR');

  const svId = before.supportVectorIds[0];
  const movedPoints = points.map((p) =>
    p.id === svId ? { ...p, x: p.x + 1.1, y: p.y - 0.8 } : p
  );
  const after = trainSvmModel(movedPoints, 'LINEAR', defaultC, 'TIER_1_LINEAR');

  const marginChanged = Math.abs(after.marginWidth - before.marginWidth) > 0.05;
  const angleChanged = Math.abs(after.hyperplaneAngleDeg - before.hyperplaneAngleDeg) > 0.5;
  assert.ok(marginChanged || angleChanged, 'Dragging a Support Vector must alter margin or angle');
});

test('Soft-margin parameter C affects margin width on Tier 2 noisy data', () => {
  const { points } = getPresetDataset('TIER_2_SOFT_MARGIN');
  const relaxed = trainSvmModel(points, 'LINEAR', 0.2, 'TIER_2_SOFT_MARGIN');
  const strict = trainSvmModel(points, 'LINEAR', 5.0, 'TIER_2_SOFT_MARGIN');

  assert.ok(
    relaxed.marginWidth >= strict.marginWidth,
    `Expected relaxed C=0.2 margin (${relaxed.marginWidth}) >= strict C=5.0 margin (${strict.marginWidth})`
  );
});

test('RBF and Polynomial kernels separate Tier 3 concentric rings where Linear cannot', () => {
  const { points } = getPresetDataset('TIER_3_KERNEL_NONLINEAR');
  const linear = trainSvmModel(points, 'LINEAR', 2.0, 'TIER_3_KERNEL_NONLINEAR');
  const rbf = trainSvmModel(points, 'RBF', 2.0, 'TIER_3_KERNEL_NONLINEAR');
  const poly = trainSvmModel(points, 'POLY', 2.0, 'TIER_3_KERNEL_NONLINEAR');

  assert.ok(linear.trainAccuracy < 0.8, `Linear should struggle on concentric rings, got ${linear.trainAccuracy}`);
  assert.equal(rbf.trainAccuracy, 1, 'RBF must achieve 100% accuracy on concentric rings');
  assert.ok(poly.trainAccuracy >= 0.9, `Poly degree 2 should separate concentric rings, got ${poly.trainAccuracy}`);

  // 3D elevation puts center points higher than outer ring points
  const zCenter = computeElevationZ(0.2, 0.2, 'RBF');
  const zOuter = computeElevationZ(3.0, 0.0, 'RBF');
  assert.ok(zCenter > zOuter + 1.5, 'Center island must elevate substantially above outer ring in 3D');
});
