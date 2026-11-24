import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  RotateCcw,
  Box,
  Trash2,
  MousePointer2,
  Ruler,
  GitBranch,
  ChevronDown,
  Sparkles,
  Layers,
  CheckCircle2,
  Circle,
  ArrowRight,
  X,
} from 'lucide-react';
import type {
  CounterexampleCommand,
  DataPoint2D,
  DatasetTier,
  HighlightLayer,
  KernelType,
  MissionStepProgress,
  PointClass,
  SvmModelState,
  TelemetryEvent,
  TelemetryEventType,
} from '../types/svm';
import type { GuidedMissionDef } from '../data/missions';
import {
  WORLD_X_MIN,
  WORLD_X_MAX,
  WORLD_Y_MIN,
  WORLD_Y_MAX,
  computeElevationZ,
  computeLinearTrendLine,
  getOverfitBurstPoints,
} from '../lib/svmEngine';
import { SvmThreeView } from './SvmThreeView';

interface SvmCanvasLabProps {
  activeTier: DatasetTier;
  points: DataPoint2D[];
  model: SvmModelState;
  cParam: number;
  kernel: KernelType;
  is3DView: boolean;
  highContrast: boolean;
  activeMission: GuidedMissionDef | null;
  missionSteps: MissionStepProgress;
  counterexample: CounterexampleCommand | null;
  toastMessage: string | null;
  onSelectTier: (tier: DatasetTier) => void;
  onPointsChange: (next: DataPoint2D[]) => void;
  onCParamChange: (val: number) => void;
  onKernelChange: (kernel: KernelType) => void;
  onToggle3D: () => void;
  onResetScene: () => void;
  onEmitTelemetry: (type: TelemetryEventType, payload: TelemetryEvent['payload']) => void;
  onDraggingStateChange: (dragging: boolean) => void;
  onNextMission?: () => void;
  onOpenQuiz?: () => void;
  onDismissMission?: () => void;
}

const SCENARIOS: Array<{ id: DatasetTier; label: string }> = [
  { id: 'TIER_1_LINEAR', label: '1. Fácil (Recta)' },
  { id: 'TIER_2_SOFT_MARGIN', label: '2. Con Infiltrados' },
  { id: 'TIER_3_KERNEL_NONLINEAR', label: '3. Isla Rodeada' },
];

export const SvmCanvasLab: React.FC<SvmCanvasLabProps> = ({
  activeTier,
  points,
  model,
  cParam,
  kernel,
  is3DView,
  highContrast,
  activeMission,
  missionSteps,
  counterexample,
  toastMessage,
  onSelectTier,
  onPointsChange,
  onCParamChange,
  onKernelChange,
  onToggle3D,
  onResetScene,
  onEmitTelemetry,
  onDraggingStateChange,
  onNextMission,
  onOpenQuiz,
  onDismissMission,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  const [activeBrush, setActiveBrush] = useState<PointClass | 'ERASE'>('A');
  const [highlightLayer, setHighlightLayer] = useState<HighlightLayer>('ALL');
  const [hoveredInfo, setHoveredInfo] = useState<string>(
    'Arrastra cualquier punto o toca el mapa para agregar uno'
  );
  const [yaw3D, setYaw3D] = useState<number>(0.68);
  const [pitch3D, setPitch3D] = useState<number>(0.52);

  const draggingPointIdRef = useRef<string | null>(null);
  const draggingWasSvRef = useRef<boolean>(false);
  const dragStartAngleRef = useRef<number>(model.hyperplaneAngleDeg);
  const orbitDragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });
  const animPhaseRef = useRef<number>(0);

  // World <-> Screen mapping (exact 4:3 coordinate system [-5, 5] x [-3.75, 3.75])
  const toScreen = useCallback((x: number, y: number, w: number, h: number) => {
    const sx = ((x - WORLD_X_MIN) / (WORLD_X_MAX - WORLD_X_MIN)) * w;
    const sy = ((WORLD_Y_MAX - y) / (WORLD_Y_MAX - WORLD_Y_MIN)) * h;
    return { sx, sy };
  }, []);

  const toWorld = useCallback((sx: number, sy: number, w: number, h: number) => {
    const x = WORLD_X_MIN + (sx / w) * (WORLD_X_MAX - WORLD_X_MIN);
    const y = WORLD_Y_MAX - (sy / h) * (WORLD_Y_MAX - WORLD_Y_MIN);
    return {
      x: Number(Math.max(WORLD_X_MIN + 0.25, Math.min(WORLD_X_MAX - 0.25, x)).toFixed(2)),
      y: Number(Math.max(WORLD_Y_MIN + 0.25, Math.min(WORLD_Y_MAX - 0.25, y)).toFixed(2)),
    };
  }, []);

  // Main Canvas render function (2D SVM or 3D Topographic Kernel Elevation)
  const renderScene = useCallback(
    (phase: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      if (w <= 0 || h <= 0) return;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (is3DView) {
        draw3DElevation(ctx, w, h, phase);
        ctx.restore();
        return;
      }

      // 1. Background Alabaster (or True Obsidian in High-Contrast WCAG AAA mode)
      ctx.fillStyle = highContrast ? '#000000' : '#F8FAFC';
      ctx.fillRect(0, 0, w, h);

      // 2. Decision Regions & Margin Corridor
      const regionAlpha =
        highlightLayer === 'ALL' || highlightLayer === 'HYPERPLANE' ? 1 : 0.35;

      if (kernel === 'LINEAR') {
        drawLinearRegionsAndCorridor(ctx, w, h, regionAlpha);
      } else {
        drawNonlinearRegionsAndContours(ctx, w, h, regionAlpha);
      }

      // 3. Subtle Cartesian Grid
      ctx.strokeStyle = highContrast ? 'rgba(250, 204, 21, 0.22)' : 'rgba(203, 213, 225, 0.55)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      const stepX = w / 20;
      const stepY = h / 15;
      ctx.beginPath();
      for (let gx = stepX; gx < w; gx += stepX) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
      }
      for (let gy = stepY; gy < h; gy += stepY) {
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
      }
      ctx.stroke();

      // 4. Primary Cartesian Axes & Graduations
      const origin = toScreen(0, 0, w, h);
      ctx.strokeStyle = highContrast ? 'rgba(255, 255, 255, 0.7)' : 'rgba(148, 163, 184, 0.75)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(12, origin.sy);
      ctx.lineTo(w - 12, origin.sy);
      ctx.moveTo(origin.sx, 12);
      ctx.lineTo(origin.sx, h - 12);
      ctx.stroke();

      ctx.fillStyle = highContrast ? '#FACC15' : '#64748B';
      ctx.font = '600 10.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('X (+)', w - 26, origin.sy - 6);
      ctx.fillText('X (-)', 26, origin.sy - 6);
      ctx.textAlign = 'left';
      ctx.fillText('Y (+)', origin.sx + 8, 22);
      ctx.fillText('Y (-)', origin.sx + 8, h - 12);

      // Tick labels at -2.5 and +2.5
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const xMinus = toScreen(-2.5, 0, w, h);
      const xPlus = toScreen(2.5, 0, w, h);
      const yPlus = toScreen(0, 2.0, w, h);
      const yMinus = toScreen(0, -2.0, w, h);
      ctx.fillText('-2.5', xMinus.sx, origin.sy + 14);
      ctx.fillText('+2.5', xPlus.sx, origin.sy + 14);
      ctx.textAlign = 'right';
      ctx.fillText('+2.0', origin.sx - 8, yPlus.sy + 3);
      ctx.fillText('-2.0', origin.sx - 8, yMinus.sy + 3);

      // 5. Counterexample: Compare Linear Regression Trend vs SVM Fence
      if (counterexample?.counterexampleType === 'COMPARE_FENCE_VS_TREND') {
        const trend = computeLinearTrendLine(points);
        const p1 = toScreen(WORLD_X_MIN, trend.slope * WORLD_X_MIN + trend.intercept, w, h);
        const p2 = toScreen(WORLD_X_MAX, trend.slope * WORLD_X_MAX + trend.intercept, w, h);
        ctx.save();
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 2.8;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();

        // Label badge
        const midX = (p1.sx + p2.sx) * 0.5;
        const midY = (p1.sy + p2.sy) * 0.5 - 16;
        ctx.fillStyle = '#FEE2E2';
        ctx.strokeStyle = '#DC2626';
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        roundRect(ctx, midX - 102, midY - 12, 204, 22, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#991B1B';
        ctx.font = '600 11px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Tendencia (Regresión pasa encima)', midX, midY + 3);
        ctx.restore();
      }

      // 6. Counterexample: Overfit Test Burst (8 temporary ghost points)
      if (counterexample?.counterexampleType === 'INJECT_OVERFIT_TEST_BURST') {
        const burst = getOverfitBurstPoints(activeTier);
        for (const bp of burst) {
          const { sx, sy } = toScreen(bp.x, bp.y, w, h);
          const pred = model.decisionFn(bp.x, bp.y) >= 0 ? 'A' : 'B';
          const isCorrect = pred === bp.cls;

          ctx.save();
          ctx.beginPath();
          ctx.arc(sx, sy, 11, 0, Math.PI * 2);
          ctx.fillStyle = isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(220, 38, 38, 0.25)';
          ctx.fill();
          ctx.strokeStyle = isCorrect ? '#059669' : '#DC2626';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = isCorrect ? '#047857' : '#B91C1C';
          ctx.font = '700 11px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(isCorrect ? '✓' : '✕', sx, sy + 0.5);
          ctx.restore();
        }
      }

      // 7. Data Points & Animated Violet Support Vector Rings
      const svSet = new Set(model.supportVectorIds);
      const showSvEmphasis = counterexample?.counterexampleType === 'HIGHLIGHT_SUPPORT_VECTORS';

      for (const p of points) {
        const { sx, sy } = toScreen(p.x, p.y, w, h);
        const isSv = svSet.has(p.id);
        const isDimmed =
          (highlightLayer === 'CLASS_A' && p.cls !== 'A') ||
          (highlightLayer === 'CLASS_B' && p.cls !== 'B') ||
          (highlightLayer === 'SV' && !isSv) ||
          (highlightLayer === 'HYPERPLANE' && !isSv) ||
          (showSvEmphasis && !isSv);

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.25 : 1;

        // Violet pulsing/dashed ring for Support Vectors
        if (isSv) {
          const pulseR = showSvEmphasis ? 18 + Math.sin(phase * 4) * 3 : 16;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(phase * 0.55);
          ctx.beginPath();
          ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
          ctx.fillStyle = showSvEmphasis
            ? 'rgba(124, 58, 237, 0.22)'
            : 'rgba(124, 58, 237, 0.12)';
          ctx.fill();
          ctx.strokeStyle = '#7C3AED';
          ctx.lineWidth = showSvEmphasis ? 3 : 2.5;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.restore();

          // Compact "PILAR SV" label badge (placed above for A, below for B to avoid clutter)
          if (model.supportVectorIds.length <= 7 || showSvEmphasis) {
            const labelY = p.cls === 'A' ? sy - 29 : sy + 24;
            ctx.fillStyle = '#7C3AED';
            roundRect(ctx, sx - 28, labelY - 9, 56, 17, 4);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '700 9.5px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(showSvEmphasis ? '🔒 PILAR' : 'PILAR SV', sx, labelY);
          }
        }

        // Point shadow
        ctx.shadowColor = 'rgba(15, 23, 42, 0.2)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        // Dual-coded geometry: Circle for Class A (#2563EB), Diamond for Class B (#EA580C)
        const r = isSv ? 8.5 : 7.5;
        ctx.fillStyle = p.cls === 'A' ? '#2563EB' : '#EA580C';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.2;

        if (p.cls === 'A') {
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          const dr = r + 1.5;
          ctx.beginPath();
          ctx.moveTo(sx, sy - dr);
          ctx.lineTo(sx + dr, sy);
          ctx.lineTo(sx, sy + dr);
          ctx.lineTo(sx - dr, sy);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      }

      ctx.restore();
    },
    [
      is3DView,
      highContrast,
      kernel,
      points,
      model,
      highlightLayer,
      counterexample,
      activeTier,
      yaw3D,
      pitch3D,
      toScreen,
    ]
  );

  // Helper: Draw exact Linear regions, margin corridor fill, dashed borders, hyperplane & distance callout
  const drawLinearRegionsAndCorridor = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    alpha: number
  ) => {
    const [w0, w1] = model.weights;
    const b = model.bias;
    const norm = Math.hypot(w0, w1);
    if (norm < 1e-5) return;

    const getLineEndpoints = (offset: number) => {
      // w0*x + w1*y + b = offset
      const pts: Array<{ x: number; y: number }> = [];
      if (Math.abs(w1) > 1e-5) {
        const yLeft = (offset - b - w0 * WORLD_X_MIN) / w1;
        const yRight = (offset - b - w0 * WORLD_X_MAX) / w1;
        if (yLeft >= WORLD_Y_MIN - 20 && yLeft <= WORLD_Y_MAX + 20)
          pts.push({ x: WORLD_X_MIN, y: yLeft });
        if (yRight >= WORLD_Y_MIN - 20 && yRight <= WORLD_Y_MAX + 20)
          pts.push({ x: WORLD_X_MAX, y: yRight });
      }
      if (pts.length < 2 && Math.abs(w0) > 1e-5) {
        const xBottom = (offset - b - w1 * WORLD_Y_MIN) / w0;
        const xTop = (offset - b - w1 * WORLD_Y_MAX) / w0;
        pts.push({ x: xBottom, y: WORLD_Y_MIN });
        pts.push({ x: xTop, y: WORLD_Y_MAX });
      }
      if (pts.length < 2) return null;
      return {
        p1: toScreen(pts[0].x, pts[0].y, w, h),
        p2: toScreen(pts[1].x, pts[1].y, w, h),
      };
    };

    ctx.save();
    ctx.globalAlpha = alpha;

    // Decision regions via fast pixel-exact clipping or coarse grid
    const centerLine = getLineEndpoints(0);
    const upperMargin = getLineEndpoints(1);
    const lowerMargin = getLineEndpoints(-1);

    // Fill Class A and Class B half-planes cleanly
    const cellW = 10;
    const cellH = 10;
    for (let px = 0; px < w; px += cellW) {
      for (let py = 0; py < h; py += cellH) {
        const world = toWorld(px + cellW / 2, py + cellH / 2, w, h);
        const f = w0 * world.x + w1 * world.y + b;
        if (Math.abs(f) <= 1) {
          ctx.fillStyle = highContrast
            ? 'rgba(74, 222, 128, 0.26)'
            : 'rgba(209, 250, 229, 0.55)';
        } else if (f > 1) {
          ctx.fillStyle = highContrast
            ? 'rgba(56, 189, 248, 0.16)'
            : 'rgba(219, 234, 254, 0.45)';
        } else {
          ctx.fillStyle = highContrast
            ? 'rgba(251, 146, 60, 0.16)'
            : 'rgba(255, 237, 213, 0.45)';
        }
        ctx.fillRect(px, py, cellW, cellH);
      }
    }

    // Dashed margin lines
    if (upperMargin) {
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(upperMargin.p1.sx, upperMargin.p1.sy);
      ctx.lineTo(upperMargin.p2.sx, upperMargin.p2.sy);
      ctx.stroke();
    }
    if (lowerMargin) {
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(lowerMargin.p1.sx, lowerMargin.p1.sy);
      ctx.lineTo(lowerMargin.p2.sx, lowerMargin.p2.sy);
      ctx.stroke();
    }

    // Solid Central Hyperplane
    if (centerLine) {
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(centerLine.p1.sx, centerLine.p1.sy);
      ctx.lineTo(centerLine.p2.sx, centerLine.p2.sy);
      ctx.stroke();

      // Distance callout badge right at the midpoint of the corridor
      const midWorldX = 0.2;
      const midWorldY = Math.abs(w1) > 1e-4 ? -(w0 * midWorldX + b) / w1 : 0;
      if (midWorldY > WORLD_Y_MIN + 0.6 && midWorldY < WORLD_Y_MAX - 0.6) {
        const cPt = toScreen(midWorldX, midWorldY, w, h);
        const halfM = (model.marginWidth / 2).toFixed(2);
        const nx = w0 / norm;
        const ny = w1 / norm;
        const edgePt = toScreen(
          midWorldX + nx * (model.marginWidth / 2),
          midWorldY + ny * (model.marginWidth / 2),
          w,
          h
        );

        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cPt.sx, cPt.sy);
        ctx.lineTo(edgePt.sx, edgePt.sy);
        ctx.stroke();

        const bx = cPt.sx + 12;
        const by = cPt.sy - 11;
        ctx.fillStyle = '#ECFDF5';
        ctx.strokeStyle = '#A7F3D0';
        ctx.lineWidth = 1;
        roundRect(ctx, bx, by, 108, 22, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#047857';
        ctx.font = '700 10.5px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Margen d = ${halfM} u`, bx + 54, by + 11);
      }
    }

    ctx.restore();
  };

  // Helper: Draw true smooth Polynomial or RBF decision regions + f=0 / f=±1 contour lines
  const drawNonlinearRegionsAndContours = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    alpha: number
  ) => {
    const cols = 104;
    const rows = 78;

    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas');
    }
    const off = offscreenRef.current;
    off.width = cols;
    off.height = rows;
    const octx = off.getContext('2d');
    if (!octx) return;

    const img = octx.createImageData(cols, rows);
    const data = img.data;
    const grid = new Float32Array(cols * rows);

    for (let r = 0; r < rows; r++) {
      const wy = WORLD_Y_MAX - ((r + 0.5) / rows) * (WORLD_Y_MAX - WORLD_Y_MIN);
      for (let c = 0; c < cols; c++) {
        const wx = WORLD_X_MIN + ((c + 0.5) / cols) * (WORLD_X_MAX - WORLD_X_MIN);
        const f = model.decisionFn(wx, wy);
        grid[r * cols + c] = f;
        const pIdx = (r * cols + c) * 4;

        if (Math.abs(f) <= 1.0) {
          // Soft emerald corridor
          data[pIdx] = 209;
          data[pIdx + 1] = 250;
          data[pIdx + 2] = 229;
          data[pIdx + 3] = Math.round(145 * alpha);
        } else if (f > 1.0) {
          // Class A blue tint
          data[pIdx] = 219;
          data[pIdx + 1] = 234;
          data[pIdx + 2] = 254;
          data[pIdx + 3] = Math.round(125 * alpha);
        } else {
          // Class B orange tint
          data[pIdx] = 255;
          data[pIdx + 1] = 237;
          data[pIdx + 2] = 213;
          data[pIdx + 3] = Math.round(125 * alpha);
        }
      }
    }

    octx.putImageData(img, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, w, h);

    // Draw crisp marching-cell contours for f = 0 (solid emerald) and f = ±1 (dashed emerald)
    const cw = w / cols;
    const ch = h / rows;

    const drawIsoContour = (level: number, stroke: string, width: number, dashed: boolean) => {
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.setLineDash(dashed ? [4, 4] : []);
      ctx.beginPath();
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const v00 = grid[r * cols + c] - level;
          const v10 = grid[r * cols + c + 1] - level;
          const v01 = grid[(r + 1) * cols + c] - level;
          const v11 = grid[(r + 1) * cols + c + 1] - level;

          const crossings: Array<[number, number]> = [];
          if ((v00 < 0) !== (v10 < 0)) {
            const t = v00 / (v00 - v10);
            crossings.push([(c + t + 0.5) * cw, (r + 0.5) * ch]);
          }
          if ((v10 < 0) !== (v11 < 0)) {
            const t = v10 / (v10 - v11);
            crossings.push([(c + 1.5) * cw, (r + t + 0.5) * ch]);
          }
          if ((v01 < 0) !== (v11 < 0)) {
            const t = v01 / (v01 - v11);
            crossings.push([(c + t + 0.5) * cw, (r + 1.5) * ch]);
          }
          if ((v00 < 0) !== (v01 < 0)) {
            const t = v00 / (v00 - v01);
            crossings.push([(c + 0.5) * cw, (r + t + 0.5) * ch]);
          }

          if (crossings.length >= 2) {
            ctx.moveTo(crossings[0][0], crossings[0][1]);
            ctx.lineTo(crossings[1][0], crossings[1][1]);
          }
        }
      }
      ctx.stroke();
      ctx.restore();
    };

    drawIsoContour(1, '#10B981', 1.8, true);
    drawIsoContour(-1, '#10B981', 1.8, true);
    drawIsoContour(0, '#059669', 3.2, false);
    ctx.restore();
  };

  // Helper: Interactive 3D Topographic Kernel Elevation (2D -> 3D)
  const draw3DElevation = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    phase: number
  ) => {
    // Clean deep indigo-slate laboratory backdrop (matches Stitch inverse surface #131b2e)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#131b2e');
    bgGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.67;
    const scale = Math.min(w, h) * 0.088;
    const cosY = Math.cos(yaw3D);
    const sinY = Math.sin(yaw3D);
    const sinP = Math.sin(pitch3D);

    const project = (x: number, y: number, z: number) => {
      const rx = x * cosY - y * sinY;
      const ry = x * sinY + y * cosY;
      const sx = cx + rx * scale;
      const sy = cy + ry * scale * sinP - z * scale * 0.92;
      return { sx, sy, depth: ry };
    };

    // 1. Base 2D grid floor (z = 0)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    for (let g = -4; g <= 4; g += 1) {
      const a1 = project(g, -4, 0);
      const a2 = project(g, 4, 0);
      ctx.beginPath();
      ctx.moveTo(a1.sx, a1.sy);
      ctx.lineTo(a2.sx, a2.sy);
      ctx.stroke();

      const b1 = project(-4, g, 0);
      const b2 = project(4, g, 0);
      ctx.beginPath();
      ctx.moveTo(b1.sx, b1.sy);
      ctx.lineTo(b2.sx, b2.sy);
      ctx.stroke();
    }

    // 2. Topographic elevation rings (mountain contour mesh)
    for (const r of [0.9, 1.8, 2.7, 3.6]) {
      const zRing = computeElevationZ(r, 0, kernel);
      ctx.beginPath();
      for (let a = 0; a <= 48; a++) {
        const theta = (a / 48) * Math.PI * 2;
        const p = project(Math.cos(theta) * r, Math.sin(theta) * r, zRing);
        if (a === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.35)';
      ctx.lineWidth = 1.25;
      ctx.setLineDash(r === 2.7 ? [] : [4, 4]);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 3. Translucent Emerald Flat Cutting Hyperplane Sheet at z = 1.15
    const zPlane = 1.15;
    const c1 = project(-3.8, -3.8, zPlane);
    const c2 = project(3.8, -3.8, zPlane);
    const c3 = project(3.8, 3.8, zPlane);
    const c4 = project(-3.8, 3.8, zPlane);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c1.sx, c1.sy);
    ctx.lineTo(c2.sx, c2.sy);
    ctx.lineTo(c3.sx, c3.sy);
    ctx.lineTo(c4.sx, c4.sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Sort points back-to-front by depth and draw drop-lines + elevated nodes
    const svSet = new Set(model.supportVectorIds);
    const projected = points
      .map((pt) => {
        const z = computeElevationZ(pt.x, pt.y, kernel);
        const top = project(pt.x, pt.y, z);
        const base = project(pt.x, pt.y, 0);
        return { pt, z, top, base, isSv: svSet.has(pt.id) };
      })
      .sort((a, b) => a.top.depth - b.top.depth);

    for (const item of projected) {
      // Base shadow dot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(item.base.sx, item.base.sy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Drop-line showing height z
      ctx.strokeStyle = item.z > zPlane ? 'rgba(96, 165, 250, 0.6)' : 'rgba(251, 146, 60, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(item.base.sx, item.base.sy);
      ctx.lineTo(item.top.sx, item.top.sy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Violet ring on SVs
      if (item.isSv) {
        ctx.beginPath();
        ctx.arc(item.top.sx, item.top.sy, 13 + Math.sin(phase * 3) * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#A78BFA';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Elevated node
      ctx.fillStyle = item.pt.cls === 'A' ? '#3B82F6' : '#F97316';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      if (item.pt.cls === 'A') {
        ctx.beginPath();
        ctx.arc(item.top.sx, item.top.sy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(item.top.sx, item.top.sy - 9.5);
        ctx.lineTo(item.top.sx + 9.5, item.top.sy);
        ctx.lineTo(item.top.sx, item.top.sy + 9.5);
        ctx.lineTo(item.top.sx - 9.5, item.top.sy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // 5. Crisp Educational Caption at Top-Left
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    roundRect(ctx, 16, 16, Math.min(w - 32, 470), 46, 10);
    ctx.fill();
    ctx.fillStyle = '#85F8C4';
    ctx.font = '700 12px "Outfit", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Dimensión Elevada 3D — Truco del Kernel', 28, 34);
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '400 11.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      'Una lámina verde plana corta el centro elevado sin tocar el anillo. Arrastra para rotar.',
      28,
      51
    );
  };

  // Resize observer + on-demand rendering (0% idle CPU, instant drag/interaction response)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      renderScene(animPhaseRef.current);
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    return () => {
      observer.disconnect();
    };
  }, [renderScene]);

  // Bounded pulse animation ONLY while HIGHLIGHT_SUPPORT_VECTORS counterexample is active
  useEffect(() => {
    if (counterexample?.counterexampleType !== 'HIGHLIGHT_SUPPORT_VECTORS') return;
    let rafId = 0;
    let lastTs = 0;
    const tick = (ts: number) => {
      if (ts - lastTs >= 80) {
        animPhaseRef.current += 0.14;
        renderScene(animPhaseRef.current);
        lastTs = ts;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [counterexample, renderScene]);

  // Pointer Interactions (Drag, Add, Delete, Orbit 3D)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    if (is3DView) {
      orbitDragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Hit test existing points (generous 18px touch target per DESIGN.md)
    const hitIdx = points.findIndex((p) => {
      const pos = toScreen(p.x, p.y, rect.width, rect.height);
      return Math.hypot(pos.sx - sx, pos.sy - sy) <= 18;
    });

    if (hitIdx !== -1) {
      const hitPt = points[hitIdx];
      // Delete if Erase mode or right-click
      if (activeBrush === 'ERASE' || e.button === 2) {
        const sameClassCount = points.filter((p) => p.cls === hitPt.cls).length;
        if (sameClassCount <= 2) {
          setHoveredInfo('Conserva al menos 2 puntos por barrio para calcular la frontera.');
          return;
        }
        const next = points.filter((p) => p.id !== hitPt.id);
        onPointsChange(next);
        onEmitTelemetry('POINT_REMOVED', {
          pointId: hitPt.id,
          x: hitPt.x,
          y: hitPt.y,
          marginWidth: model.marginWidth,
          svCount: model.supportVectorIds.length,
          cValue: cParam,
          kernel,
        });
        return;
      }

      draggingPointIdRef.current = hitPt.id;
      draggingWasSvRef.current = model.supportVectorIds.includes(hitPt.id);
      dragStartAngleRef.current = model.hyperplaneAngleDeg;
      onDraggingStateChange(true);
      setHoveredInfo(
        `${draggingWasSvRef.current ? 'Pilar SV' : 'Punto interior'} ${hitPt.cls === 'A' ? 'Azul' : 'Naranja'} (${hitPt.x.toFixed(1)}, ${hitPt.y.toFixed(1)})`
      );
      return;
    }

    // Clicked empty space -> add point if brush is A or B
    if (activeBrush === 'A' || activeBrush === 'B') {
      const world = toWorld(sx, sy, rect.width, rect.height);
      const newPt: DataPoint2D = {
        id: `pt_${Date.now().toString(36)}`,
        x: world.x,
        y: world.y,
        cls: activeBrush,
      };
      const distToHyperplane = Math.abs(model.decisionFn(world.x, world.y));
      const next = [...points, newPt];
      onPointsChange(next);

      const evtType: TelemetryEventType =
        kernel === 'LINEAR' && distToHyperplane < 0.14 ? 'POINT_ON_HYPERPLANE' : 'POINT_ADDED';
      onEmitTelemetry(evtType, {
        pointId: newPt.id,
        x: newPt.x,
        y: newPt.y,
        marginWidth: model.marginWidth,
        svCount: model.supportVectorIds.length,
        cValue: cParam,
        kernel,
      });
      setHoveredInfo(
        `Añadido punto ${activeBrush === 'A' ? 'Azul' : 'Naranja'} en (${newPt.x.toFixed(1)}, ${newPt.y.toFixed(1)})`
      );
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (is3DView) {
      if (orbitDragRef.current.active) {
        const dx = e.clientX - orbitDragRef.current.lastX;
        const dy = e.clientY - orbitDragRef.current.lastY;
        orbitDragRef.current.lastX = e.clientX;
        orbitDragRef.current.lastY = e.clientY;
        setYaw3D((prev) => prev + dx * 0.01);
        setPitch3D((prev) => Math.max(0.22, Math.min(1.1, prev + dy * 0.008)));
      }
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (draggingPointIdRef.current) {
      const world = toWorld(sx, sy, rect.width, rect.height);
      const next = points.map((p) =>
        p.id === draggingPointIdRef.current ? { ...p, x: world.x, y: world.y } : p
      );
      onPointsChange(next);
      setHoveredInfo(
        `Moviendo ${draggingWasSvRef.current ? 'Pilar SV' : 'punto interior'} → (${world.x.toFixed(1)}, ${world.y.toFixed(1)})`
      );
      return;
    }

    // Hover feedback
    const hit = points.find((p) => {
      const pos = toScreen(p.x, p.y, rect.width, rect.height);
      return Math.hypot(pos.sx - sx, pos.sy - sy) <= 16;
    });

    if (hit) {
      const isSv = model.supportVectorIds.includes(hit.id);
      canvas.style.cursor = activeBrush === 'ERASE' ? 'not-allowed' : 'grab';
      setHoveredInfo(
        `${isSv ? 'Pilar SV (borde)' : 'Punto interior'} ${hit.cls === 'A' ? 'Azul' : 'Naranja'} · (${hit.x.toFixed(1)}, ${hit.y.toFixed(1)})`
      );
    } else {
      canvas.style.cursor = activeBrush === 'ERASE' ? 'default' : 'crosshair';
    }
  };

  const handlePointerUp = () => {
    if (is3DView) {
      orbitDragRef.current.active = false;
      return;
    }
    if (draggingPointIdRef.current) {
      const movedId = draggingPointIdRef.current;
      const movedPt = points.find((p) => p.id === movedId);
      const wasSv = draggingWasSvRef.current;
      const deltaAngle = Math.abs(model.hyperplaneAngleDeg - dragStartAngleRef.current);

      draggingPointIdRef.current = null;
      onDraggingStateChange(false);

      if (movedPt) {
        onEmitTelemetry(wasSv ? 'POINT_DRAGGED_SV' : 'POINT_DRAGGED_INTERIOR', {
          pointId: movedPt.id,
          x: movedPt.x,
          y: movedPt.y,
          marginWidth: model.marginWidth,
          svCount: model.supportVectorIds.length,
          cValue: cParam,
          kernel,
          hyperplaneDeltaAngle: Number(deltaAngle.toFixed(2)),
          isSupportVector: wasSv,
        });
      }
    }
  };

  const marginStatus =
    model.marginWidth >= 1.6
      ? { text: '¡Segura!', cls: 'bg-[#d1fae5] text-[#002114]' }
      : model.marginWidth >= 0.85
        ? { text: 'Media', cls: 'bg-[#fef3c7] text-[#78350f]' }
        : { text: 'Angosta', cls: 'bg-[#ffdad6] text-[#93000a]' };

  const cLabel =
    cParam <= 0.7
      ? `${cParam.toFixed(1)} · Relajado`
      : cParam >= 3.2
        ? `${cParam.toFixed(1)} · Estricto`
        : `${cParam.toFixed(1)} · Equilibrado`;

  const activeMissionDone = activeMission
    ? activeMission.steps.every((s) => Boolean(missionSteps[s.id]))
    : false;

  return (
    <section
      aria-label="Laboratorio Interactivo SVM"
      className="w-full flex flex-col gap-3 bg-white rounded-2xl p-4 border border-[#dae2fd] shadow-[0_1px_4px_rgba(19,27,46,0.04)]"
    >
      {/* Active Guided Mission Strip (Continuity directly inside the Lab) */}
      {activeMission && (
        <div
          data-testid="active-mission-banner"
          className={`px-3.5 py-2.5 rounded-xl border flex flex-col gap-2 ${
            activeMissionDone
              ? 'bg-[#ecfdf5] border-[#a7f3d0]'
              : 'bg-[#eff6ff] border-[#b4c5ff]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded-md bg-[#004ac6] text-white font-mono text-[10.5px] font-bold shrink-0">
                Misión {activeMission.order}/4
              </span>
              <span className="font-display text-sm font-bold text-[#131b2e] truncate">
                {activeMission.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {activeMissionDone && activeMission.order < 4 && onNextMission && (
                <button
                  type="button"
                  onClick={onNextMission}
                  className="px-2.5 py-1 rounded-lg bg-[#006243] hover:bg-[#059669] text-white font-display text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Siguiente Misión</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
              {activeMissionDone && activeMission.order === 4 && onOpenQuiz && (
                <button
                  type="button"
                  onClick={onOpenQuiz}
                  className="px-2.5 py-1 rounded-lg bg-[#006243] hover:bg-[#059669] text-white font-display text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Hacer Evaluación</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
              {onDismissMission && (
                <button
                  type="button"
                  onClick={onDismissMission}
                  aria-label="Cerrar barra de misión"
                  className="p-1 rounded-md text-[#434655] hover:bg-white/70 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeMission.steps.map((step, idx) => {
              const checked = Boolean(missionSteps[step.id]);
              return (
                <span
                  key={step.id}
                  data-testid={`mission-step-${step.id}`}
                  data-done={checked ? 'true' : 'false'}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-medium ${
                    checked
                      ? 'bg-[#d1fae5] text-[#006243] font-semibold'
                      : 'bg-white text-[#131b2e] border border-[#dae2fd]'
                  }`}
                >
                  {checked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    {idx + 1}. {step.shortLabel}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Scenario Bar & Friendly Live Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#f2f3ff] p-2.5 rounded-xl">
        <div className="flex items-center gap-1.5 flex-wrap" role="tablist" aria-label="Mapas de prueba">
          {SCENARIOS.map((sc) => {
            const active = activeTier === sc.id;
            return (
              <button
                key={sc.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => onSelectTier(sc.id)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-display font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-white text-[#004ac6] shadow-xs ring-1 ring-[#dbe1ff]'
                    : 'text-[#434655] hover:text-[#131b2e] hover:bg-[#e2e7ff]/70'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-2 h-2 rounded-full ${active ? 'bg-[#004ac6]' : 'bg-[#c3c6d7]'}`}
                />
                <span>{sc.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Geometric Metrics */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            data-testid="margin-metric"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12.5px] font-display font-semibold ${marginStatus.cls}`}
          >
            <Ruler className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Ancho de calle:</span>
            <span className="font-mono tabular-nums font-semibold">
              {model.marginWidth.toFixed(2)} ({marginStatus.text})
            </span>
          </div>

          <div
            data-testid="sv-metric"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#dae2fd] text-[#004ac6] text-[12.5px] font-display font-semibold"
          >
            <GitBranch className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Puntos clave:</span>
            <span className="font-mono tabular-nums text-[#131b2e]">
              {model.supportVectorIds.length}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive 4:3 Cartesian 2D Canvas OR Real Three.js 3D Kernel Explorer */}
      <div
        data-testid="svm-canvas-container"
        data-kernel={kernel}
        data-3d={is3DView ? 'true' : 'false'}
        data-sv-count={model.supportVectorIds.length}
        data-margin-width={model.marginWidth.toFixed(2)}
        className="relative w-full aspect-[4/3] min-h-[410px] max-h-[550px] bg-[#F8FAFC] rounded-xl overflow-hidden border border-[#e2e7ff] select-none"
      >
        {is3DView ? (
          <SvmThreeView
            points={points}
            model={model}
            kernel={kernel}
            highContrast={highContrast}
          />
        ) : (
          <canvas
            ref={canvasRef}
            data-testid="svm-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full block touch-none"
          />
        )}

        {/* Epistemic Invariance / Feedback Toast */}
        {toastMessage && !is3DView && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-lg bg-[#131b2e]/92 text-[#eef0ff] text-xs font-medium shadow-md max-w-[92%] text-center"
          >
            {toastMessage}
          </div>
        )}

        {/* Active Automatic Visual Counterexample Banner */}
        {counterexample && (
          <div
            role="alert"
            data-testid="counterexample-banner"
            className="absolute bottom-3 right-3 max-w-xs bg-[#6d28d9] text-white px-3.5 py-2.5 rounded-xl shadow-lg border border-[#a78bfa]/60 text-xs leading-snug z-10"
          >
            <div className="font-display font-semibold flex items-center gap-1.5 mb-0.5">
              <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Pista Visual Automática</span>
            </div>
            <p className="text-white/95">{counterexample.caption}</p>
          </div>
        )}

        {/* Top-Right Interactive Tooltip (2D mode only; 3D view has its own clean HUD) */}
        {!is3DView && (
          <div className="pointer-events-none absolute top-2.5 right-2.5 bg-white/95 px-2.5 py-1 rounded-lg border border-[#dae2fd] shadow-2xs font-mono text-[10.5px] text-[#131b2e] flex items-center gap-1.5 max-w-[65%]">
            <MousePointer2 className="w-3.5 h-3.5 text-[#004ac6] shrink-0" aria-hidden="true" />
            <span className="truncate">{hoveredInfo}</span>
          </div>
        )}

        {/* Bottom-Left Interactive Layer-Isolation Legend (2D mode) */}
        {!is3DView && (
          <div
            aria-label="Leyenda del mapa"
            className="absolute bottom-3 left-3 bg-white/95 p-2 rounded-xl border border-[#dae2fd] shadow-sm text-[11.5px] flex flex-col gap-1"
          >
            <button
              type="button"
              onClick={() =>
                setHighlightLayer((prev) => (prev === 'CLASS_A' ? 'ALL' : 'CLASS_A'))
              }
              className={`flex items-center gap-2 px-1.5 py-0.5 rounded-md text-left transition-colors cursor-pointer ${
                highlightLayer === 'CLASS_A'
                  ? 'bg-[#eff6ff] text-[#1d4ed8] font-semibold'
                  : 'text-[#131b2e] hover:bg-[#f2f3ff]'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-[#2563EB] shrink-0" aria-hidden="true" />
              <span>Equipo Azul</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setHighlightLayer((prev) => (prev === 'CLASS_B' ? 'ALL' : 'CLASS_B'))
              }
              className={`flex items-center gap-2 px-1.5 py-0.5 rounded-md text-left transition-colors cursor-pointer ${
                highlightLayer === 'CLASS_B'
                  ? 'bg-[#fff7ed] text-[#c2410c] font-semibold'
                  : 'text-[#131b2e] hover:bg-[#f2f3ff]'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rotate-45 bg-[#EA580C] shrink-0 ml-0.5"
                aria-hidden="true"
              />
              <span>Equipo Naranja</span>
            </button>

            <button
              type="button"
              onClick={() => setHighlightLayer((prev) => (prev === 'SV' ? 'ALL' : 'SV'))}
              className={`flex items-center gap-2 px-1.5 py-0.5 rounded-md text-left transition-colors cursor-pointer ${
                highlightLayer === 'SV'
                  ? 'bg-[#f5f3ff] text-[#6d28d9] font-semibold'
                  : 'text-[#131b2e] hover:bg-[#f2f3ff]'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border-2 border-[#7C3AED] shrink-0"
                aria-hidden="true"
              />
              <span>Puntos Clave (Pilares)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setHighlightLayer((prev) => (prev === 'HYPERPLANE' ? 'ALL' : 'HYPERPLANE'))
              }
              className={`flex items-center gap-2 px-1.5 py-0.5 rounded-md text-left transition-colors cursor-pointer ${
                highlightLayer === 'HYPERPLANE'
                  ? 'bg-[#ecfdf5] text-[#047857] font-semibold'
                  : 'text-[#131b2e] hover:bg-[#f2f3ff]'
              }`}
            >
              <span className="w-3.5 h-1 bg-[#059669] rounded-full shrink-0" aria-hidden="true" />
              <span>Calle Separadora</span>
            </button>

            {highlightLayer !== 'ALL' && (
              <button
                type="button"
                onClick={() => setHighlightLayer('ALL')}
                className="mt-0.5 pt-1 border-t border-[#e2e7ff] text-[10.5px] text-[#004ac6] font-semibold flex items-center gap-1 px-1.5 cursor-pointer"
              >
                <Layers className="w-3 h-3" aria-hidden="true" />
                <span>Ver todo</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls Strip (Simplified 9th-grade labels) */}
      <div className="w-full bg-[#f2f3ff] p-3 rounded-xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Class Brushes & Reset */}
        <div className="flex items-center gap-1.5 flex-wrap xl:flex-nowrap shrink-0">
          <button
            type="button"
            onClick={() => setActiveBrush('A')}
            aria-pressed={activeBrush === 'A'}
            className={`px-2.5 py-1.5 rounded-lg text-[12.5px] font-display font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeBrush === 'A'
                ? 'bg-[#2563EB] text-white shadow-xs ring-2 ring-[#93c5fd]'
                : 'bg-white text-[#1d4ed8] border border-[#dae2fd] hover:bg-[#eff6ff]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-2.5 h-2.5 rounded-full ${activeBrush === 'A' ? 'bg-white' : 'bg-[#2563EB]'}`}
            />
            <span>+ Azul</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBrush('B')}
            aria-pressed={activeBrush === 'B'}
            className={`px-2.5 py-1.5 rounded-lg text-[12.5px] font-display font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeBrush === 'B'
                ? 'bg-[#EA580C] text-white shadow-xs ring-2 ring-[#fdba74]'
                : 'bg-white text-[#a73a00] border border-[#dae2fd] hover:bg-[#fff7ed]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-2.5 h-2.5 rotate-45 ${activeBrush === 'B' ? 'bg-white' : 'bg-[#EA580C]'}`}
            />
            <span>+ Naranja</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBrush((prev) => (prev === 'ERASE' ? 'A' : 'ERASE'))}
            aria-pressed={activeBrush === 'ERASE'}
            aria-label="Modo borrar punto"
            title="Haz clic en un punto para borrarlo"
            className={`p-2 rounded-lg border transition-all cursor-pointer shrink-0 ${
              activeBrush === 'ERASE'
                ? 'bg-[#ba1a1a] text-white border-[#ba1a1a]'
                : 'bg-white text-[#434655] border-[#dae2fd] hover:bg-[#e2e7ff]'
            }`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onResetScene}
            aria-label="Reiniciar mapa actual"
            title="Reiniciar mapa"
            className="p-2 rounded-lg bg-white text-[#434655] border border-[#dae2fd] hover:bg-[#e2e7ff] transition-all cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Continuous Rigidez (C) Slider */}
        <div className="flex-1 min-w-[175px] flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-[12px]">
            <label
              htmlFor="svm-slider-c"
              className="font-display font-semibold text-[#131b2e] whitespace-nowrap"
            >
              Rigidez (C):
            </label>
            <span
              data-testid="c-value-label"
              className="font-mono tabular-nums text-[11px] font-semibold px-2 py-0.5 rounded bg-[#d1fae5] text-[#002114] whitespace-nowrap"
            >
              {cLabel}
            </span>
          </div>
          <input
            id="svm-slider-c"
            type="range"
            min={0.1}
            max={5.0}
            step={0.1}
            value={cParam}
            onChange={(e) => onCParamChange(parseFloat(e.target.value))}
            className="svm-slider w-full cursor-pointer"
          />
          <div className="flex justify-between text-[10.5px] text-[#434655] whitespace-nowrap gap-2">
            <span>Relajado (Calle ancha)</span>
            <span>Estricto (Cero errores)</span>
          </div>
        </div>

        {/* Shape (Kernel) Selector & Real 3D View Toggle */}
        <div className="flex items-center gap-2 flex-wrap xl:flex-nowrap shrink-0 xl:justify-end">
          <div className="relative">
            <label htmlFor="svm-kernel-select" className="sr-only">
              Forma de frontera
            </label>
            <select
              id="svm-kernel-select"
              value={kernel}
              onChange={(e) => onKernelChange(e.target.value as KernelType)}
              className="appearance-none bg-white text-[#131b2e] border border-[#dae2fd] font-display font-semibold text-[12.5px] py-1.5 pl-2.5 pr-7 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#004ac6] cursor-pointer"
            >
              <option value="LINEAR">Línea Recta</option>
              <option value="POLY">Curva Suave</option>
              <option value="RBF">Burbujas (Islas)</option>
            </select>
            <ChevronDown
              className="w-3.5 h-3.5 text-[#434655] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          <button
            type="button"
            onClick={onToggle3D}
            aria-pressed={is3DView}
            className={`px-3 py-1.5 rounded-lg font-display font-semibold text-[12.5px] whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              is3DView
                ? 'bg-[#004ac6] text-white shadow-sm'
                : 'bg-[#dae2fd] text-[#004ac6] hover:bg-[#c8d4fc]'
            }`}
          >
            <Box className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{is3DView ? 'Volver a 2D' : 'Ver en 3D'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
