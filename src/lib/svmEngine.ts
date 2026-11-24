import type { DataPoint2D, DatasetTier, KernelType, SvmModelState } from '../types/svm';

export const WORLD_X_MIN = -5;
export const WORLD_X_MAX = 5;
export const WORLD_Y_MIN = -3.75;
export const WORLD_Y_MAX = 3.75;

const DEFAULT_GAMMA = 0.22;
const DEFAULT_POLY_DEGREE = 2;

export function evaluateKernel(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  kernel: KernelType,
  gamma = DEFAULT_GAMMA,
  polyDegree = DEFAULT_POLY_DEGREE
): number {
  if (kernel === 'LINEAR') {
    return x1 * x2 + y1 * y2;
  }
  if (kernel === 'POLY') {
    // Normalized polynomial kernel (x·x' / 6 + 1)^d for numerical stability on [-5, 5]
    const dot = (x1 * x2 + y1 * y2) / 6 + 1;
    return Math.pow(dot, polyDegree);
  }
  // RBF (Gaussian) kernel
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.exp(-gamma * (dx * dx + dy * dy));
}

export function getPresetDataset(tier: DatasetTier): {
  points: DataPoint2D[];
  defaultC: number;
  defaultKernel: KernelType;
} {
  if (tier === 'TIER_1_LINEAR') {
    // Cleanly separated clusters matching Stitch layout:
    // 5 interior blue + 2 SV blue, 4 interior orange + 2 SV orange across a wide ~2.1u corridor
    return {
      defaultC: 2.0,
      defaultKernel: 'LINEAR',
      points: [
        { id: 'a_in1', x: -3.7, y: 0.45, cls: 'A' },
        { id: 'a_in2', x: -3.0, y: 1.75, cls: 'A' },
        { id: 'a_in3', x: -2.0, y: 2.55, cls: 'A' },
        { id: 'a_in4', x: -0.9, y: 2.75, cls: 'A' },
        { id: 'a_in5', x: 0.65, y: 2.35, cls: 'A' },
        { id: 'a_sv1', x: -1.8, y: -0.1, cls: 'A' },
        { id: 'a_sv2', x: 1.8, y: 1.16, cls: 'A' },
        { id: 'b_sv1', x: -0.75, y: -2.05, cls: 'B' },
        { id: 'b_sv2', x: 2.85, y: -0.79, cls: 'B' },
        { id: 'b_in1', x: 1.4, y: -2.75, cls: 'B' },
        { id: 'b_in2', x: 2.5, y: -3.25, cls: 'B' },
        { id: 'b_in3', x: 3.6, y: -2.55, cls: 'B' },
        { id: 'b_in4', x: 4.15, y: -1.35, cls: 'B' },
      ],
    };
  }

  if (tier === 'TIER_2_SOFT_MARGIN') {
    // Separable core clusters + 2 rebel outlier points near/across the corridor
    return {
      defaultC: 0.8,
      defaultKernel: 'LINEAR',
      points: [
        { id: 't2_a1', x: -3.8, y: 2.4, cls: 'A' },
        { id: 't2_a2', x: -3.2, y: 1.2, cls: 'A' },
        { id: 't2_a3', x: -2.2, y: 2.5, cls: 'A' },
        { id: 't2_a4', x: -1.6, y: 0.9, cls: 'A' },
        { id: 't2_a5', x: -0.4, y: 2.1, cls: 'A' },
        { id: 't2_a6', x: 0.8, y: 1.8, cls: 'A' },
        { id: 't2_a_out', x: 1.35, y: -0.95, cls: 'A' }, // Outlier Azul infiltrado
        { id: 't2_b_out', x: -1.05, y: 0.65, cls: 'B' }, // Outlier Naranja infiltrado
        { id: 't2_b1', x: 0.2, y: -1.6, cls: 'B' },
        { id: 't2_b2', x: 1.6, y: -2.2, cls: 'B' },
        { id: 't2_b3', x: 2.5, y: -0.9, cls: 'B' },
        { id: 't2_b4', x: 3.2, y: -2.4, cls: 'B' },
        { id: 't2_b5', x: 3.9, y: -1.1, cls: 'B' },
      ],
    };
  }

  // TIER_3_KERNEL_NONLINEAR: Concentric island (Class A inside, Class B ring outside)
  return {
    defaultC: 2.0,
    defaultKernel: 'LINEAR',
    points: [
      { id: 't3_a1', x: -0.65, y: 0.55, cls: 'A' },
      { id: 't3_a2', x: 0.72, y: 0.48, cls: 'A' },
      { id: 't3_a3', x: 0.05, y: -0.78, cls: 'A' },
      { id: 't3_a4', x: -0.58, y: -0.42, cls: 'A' },
      { id: 't3_a5', x: 0.55, y: -0.35, cls: 'A' },
      { id: 't3_a6', x: 0.0, y: 0.15, cls: 'A' },
      { id: 't3_b1', x: -2.6, y: 1.9, cls: 'B' },
      { id: 't3_b2', x: 2.6, y: 1.9, cls: 'B' },
      { id: 't3_b3', x: -2.75, y: -1.8, cls: 'B' },
      { id: 't3_b4', x: 2.75, y: -1.8, cls: 'B' },
      { id: 't3_b5', x: 0.0, y: 2.65, cls: 'B' },
      { id: 't3_b6', x: 0.0, y: -2.65, cls: 'B' },
      { id: 't3_b7', x: -3.2, y: 0.05, cls: 'B' },
      { id: 't3_b8', x: 3.2, y: -0.05, cls: 'B' },
    ],
  };
}

export function getHiddenTestSet(tier: DatasetTier): Array<{ x: number; y: number; cls: 'A' | 'B' }> {
  if (tier === 'TIER_1_LINEAR') {
    return [
      { x: -2.5, y: 1.0, cls: 'A' },
      { x: -0.5, y: 1.5, cls: 'A' },
      { x: 0.8, y: 1.9, cls: 'A' },
      { x: 1.4, y: 0.9, cls: 'A' },
      { x: 0.5, y: -1.8, cls: 'B' },
      { x: 2.2, y: -1.2, cls: 'B' },
      { x: 3.1, y: -1.5, cls: 'B' },
      { x: -1.2, y: -2.2, cls: 'B' },
    ];
  }
  if (tier === 'TIER_2_SOFT_MARGIN') {
    // Clean underlying distribution without the 2 rebels — high C overfitting fails near the rebels
    return [
      { x: -2.8, y: 1.9, cls: 'A' },
      { x: -1.5, y: 1.4, cls: 'A' },
      { x: -0.9, y: 0.95, cls: 'A' },
      { x: -0.2, y: 1.2, cls: 'A' },
      { x: 1.0, y: 1.2, cls: 'A' },
      { x: 1.1, y: -1.3, cls: 'B' },
      { x: 1.65, y: -0.85, cls: 'B' },
      { x: 2.3, y: -1.5, cls: 'B' },
      { x: 0.4, y: -1.1, cls: 'B' },
      { x: 3.0, y: -1.7, cls: 'B' },
    ];
  }
  return [
    { x: -0.35, y: 0.3, cls: 'A' },
    { x: 0.4, y: -0.25, cls: 'A' },
    { x: 0.1, y: 0.65, cls: 'A' },
    { x: -0.5, y: -0.1, cls: 'A' },
    { x: -2.5, y: 0.9, cls: 'B' },
    { x: 2.4, y: 1.1, cls: 'B' },
    { x: 1.8, y: -2.0, cls: 'B' },
    { x: -1.9, y: -2.0, cls: 'B' },
  ];
}

export function getOverfitBurstPoints(tier: DatasetTier): DataPoint2D[] {
  const base = getHiddenTestSet(tier);
  return base.slice(0, 8).map((pt, i) => ({
    id: `burst_${i}`,
    x: pt.x,
    y: pt.y,
    cls: pt.cls,
    isTestBurst: true,
  }));
}

/**
 * Deterministic Sequential Minimal Optimization (SMO) solver for Soft-Margin Dual SVM.
 * Supports Linear, Polynomial (degree 2), and RBF kernels in < 5ms for interactive classroom datasets.
 * Guarantees true mathematical invariance when dragging non-support interior points.
 */
export function trainSvmModel(
  rawPoints: DataPoint2D[],
  kernel: KernelType,
  cParam: number,
  tier: DatasetTier = 'TIER_1_LINEAR'
): SvmModelState {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const points = rawPoints.filter((p) => !p.isTestBurst);
  const n = points.length;
  const C = Math.max(0.05, Math.min(20, cParam));
  const gamma = DEFAULT_GAMMA;
  const polyDegree = DEFAULT_POLY_DEGREE;

  const hasA = points.some((p) => p.cls === 'A');
  const hasB = points.some((p) => p.cls === 'B');

  if (n < 2 || !hasA || !hasB) {
    return {
      weights: [0.5, -0.5],
      bias: 0,
      alphas: [],
      trainPoints: [],
      kernel,
      cParam: C,
      gamma,
      polyDegree,
      supportVectorIds: [],
      violatorIds: [],
      marginWidth: 0,
      hyperplaneAngleDeg: 45,
      trainAccuracy: 1,
      hiddenTestAccuracy: 1,
      computeLatencyMs: 0,
      decisionFn: () => 0,
    };
  }

  const y: Array<1 | -1> = points.map((p) => (p.cls === 'A' ? 1 : -1));
  // Precompute Gram matrix K[i][j]
  const K: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const kval = evaluateKernel(
        points[i].x,
        points[i].y,
        points[j].x,
        points[j].y,
        kernel,
        gamma,
        polyDegree
      );
      K[i][j] = kval;
      K[j][i] = kval;
    }
  }

  const alphas = new Array<number>(n).fill(0);
  let b = 0;
  const tol = 1e-4;
  const eps = 1e-5;
  const maxPasses = 40;
  const maxTotalIters = 1400;

  const fCache = new Array<number>(n).fill(0);

  const computeF = (idx: number): number => {
    let sum = b;
    for (let k = 0; k < n; k++) {
      if (alphas[k] > 0) {
        sum += alphas[k] * y[k] * K[k][idx];
      }
    }
    return sum;
  };

  let passes = 0;
  let totalIters = 0;

  while (passes < maxPasses && totalIters < maxTotalIters) {
    let numChangedAlphas = 0;
    for (let i = 0; i < n; i++) {
      fCache[i] = computeF(i);
      const Ei = fCache[i] - y[i];
      const r2 = Ei * y[i];

      if ((r2 < -tol && alphas[i] < C) || (r2 > tol && alphas[i] > 0)) {
        // Deterministic second-choice heuristic: pick j maximizing |Ei - Ej|
        let bestJ = -1;
        let maxDeltaE = -1;
        for (let k = 0; k < n; k++) {
          if (k === i) continue;
          const Ek = computeF(k) - y[k];
          const delta = Math.abs(Ei - Ek);
          if (delta > maxDeltaE) {
            maxDeltaE = delta;
            bestJ = k;
          }
        }

        // Try bestJ first, then deterministic scan if step is too small
        const candidates: number[] = [];
        if (bestJ !== -1) candidates.push(bestJ);
        for (let offset = 1; offset < n; offset++) {
          const idx = (i + offset) % n;
          if (idx !== bestJ) candidates.push(idx);
        }

        for (const j of candidates) {
          const Ej = computeF(j) - y[j];
          const alphaIOld = alphas[i];
          const alphaJOld = alphas[j];

          let L: number;
          let H: number;
          if (y[i] !== y[j]) {
            L = Math.max(0, alphaJOld - alphaIOld);
            H = Math.min(C, C + alphaJOld - alphaIOld);
          } else {
            L = Math.max(0, alphaIOld + alphaJOld - C);
            H = Math.min(C, alphaIOld + alphaJOld);
          }

          if (Math.abs(H - L) < 1e-8) continue;

          const eta = 2 * K[i][j] - K[i][i] - K[j][j];
          if (eta >= -1e-9) continue;

          let alphaJNew = alphaJOld - (y[j] * (Ei - Ej)) / eta;
          if (alphaJNew > H) alphaJNew = H;
          else if (alphaJNew < L) alphaJNew = L;

          if (Math.abs(alphaJNew - alphaJOld) < eps * (alphaJNew + alphaJOld + eps)) {
            continue;
          }

          const alphaINew = alphaIOld + y[i] * y[j] * (alphaJOld - alphaJNew);

          const b1 =
            b -
            Ei -
            y[i] * (alphaINew - alphaIOld) * K[i][i] -
            y[j] * (alphaJNew - alphaJOld) * K[i][j];
          const b2 =
            b -
            Ej -
            y[i] * (alphaINew - alphaIOld) * K[i][j] -
            y[j] * (alphaJNew - alphaJOld) * K[j][j];

          if (alphaINew > eps && alphaINew < C - eps) {
            b = b1;
          } else if (alphaJNew > eps && alphaJNew < C - eps) {
            b = b2;
          } else {
            b = 0.5 * (b1 + b2);
          }

          alphas[i] = alphaINew < 1e-7 ? 0 : alphaINew > C - 1e-7 ? C : alphaINew;
          alphas[j] = alphaJNew < 1e-7 ? 0 : alphaJNew > C - 1e-7 ? C : alphaJNew;
          numChangedAlphas++;
          totalIters++;
          break;
        }
      }
    }

    if (numChangedAlphas === 0) {
      passes++;
    } else {
      passes = 0;
    }
  }

  // Refine bias using free support vectors (0 < alpha < C) for maximum centering precision
  let freeSum = 0;
  let freeCount = 0;
  for (let i = 0; i < n; i++) {
    if (alphas[i] > 1e-4 && alphas[i] < C - 1e-4) {
      let wx = 0;
      for (let j = 0; j < n; j++) {
        if (alphas[j] > 1e-6) {
          wx += alphas[j] * y[j] * K[j][i];
        }
      }
      freeSum += y[i] - wx;
      freeCount++;
    }
  }
  if (freeCount > 0) {
    b = freeSum / freeCount;
  }

  // Build active support vector subset for ultra-fast decision evaluation
  const activeIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (alphas[i] > 1e-4) {
      activeIndices.push(i);
    }
  }

  // Compute linear weights (exact for LINEAR kernel)
  let w0 = 0;
  let w1 = 0;
  if (kernel === 'LINEAR') {
    for (const i of activeIndices) {
      w0 += alphas[i] * y[i] * points[i].x;
      w1 += alphas[i] * y[i] * points[i].y;
    }
  }

  // Compute RKHS norm ||w||_H = sqrt(sum_i sum_j alpha_i alpha_j y_i y_j K(x_i, x_j))
  let wNormSq = 0;
  if (kernel === 'LINEAR') {
    wNormSq = w0 * w0 + w1 * w1;
  } else {
    for (const i of activeIndices) {
      for (const j of activeIndices) {
        wNormSq += alphas[i] * alphas[j] * y[i] * y[j] * K[i][j];
      }
    }
  }
  const wNorm = Math.sqrt(Math.max(1e-6, wNormSq));
  const rawMarginWidth = kernel === 'LINEAR' ? 2 / wNorm : Math.min(4.5, 2.2 / wNorm);
  const marginWidth = Number(Math.max(0.08, Math.min(6.0, rawMarginWidth)).toFixed(2));

  const trainPoints = points.map((p, idx) => ({
    id: p.id,
    x: p.x,
    y: p.y,
    yLabel: y[idx],
  }));

  const decisionFn = (x: number, yCoord: number): number => {
    if (kernel === 'LINEAR') {
      return w0 * x + w1 * yCoord + b;
    }
    let sum = b;
    for (const i of activeIndices) {
      sum +=
        alphas[i] *
        y[i] *
        evaluateKernel(points[i].x, points[i].y, x, yCoord, kernel, gamma, polyDegree);
    }
    return sum;
  };

  // Identify exact support vectors & margin violators
  const supportVectorIds: string[] = [];
  const violatorIds: string[] = [];
  let correctTrain = 0;

  for (let i = 0; i < n; i++) {
    const fVal = decisionFn(points[i].x, points[i].y);
    const funcMargin = y[i] * fVal;
    if (funcMargin >= 0) correctTrain++;
    if (funcMargin < 0.98) {
      violatorIds.push(points[i].id);
    }
    if (alphas[i] > 1e-3 || funcMargin <= 1.03) {
      supportVectorIds.push(points[i].id);
    }
  }

  // Evaluate hidden test accuracy to quantify generalization vs overfitting
  const hiddenSet = getHiddenTestSet(tier);
  let correctHidden = 0;
  for (const hp of hiddenSet) {
    const pred = decisionFn(hp.x, hp.y) >= 0 ? 'A' : 'B';
    if (pred === hp.cls) correctHidden++;
  }

  // Hyperplane angle in degrees (for Linear invariance telemetry)
  let hyperplaneAngleDeg = 0;
  if (kernel === 'LINEAR') {
    const angleRad = Math.atan2(-w0, w1);
    hyperplaneAngleDeg = Number((((angleRad * 180) / Math.PI + 360) % 180).toFixed(2));
  }

  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    weights: [w0, w1],
    bias: b,
    alphas,
    trainPoints,
    kernel,
    cParam: C,
    gamma,
    polyDegree,
    supportVectorIds,
    violatorIds,
    marginWidth,
    hyperplaneAngleDeg,
    trainAccuracy: Number((correctTrain / n).toFixed(2)),
    hiddenTestAccuracy: Number((correctHidden / hiddenSet.length).toFixed(2)),
    computeLatencyMs: Number((t1 - t0).toFixed(2)),
    decisionFn,
  };
}

/**
 * Computes 3D topographic elevation Z for the 2D -> 3D Kernel Trick visualization.
 */
export function computeElevationZ(x: number, y: number, kernel: KernelType): number {
  const r2 = x * x + y * y;
  if (kernel === 'RBF') {
    // Gaussian mountain peak centered at origin: center island rises cleanly above outer ring
    return 2.8 * Math.exp(-0.22 * r2);
  }
  if (kernel === 'POLY') {
    // Inverted paraboloid elevation: center high, outer ring low
    return Math.max(0, 2.7 - r2 * 0.18);
  }
  // Linear: gentle radial bowl showing why a flat lift helps separate concentric clusters
  return 2.6 * Math.exp(-0.2 * r2);
}

/**
 * Simple least-squares regression line across all points (for COMPARE_FENCE_VS_TREND counterexample)
 */
export function computeLinearTrendLine(points: DataPoint2D[]): { slope: number; intercept: number } {
  const clean = points.filter((p) => !p.isTestBurst);
  if (clean.length < 2) return { slope: 0, intercept: 0 };
  const meanX = clean.reduce((s, p) => s + p.x, 0) / clean.length;
  const meanY = clean.reduce((s, p) => s + p.y, 0) / clean.length;
  let num = 0;
  let den = 0;
  for (const p of clean) {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) * (p.x - meanX);
  }
  const slope = den < 1e-6 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  return { slope, intercept };
}
