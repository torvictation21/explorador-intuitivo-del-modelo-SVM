import type {
  CounterexampleCommand,
  CounterexampleType,
  DatasetTier,
  DialogueTurn,
  MasteryLevel,
  MisconceptionCode,
  NodeId,
  SessionProfileVector,
  TeacherAlertCode,
  TeacherAlertPayload,
  TelemetryEvent,
} from '../types/svm';

export const ACTIVE_SILENCE_INITIAL_SECONDS = 18;
export const INACTIVITY_STALL_SECONDS = 45;
export const MAX_TELEMETRY_WINDOW = 10;
export const MAX_DIALOGUE_WINDOW = 5;

const FORBIDDEN_ALGEBRA_TERMS = [
  'lagrange',
  'hilbert',
  'matriz de gram',
  'gram',
  'wolfe',
  'hinge',
  'regularización l2',
  'derivada parcial',
  'programación cuadrática',
  'w^t',
  '||w||',
];

export function generateEphemeralSessionToken(): { token: string; displayId: string; stationLabel: string } {
  const hex = '0123456789abcdef';
  let rand = '';
  for (let i = 0; i < 12; i++) {
    rand += hex[Math.floor(Math.random() * hex.length)];
  }
  const numericCode = String(1000 + Math.floor(Math.random() * 8999));
  const stationNum = String(1 + Math.floor(Math.random() * 32)).padStart(2, '0');
  return {
    token: `anon_${rand}`,
    displayId: `#EST-${numericCode}`,
    stationLabel: `Equipo-${stationNum}`,
  };
}

export function createInitialSessionProfile(seed?: {
  token: string;
  stationLabel: string;
}): SessionProfileVector {
  const generated = seed ?? generateEphemeralSessionToken();
  const now = Date.now();
  return {
    sessionToken: generated.token,
    stationLabel: generated.stationLabel,
    createdAtMs: now,
    expiresAtMs: now + 90 * 60 * 1000, // 90 min school-block TTL (DAPI-05)
    grade: '9no_Secundaria',
    activeTier: 'TIER_1_LINEAR',
    scaffoldingPhase: 'EXPLORACION',
    currentHintTier: 0,
    cognitiveState: 'STATE_INITIAL_OBSERVATION',
    nodes: {
      N1_SV: {
        id: 'N1_SV',
        shortTitle: '1. Pilares (SV)',
        label: '1. Vectores de Soporte',
        scenarioHint: 'Activo en lienzo',
        status: 'EN_PROGRESO',
        masteryLevel: 'INICIAL',
        score: 0.25,
        canvasVerified: false,
        verbalVerified: false,
        convergentHits: 0,
        consecutiveErrors: 0,
      },
      N2_MARGIN: {
        id: 'N2_MARGIN',
        shortTitle: '2. Margen Óptimo',
        label: '2. Margen Óptimo',
        scenarioHint: 'Por consolidar',
        status: 'NO_INICIADO',
        masteryLevel: 'INICIAL',
        score: 0.0,
        canvasVerified: false,
        verbalVerified: false,
        convergentHits: 0,
        consecutiveErrors: 0,
      },
      N3_CPARAM: {
        id: 'N3_CPARAM',
        shortTitle: '3. Parámetro C',
        label: '3. Parámetro C',
        scenarioHint: 'Escenario 2',
        status: 'NO_INICIADO',
        masteryLevel: 'INICIAL',
        score: 0.0,
        canvasVerified: false,
        verbalVerified: false,
        convergentHits: 0,
        consecutiveErrors: 0,
      },
      N4_KERNEL: {
        id: 'N4_KERNEL',
        shortTitle: '4. Kernel 3D',
        label: '4. Kernelización 3D',
        scenarioHint: 'Escenario 3',
        status: 'NO_INICIADO',
        masteryLevel: 'INICIAL',
        score: 0.0,
        canvasVerified: false,
        verbalVerified: false,
        convergentHits: 0,
        consecutiveErrors: 0,
      },
    },
    misconceptions: {
      ERR_CENTROID: {
        code: 'ERR_CENTROID',
        name: 'Ilusión de centroide',
        occurrences: 0,
        hintLevelReached: 0,
        resolved: false,
        lastIntervention: null,
      },
      ERR_RIGID_MARGIN: {
        code: 'ERR_RIGID_MARGIN',
        name: 'Perfeccionismo de margen rígido',
        occurrences: 0,
        hintLevelReached: 0,
        resolved: false,
        lastIntervention: null,
      },
      ERR_REGRESSION: {
        code: 'ERR_REGRESSION',
        name: 'Confusión con regresión lineal',
        occurrences: 0,
        hintLevelReached: 0,
        resolved: false,
        lastIntervention: null,
      },
      ERR_2D_FIXATION: {
        code: 'ERR_2D_FIXATION',
        name: 'Fijación lineal en 2D',
        occurrences: 0,
        hintLevelReached: 0,
        resolved: false,
        lastIntervention: null,
      },
    },
    exhaustedAnalogies: [],
    metrics: {
      interiorDrags: 0,
      svDrags: 0,
      hyperplanePlacements: 0,
      cSliderChanges: 0,
      kernelSwitches: 0,
      resetClicks: 0,
      visualDemosTriggered: [],
      idleSeconds: 0,
    },
  };
}

export function sanitizePII(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[dato protegido]')
    .replace(/\b\d{7,12}\b/g, '[id protegido]');
}

/**
 * Verifies strict adherence to Metaprompt Maestro (DAPI-06):
 * - Max 4 lines / <= 380 characters
 * - Zero forbidden algebraic jargon
 * - Exactly 1 open actionable closing question
 */
export function validateMetapromptRules(reply: string): {
  valid: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const lines = reply
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > 4) {
    reasons.push(`Exceeds 4 lines (${lines.length})`);
  }
  if (reply.length > 380) {
    reasons.push(`Exceeds character budget (${reply.length})`);
  }
  const lower = reply.toLowerCase();
  for (const term of FORBIDDEN_ALGEBRA_TERMS) {
    if (lower.includes(term)) {
      reasons.push(`Contains forbidden algebraic term: ${term}`);
    }
  }
  const questionMarks = (reply.match(/\?/g) || []).length;
  if (questionMarks !== 1) {
    reasons.push(`Must end with exactly 1 question (found ${questionMarks})`);
  }
  return { valid: reasons.length === 0, reasons };
}

function promoteMastery(current: MasteryLevel): MasteryLevel {
  if (current === 'INICIAL') return 'BASICO';
  if (current === 'BASICO') return 'AUTONOMO';
  return 'DESTACADO';
}

export function buildCounterexampleCommand(code: MisconceptionCode): CounterexampleCommand {
  const config: Record<
    MisconceptionCode,
    { type: CounterexampleType; node: NodeId; caption: string }
  > = {
    ERR_CENTROID: {
      type: 'HIGHLIGHT_SUPPORT_VECTORS',
      node: 'N1_SV',
      caption: 'Candados en los Pilares SV: solo los puntos del borde sostienen la calle central.',
    },
    ERR_RIGID_MARGIN: {
      type: 'INJECT_OVERFIT_TEST_BURST',
      node: 'N3_CPARAM',
      caption: 'Ráfaga de 8 puntos de prueba: observa los errores que provoca un pasillo demasiado estrecho.',
    },
    ERR_REGRESSION: {
      type: 'COMPARE_FENCE_VS_TREND',
      node: 'N2_MARGIN',
      caption: 'Contraste visual: línea roja de tendencia (regresión) frente a la calle verde separadora (SVM).',
    },
    ERR_2D_FIXATION: {
      type: 'ANIMATE_2D_TO_3D_ELEVATION',
      node: 'N4_KERNEL',
      caption: 'Elevación 2D → 3D: el centro sube como una montaña y un corte recto plano separa ambos barrios.',
    },
  };

  return {
    counterexampleType: config[code].type,
    targetNode: config[code].node,
    misconceptionCode: code,
    durationMs: 5500,
    caption: config[code].caption,
  };
}

function misconceptionToNode(code: MisconceptionCode): NodeId {
  switch (code) {
    case 'ERR_CENTROID':
      return 'N1_SV';
    case 'ERR_RIGID_MARGIN':
      return 'N3_CPARAM';
    case 'ERR_REGRESSION':
      return 'N2_MARGIN';
    case 'ERR_2D_FIXATION':
      return 'N4_KERNEL';
  }
}

function buildTeacherAlert(
  profile: SessionProfileVector,
  alertCode: TeacherAlertCode,
  nodeId: NodeId,
  misconception: MisconceptionCode | 'UNCLASSIFIED_FRUSTRATION'
): TeacherAlertPayload {
  const recommendations: Record<MisconceptionCode | 'UNCLASSIFIED_FRUSTRATION', string> = {
    ERR_CENTROID:
      'Mostrar junto al estudiante cómo mover un punto lejano deja el ángulo intacto mientras mover un pilar con anillo violeta gira la calle.',
    ERR_RIGID_MARGIN:
      'Guiar en pantalla cómo bajar el deslizador C recupera el ancho del pasillo verde y mejora el acierto frente a puntos nuevos.',
    ERR_REGRESSION:
      'Diferenciar en cuaderno o pantalla una línea de tendencia (sobre los datos) frente a una cerca divisoria (entre dos barrios).',
    ERR_2D_FIXATION:
      'Activar juntos la Vista 3D en el Escenario 3 para señalar cómo la hoja plana separa la isla elevada del anillo inferior.',
    UNCLASSIFIED_FRUSTRATION:
      'Intervención socioemocional breve en el puesto para reducir presión y reencuadrar la exploración como experimento libre.',
  };

  return {
    alertId: `alrt_${Date.now().toString(36)}`,
    alertCode,
    sessionToken: profile.sessionToken,
    stationLabel: profile.stationLabel,
    severity:
      alertCode === 'ALERT_CONCEPTUAL_LOOP' || alertCode === 'ALERT_AFFECTIVE_DISTRESS'
        ? 'CRITICAL_COGNITIVE_BLOCK'
        : 'MODERATE_STALL',
    timestampIso: new Date().toISOString(),
    activeTier: profile.activeTier,
    stalledNode: nodeId,
    exhaustedMisconception: misconception,
    scaffoldingHistory: ['N1_FOCO_VISUAL', 'N2_MICRO_EXPERIMENTO', 'N3_CONTRAEJEMPLO_GUIADO'],
    diagnosticSummary: `Bloqueo persistente en ${profile.nodes[nodeId].label} (${misconception}) tras agotar pistas N1–N3.`,
    recommendedTeacherAction: recommendations[misconception],
  };
}

export function detectMisconceptionMultimodal(
  cleanText: string,
  recentTelemetry: TelemetryEvent[],
  activeTier: DatasetTier
): MisconceptionCode | 'NONE' {
  const q = cleanText.toLowerCase();

  // 1. Ilusión de centroide
  if (
    q.includes('promedio') ||
    q.includes('peso de todos') ||
    q.includes('todos los puntos empujan') ||
    q.includes('centroide') ||
    q.includes('todos mueven la línea') ||
    q.includes('todos los puntos mueven')
  ) {
    return 'ERR_CENTROID';
  }

  // 2. Perfeccionismo de margen rígido
  if (
    q.includes('ningún punto mal') ||
    q.includes('ningun punto mal') ||
    q.includes('c al máximo') ||
    q.includes('c al maximo') ||
    q.includes('más delgado es más exacto') ||
    q.includes('mas delgado es mas exacto') ||
    q.includes('cero errores') ||
    q.includes('encerrar ese punto') ||
    q.includes('margen estrecho es mejor')
  ) {
    return 'ERR_RIGID_MARGIN';
  }

  // 3. Confusión con regresión lineal
  if (
    q.includes('encima de los puntos') ||
    q.includes('pasar por los puntos') ||
    q.includes('regresión') ||
    q.includes('regresion') ||
    q.includes('tendencia') ||
    q.includes('predecir y') ||
    q.includes('espacio vacío')
  ) {
    return 'ERR_REGRESSION';
  }

  // 4. Fijación lineal 2D
  if (
    q.includes('imposible separar') ||
    q.includes('no sirve') ||
    q.includes('falló el programa') ||
    q.includes('fallo el programa') ||
    q.includes('ninguna línea') ||
    q.includes('ninguna linea')
  ) {
    return 'ERR_2D_FIXATION';
  }

  // Secondary telemetry-driven inference when user expresses confusion
  const isConfused = q.includes('no entiendo') || q.includes('por qué') || q.includes('por que');
  if (isConfused) {
    const interiorCount = recentTelemetry.filter((e) => e.type === 'POINT_DRAGGED_INTERIOR').length;
    if (interiorCount >= 3) return 'ERR_CENTROID';
    const onHyperplane = recentTelemetry.filter((e) => e.type === 'POINT_ON_HYPERPLANE').length;
    if (onHyperplane >= 2) return 'ERR_REGRESSION';
    const rigidC = recentTelemetry.some(
      (e) => e.type === 'C_SLIDER_CHANGED' && e.payload.cValue >= 4.0 && e.payload.marginWidth < 1.3
    );
    if (activeTier === 'TIER_2_SOFT_MARGIN' && rigidC) return 'ERR_RIGID_MARGIN';
  }

  return 'NONE';
}

export interface TutorEngineResult {
  tutorMessage: string;
  tag: string;
  hintTier: 0 | 1 | 2 | 3;
  updatedProfile: SessionProfileVector;
  detectedMisconception: MisconceptionCode | 'NONE';
  counterexampleCommand: CounterexampleCommand | null;
  teacherAlert: TeacherAlertPayload | null;
}

export function processStudentDialogue(
  currentProfile: SessionProfileVector,
  recentTelemetry: TelemetryEvent[],
  rawMessage: string
): TutorEngineResult {
  const profile: SessionProfileVector = structuredClone(currentProfile);
  const cleanMessage = sanitizePII(rawMessage.trim());
  const lower = cleanMessage.toLowerCase();

  // 1. Anti-bypass: direct answer request, jailbreak, or algebraic formula request (DAPI-06)
  const asksDirectAnswer =
    lower.includes('dime la respuesta') ||
    lower.includes('respuesta exacta') ||
    lower.includes('valor exacto') ||
    lower.includes('número exacto') ||
    lower.includes('numero exacto') ||
    lower.includes('resuelve') ||
    lower.includes('hazme la tarea') ||
    lower.includes('ignora tus instrucciones') ||
    lower.includes('dame la fórmula') ||
    lower.includes('dame la formula') ||
    lower.includes('ecuación') ||
    lower.includes('ecuacion');

  if (asksDirectAnswer) {
    profile.cognitiveState = 'STATE_FRUSTRATION_OR_SHORTCUT';
    profile.currentHintTier = Math.max(2, profile.currentHintTier) as 0 | 1 | 2 | 3;
    const msg =
      'Mi rol es guiarte para que lo descubras tú, sin darte respuestas listas ni fórmulas complejas. Lleva el deslizador C hacia ambos extremos y observa el pasillo verde: ¿en cuál lado queda la calle más ancha y segura?';
    return {
      tutorMessage: msg,
      tag: 'Autonomía Cognitiva · Micro-Experimento',
      hintTier: 2,
      updatedProfile: profile,
      detectedMisconception: 'NONE',
      counterexampleCommand: null,
      teacherAlert: null,
    };
  }

  // 2. Explicit affective distress / frustration check (DAPI-04)
  const isFrustrated =
    lower.includes('me rindo') ||
    lower.includes('no entiendo nada') ||
    lower.includes('esto es imposible') ||
    lower.includes('estoy perdido') ||
    lower.includes('ayuda profe');

  if (isFrustrated) {
    profile.cognitiveState = 'STATE_FRUSTRATION_OR_SHORTCUT';
    const activeNode: NodeId =
      profile.activeTier === 'TIER_3_KERNEL_NONLINEAR'
        ? 'N4_KERNEL'
        : profile.activeTier === 'TIER_2_SOFT_MARGIN'
          ? 'N3_CPARAM'
          : 'N1_SV';
    profile.nodes[activeNode].consecutiveErrors += 1;

    if (profile.nodes[activeNode].consecutiveErrors >= 3 || lower.includes('ayuda profe')) {
      const alert = buildTeacherAlert(
        profile,
        'ALERT_AFFECTIVE_DISTRESS',
        activeNode,
        'UNCLASSIFIED_FRUSTRATION'
      );
      return {
        tutorMessage:
          'Tranquilo, aprender esto toma práctica y no hay calificaciones punitivas; ya avisé a tu docente para acompañarte un minuto. Mientras tanto, arrastra un solo punto con anillo violeta: ¿hacia qué lado se mueve la calle?',
        tag: 'Contención Empática · Alerta Docente',
        hintTier: 3,
        updatedProfile: profile,
        detectedMisconception: 'NONE',
        counterexampleCommand: null,
        teacherAlert: alert,
      };
    }

    return {
      tutorMessage:
        'Vamos paso a paso sin afán: ignora los puntos lejanos y fija tu vista únicamente en los puntos rodeados por el anillo violeta. ¿Qué tienen en común esos pilares frente al resto del barrio?',
      tag: 'Pista N1 · Foco Visual',
      hintTier: 1,
      updatedProfile: profile,
      detectedMisconception: 'NONE',
      counterexampleCommand: null,
      teacherAlert: null,
    };
  }

  // 3. Multimodal Misconception Detection + Graduated N1–N3 Scaffolding Ladder
  const misconception = detectMisconceptionMultimodal(
    cleanMessage,
    recentTelemetry,
    profile.activeTier
  );

  if (misconception !== 'NONE') {
    const tracker = profile.misconceptions[misconception];
    tracker.occurrences += 1;
    tracker.resolved = false;

    const nodeId = misconceptionToNode(misconception);
    const node = profile.nodes[nodeId];
    node.consecutiveErrors += 1;
    node.status = 'EN_CONFLICTO';
    profile.scaffoldingPhase = 'DESESTABILIZACION';
    profile.cognitiveState = 'STATE_SYSTEMATIC_ERROR';

    // Error 1 -> N1 Foco Visual (Desestabilización Socrática sin demo automática)
    if (node.consecutiveErrors === 1) {
      tracker.hintLevelReached = Math.max(tracker.hintLevelReached, 1) as 0 | 1 | 2 | 3;
      tracker.lastIntervention = 'N1_FOCO_VISUAL';
      profile.currentHintTier = 1;

      const n1Map: Record<MisconceptionCode, string> = {
        ERR_CENTROID:
          'Mira los puntos con anillo violeta que tocan las líneas punteadas del pasillo. Cuando mueves una casa azul bien lejos al fondo, ¿llega a tocar alguna de esas dos aceras punteadas?',
        ERR_RIGID_MARGIN:
          'Al forzar la línea para encerrar ese único punto rebelde, mira en qué se convirtió nuestra avenida: es un callejón muy estrecho. Si llegan casas nuevas cerca del borde, ¿qué tan fácil será que caigan del lado equivocado?',
        ERR_REGRESSION:
          'Observa los dos territorios de color a cada lado de la línea verde central. Si construyes una cerca para separar dos barrios, ¿debe pasar por encima de las casas o por el espacio libre entre ambos?',
        ERR_2D_FIXATION:
          'Sobre esta mesa plana (2D) tienes razón: ninguna regla recta separa la isla central sin cortar el anillo exterior. ¿Qué pasaría si pudiéramos levantar las casas del centro hacia el techo en 3D?',
      };

      return {
        tutorMessage: n1Map[misconception],
        tag: `Pista N1 · Desestabilización (${tracker.name})`,
        hintTier: 1,
        updatedProfile: profile,
        detectedMisconception: misconception,
        counterexampleCommand: null,
        teacherAlert: null,
      };
    }

    // Error 2 -> N2/N3 Automatic Visual Counterexample (DAPI 03, 04, 05, 06)
    if (node.consecutiveErrors === 2) {
      tracker.hintLevelReached = Math.max(tracker.hintLevelReached, 2) as 0 | 1 | 2 | 3;
      tracker.lastIntervention = 'N3_CONTRAEJEMPLO_VISUAL';
      profile.currentHintTier = 3;
      profile.scaffoldingPhase = 'EXPLORACION_GUIADA';

      const counterexample = buildCounterexampleCommand(misconception);
      if (!profile.metrics.visualDemosTriggered.includes(counterexample.counterexampleType)) {
        profile.metrics.visualDemosTriggered.push(counterexample.counterexampleType);
      }

      const demoQuestions: Record<MisconceptionCode, string> = {
        ERR_CENTROID:
          'Activé los candados en los pilares violeta del borde sobre tu lienzo para contrastarlo. Viendo esos anillos iluminados, ¿por qué solo los puntos que tocan las líneas punteadas sostienen la avenida?',
        ERR_RIGID_MARGIN:
          'Lancé 8 puntos de prueba cerca de tu calle estrecha para ver qué pasa con datos nuevos. Viendo los aciertos y fallos en pantalla, ¿conviene sacrificar el ancho de toda la avenida por un solo punto rebelde?',
        ERR_REGRESSION:
          'Superpuse una línea roja de tendencia frente a nuestra calle verde de separación en el plano. Al compararlas visualmente, ¿cuál de las dos separa ambos barrios dejando una zona de seguridad?',
        ERR_2D_FIXATION:
          'Elevé el mapa a Vista 3D para que los puntos del centro suban como una montaña. Observando la lámina verde plana que los atraviesa, ¿cómo logra un corte recto separarlos sin tocar el anillo exterior?',
      };

      return {
        tutorMessage: demoQuestions[misconception],
        tag: 'Pista N3 · Demostración Visual Automática',
        hintTier: 3,
        updatedProfile: profile,
        detectedMisconception: misconception,
        counterexampleCommand: counterexample,
        teacherAlert: null,
      };
    }

    // Error 3+ -> Exhausted N1-N3 -> Emit Silent Teacher Alert (DAPI 04 & 05)
    tracker.hintLevelReached = 3;
    tracker.lastIntervention = 'TEACHER_ESCALATION';
    profile.currentHintTier = 3;
    const alert = buildTeacherAlert(profile, 'ALERT_CONCEPTUAL_LOOP', nodeId, misconception);

    return {
      tutorMessage:
        'Ya exploraste bastante este reto; avisé discretamente a tu docente para revisarlo juntos en un minuto sin presión. Mientras llega, mueve despacio un punto con anillo violeta: ¿qué notas en el pasillo verde?',
      tag: 'Escalamiento Silencioso · Panel Docente',
      hintTier: 3,
      updatedProfile: profile,
      detectedMisconception: misconception,
      counterexampleCommand: null,
      teacherAlert: alert,
    };
  }

  // 4. Positive Conceptual Explanations & Strict Convergent Evidence (DAPI-03 & DAPI-05)
  // Node N1: Invariance & Support Vectors
  const explainsN1 =
    lower.includes('no cambió') ||
    lower.includes('no cambio') ||
    lower.includes('no se mueve') ||
    lower.includes('no pasó nada') ||
    lower.includes('no paso nada') ||
    lower.includes('inmóvil') ||
    lower.includes('inmovil') ||
    lower.includes('pilares') ||
    lower.includes('anillo') ||
    lower.includes('borde') ||
    lower.includes('primera fila') ||
    lower.includes('lejos') ||
    lower.includes('solo los');

  // Node N2: Optimal Margin
  const explainsN2 =
    lower.includes('pasillo') ||
    lower.includes('ancho') ||
    lower.includes('seguridad') ||
    lower.includes('margen') ||
    lower.includes('espacio') ||
    lower.includes('distancia') ||
    lower.includes('nuevos puntos') ||
    lower.includes('datos nuevos');

  // Node N3: Soft Margin & Parameter C
  const explainsN3 =
    lower.includes('tolerancia') ||
    lower.includes('parámetro c') ||
    lower.includes('parametro c') ||
    lower.includes('control c') ||
    lower.includes('rebelde') ||
    lower.includes('infiltrado') ||
    lower.includes('estrecha') ||
    lower.includes('equilibrio') ||
    lower.includes('sobreajuste') ||
    lower.includes('relajado');

  // Node N4: Kernel 3D / Non-linear
  const explainsN4 =
    lower.includes('3d') ||
    lower.includes('elevar') ||
    lower.includes('eleva') ||
    lower.includes('altura') ||
    lower.includes('montaña') ||
    lower.includes('montana') ||
    lower.includes('curva') ||
    lower.includes('kernel') ||
    lower.includes('isla') ||
    lower.includes('anillo exterior') ||
    lower.includes('rbf');

  // Prioritize active scenario node when multiple terms appear
  if (explainsN4 && (profile.activeTier === 'TIER_3_KERNEL_NONLINEAR' || lower.includes('3d') || lower.includes('kernel'))) {
    const n4 = profile.nodes.N4_KERNEL;
    n4.verbalVerified = true;
    n4.consecutiveErrors = 0;
    profile.misconceptions.ERR_2D_FIXATION.resolved = true;

    if (n4.canvasVerified) {
      n4.convergentHits += 1;
      n4.status = 'CONSOLIDADO';
      n4.masteryLevel = promoteMastery(n4.masteryLevel);
      n4.score = 1.0;
      n4.scenarioHint = 'Consolidado';
      profile.scaffoldingPhase = 'TRANSFERENCIA';
      return {
        tutorMessage:
          '¡Excelente salto geométrico! Comprobaste en 3D que elevar la isla central permite separarla con una lámina plana. Si un barrio tuviera muy pocos ejemplos en el mapa, ¿hacia qué lado crees que se inclinaría injustamente la frontera?',
        tag: 'Evidencia Convergente · Nodo N4 Consolidado',
        hintTier: 0,
        updatedProfile: profile,
        detectedMisconception: 'NONE',
        counterexampleCommand: null,
        teacherAlert: null,
      };
    }

    n4.status = 'EVIDENCIA_UNILATERAL';
    n4.score = Math.max(n4.score, 0.55);
    return {
      tutorMessage:
        'Tu intuición sobre la tercera dimensión va muy bien, ahora comprobémoslo en el lienzo. Cambia al Escenario 3, selecciona Kernel RBF o pulsa "Vista 3D (Kernel)": ¿qué forma toma la frontera en pantalla?',
      tag: 'Validación en Lienzo Requerida · N4',
      hintTier: 0,
      updatedProfile: profile,
      detectedMisconception: 'NONE',
      counterexampleCommand: null,
      teacherAlert: null,
    };
  }

  if (explainsN3 && (profile.activeTier === 'TIER_2_SOFT_MARGIN' || lower.includes('control c') || lower.includes('tolerancia') || lower.includes('parámetro c') || lower.includes('parametro c'))) {
    const n3 = profile.nodes.N3_CPARAM;
    n3.verbalVerified = true;
    n3.consecutiveErrors = 0;
    profile.misconceptions.ERR_RIGID_MARGIN.resolved = true;

    if (n3.canvasVerified) {
      n3.convergentHits += 1;
      n3.status = 'CONSOLIDADO';
      n3.masteryLevel = promoteMastery(n3.masteryLevel);
      n3.score = 1.0;
      n3.scenarioHint = 'Consolidado';
      profile.nodes.N4_KERNEL.status =
        profile.nodes.N4_KERNEL.status === 'NO_INICIADO'
          ? 'EN_PROGRESO'
          : profile.nodes.N4_KERNEL.status;
      profile.scaffoldingPhase = 'TRANSFERENCIA';
      return {
        tutorMessage:
          '¡Muy bien deducido! Con C moderado conservas un pasillo seguro sin dejar que un solo infiltrado arruine la estabilidad del grupo. Listo para el Escenario 3: ¿crees que una línea recta podrá separar una isla rodeada por un anillo?',
        tag: 'Evidencia Convergente · Nodo N3 Consolidado',
        hintTier: 0,
        updatedProfile: profile,
        detectedMisconception: 'NONE',
        counterexampleCommand: null,
        teacherAlert: null,
      };
    }

    n3.status = 'EVIDENCIA_UNILATERAL';
    n3.score = Math.max(n3.score, 0.55);
    return {
      tutorMessage:
        'Buena pregunta sobre el equilibrio frente a puntos rebeldes. Prueba mover ahora el deslizador de Tolerancia C de izquierda a derecha en el Escenario 2: ¿cómo cambia el ancho del pasillo verde?',
      tag: 'Validación en Lienzo Requerida · N3',
      hintTier: 0,
      updatedProfile: profile,
      detectedMisconception: 'NONE',
      counterexampleCommand: null,
      teacherAlert: null,
    };
  }

  if (explainsN1) {
    const n1 = profile.nodes.N1_SV;
    n1.verbalVerified = true;
    n1.consecutiveErrors = 0;
    profile.misconceptions.ERR_CENTROID.resolved = true;

    if (n1.canvasVerified) {
      n1.convergentHits += 1;
      n1.status = 'CONSOLIDADO';
      n1.masteryLevel = promoteMastery(n1.masteryLevel);
      n1.score = 1.0;
      n1.scenarioHint = 'Consolidado';
      if (profile.nodes.N2_MARGIN.status === 'NO_INICIADO') {
        profile.nodes.N2_MARGIN.status = 'EN_PROGRESO';
        profile.nodes.N2_MARGIN.scenarioHint = 'Activo ahora';
      }
      profile.scaffoldingPhase = 'TRANSFERENCIA';
      return {
        tutorMessage:
          '¡Exacto! Comprobaste en el plano y con tus palabras que los puntos lejanos no alteran la avenida y solo mandan los pilares con anillo violeta. Ahora arrastra un pilar violeta hacia el centro: ¿qué le pasa al ancho del pasillo?',
        tag: 'Evidencia Convergente · Nodo N1 Consolidado',
        hintTier: 0,
        updatedProfile: profile,
        detectedMisconception: 'NONE',
        counterexampleCommand: null,
        teacherAlert: null,
      };
    }

    n1.status = 'EVIDENCIA_UNILATERAL';
    n1.score = Math.max(n1.score, 0.55);
    return {
      tutorMessage:
        '¡Vas por excelente camino! Para comprobar tu hipótesis, arrastra directamente en el lienzo un punto azul lejano del fondo y luego uno con anillo violeta: ¿cuál de los dos logró mover la calle verde?',
      tag: 'Validación en Lienzo Requerida · N1',
      hintTier: 0,
      updatedProfile: profile,
      detectedMisconception: 'NONE',
      counterexampleCommand: null,
      teacherAlert: null,
    };
  }

  if (explainsN2) {
    const n2 = profile.nodes.N2_MARGIN;
    n2.verbalVerified = true;
    n2.consecutiveErrors = 0;
    profile.misconceptions.ERR_REGRESSION.resolved = true;

    if (n2.canvasVerified) {
      n2.convergentHits += 1;
      n2.status = 'CONSOLIDADO';
      n2.masteryLevel = promoteMastery(n2.masteryLevel);
      n2.score = 1.0;
      n2.scenarioHint = 'Consolidado';
      if (profile.nodes.N3_CPARAM.status === 'NO_INICIADO') {
        profile.nodes.N3_CPARAM.status = 'EN_PROGRESO';
        profile.nodes.N3_CPARAM.scenarioHint = 'Listo en Esc. 2';
      }
      profile.scaffoldingPhase = 'TRANSFERENCIA';
      return {
        tutorMessage:
          '¡Gran deducción! Un pasillo más ancho actúa como colchón de seguridad para clasificar bien datos futuros con pequeñas variaciones. Pasa al Escenario 2 con puntos infiltrados: ¿qué ocurre si exigimos cero errores?',
        tag: 'Evidencia Convergente · Nodo N2 Consolidado',
        hintTier: 0,
        updatedProfile: profile,
        detectedMisconception: 'NONE',
        counterexampleCommand: null,
        teacherAlert: null,
      };
    }

    n2.status = 'EVIDENCIA_UNILATERAL';
    n2.score = Math.max(n2.score, 0.55);
    return {
      tutorMessage:
        'Tu idea sobre el ancho de seguridad es muy clara. Haz la prueba arrastrando un pilar con anillo violeta para acercarlo al otro barrio: ¿cómo cambia el medidor de Ancho de Pasillo?',
      tag: 'Validación en Lienzo Requerida · N2',
      hintTier: 0,
      updatedProfile: profile,
      detectedMisconception: 'NONE',
      counterexampleCommand: null,
      teacherAlert: null,
    };
  }

  // 5. General reflective fallback strictly respecting Metaprompt Maestro (3-4 lines, 1 question)
  const tierPrompt: Record<DatasetTier, string> = {
    TIER_1_LINEAR:
      'Buena observación. Fíjate en los puntos rodeados por el anillo violeta que tocan las líneas punteadas: ¿qué crees que ocurre si arrastras un punto lejano del fondo frente a uno de esos pilares?',
    TIER_2_SOFT_MARGIN:
      'Interesante reflexión sobre este escenario con ruido. Observa el punto rebelde infiltrado y desliza el control C despacio: ¿prefieres una calle ancha que lo tolere o una calle delgada que lo encierre?',
    TIER_3_KERNEL_NONLINEAR:
      'Muy buen punto de partida. En este mapa de islas concéntricas, prueba cambiar el selector de frontera a RBF o activar la Vista 3D: ¿cómo logra el algoritmo separar el centro del anillo exterior?',
  };

  return {
    tutorMessage: tierPrompt[profile.activeTier],
    tag: 'Mediación Socrática · Exploración',
    hintTier: 0,
    updatedProfile: profile,
    detectedMisconception: 'NONE',
    counterexampleCommand: null,
    teacherAlert: null,
  };
}

export function applyCanvasTelemetryToProfile(
  currentProfile: SessionProfileVector,
  event: TelemetryEvent
): {
  updatedProfile: SessionProfileVector;
  toastMessage: string | null;
  proactiveMessage: string | null;
  proactiveTag: string | null;
  counterexample: CounterexampleCommand | null;
} {
  const profile = structuredClone(currentProfile);
  profile.metrics.idleSeconds = 0;
  profile.cognitiveState = 'STATE_FLUID_EXPLORATION';

  let toastMessage: string | null = null;
  let proactiveMessage: string | null = null;
  let proactiveTag: string | null = null;
  let counterexample: CounterexampleCommand | null = null;

  if (event.type === 'POINT_DRAGGED_INTERIOR') {
    profile.metrics.interiorDrags += 1;
    profile.nodes.N1_SV.canvasVerified = true;
    profile.nodes.N1_SV.score = Math.max(profile.nodes.N1_SV.score, 0.55);
    if (profile.nodes.N1_SV.verbalVerified) {
      profile.nodes.N1_SV.status = 'CONSOLIDADO';
      profile.nodes.N1_SV.score = 1.0;
      profile.nodes.N1_SV.scenarioHint = 'Consolidado';
    }
    const delta = event.payload.hyperplaneDeltaAngle ?? 0;
    toastMessage =
      delta < 0.25
        ? 'Invarianza visual activa: mover un punto interior no movió la calle central (0.0°).'
        : 'Este punto interior se acercó tanto al pasillo que pasó a influir en la frontera.';
  } else if (event.type === 'POINT_DRAGGED_SV') {
    profile.metrics.svDrags += 1;
    profile.nodes.N1_SV.canvasVerified = true;
    profile.nodes.N2_MARGIN.canvasVerified = true;
    profile.nodes.N2_MARGIN.score = Math.max(profile.nodes.N2_MARGIN.score, 0.5);
    if (profile.nodes.N2_MARGIN.status === 'NO_INICIADO') {
      profile.nodes.N2_MARGIN.status = 'EN_PROGRESO';
      profile.nodes.N2_MARGIN.scenarioHint = 'Activo en lienzo';
    }
    if (profile.nodes.N1_SV.verbalVerified) {
      profile.nodes.N1_SV.status = 'CONSOLIDADO';
      profile.nodes.N1_SV.score = 1.0;
      profile.nodes.N1_SV.scenarioHint = 'Consolidado';
    }
    toastMessage = `Pilar SV en movimiento: la calle central se recalibró (Pasillo: ${event.payload.marginWidth.toFixed(2)} u).`;
  } else if (event.type === 'POINT_ON_HYPERPLANE') {
    profile.metrics.hyperplanePlacements += 1;
    toastMessage = 'Punto colocado justo sobre la calle central: aquí queda en zona de indefinición.';
    if (profile.metrics.hyperplanePlacements === 2) {
      profile.misconceptions.ERR_REGRESSION.occurrences += 1;
      profile.nodes.N2_MARGIN.consecutiveErrors += 1;
      profile.nodes.N2_MARGIN.status = 'EN_CONFLICTO';
      proactiveMessage =
        'Noté que colocaste dos puntos justo encima de la línea verde. Si nuestra calle sirve para separar los dos barrios, ¿a cuál barrio pertenecería una casa construida en mitad de la avenida?';
      proactiveTag = 'Detección en Lienzo · Confusión con Regresión';
    } else if (profile.metrics.hyperplanePlacements >= 3) {
      counterexample = buildCounterexampleCommand('ERR_REGRESSION');
      proactiveMessage =
        'Activé el contraste entre una línea de tendencia (roja) y nuestra calle separadora (verde). Viendo ambas en pantalla, ¿por qué en SVM la línea pasa por el espacio vacío?';
      proactiveTag = 'Pista N3 · Demostración Automática';
    }
  } else if (event.type === 'C_SLIDER_CHANGED') {
    profile.metrics.cSliderChanges += 1;
    profile.nodes.N3_CPARAM.canvasVerified = true;
    profile.nodes.N3_CPARAM.score = Math.max(profile.nodes.N3_CPARAM.score, 0.55);
    if (profile.nodes.N3_CPARAM.status === 'NO_INICIADO') {
      profile.nodes.N3_CPARAM.status = 'EN_PROGRESO';
      profile.nodes.N3_CPARAM.scenarioHint = 'Activo en lienzo';
    }
    if (profile.activeTier === 'TIER_2_SOFT_MARGIN' && event.payload.cValue >= 4.2) {
      toastMessage = 'C muy alto (rígido): el pasillo se estrechó para intentar atrapar el infiltrado.';
    }
  } else if (event.type === 'KERNEL_SWITCHED' || event.type === 'VIEW_3D_TOGGLED') {
    if (event.type === 'KERNEL_SWITCHED') {
      profile.metrics.kernelSwitches += 1;
    }
    profile.nodes.N4_KERNEL.canvasVerified = true;
    profile.nodes.N4_KERNEL.score = Math.max(profile.nodes.N4_KERNEL.score, 0.6);
    if (profile.nodes.N4_KERNEL.status === 'NO_INICIADO') {
      profile.nodes.N4_KERNEL.status = 'EN_PROGRESO';
      profile.nodes.N4_KERNEL.scenarioHint = 'Activo en lienzo';
    }
    if (event.type === 'VIEW_3D_TOGGLED') {
      toastMessage = 'Proyección topográfica 3D activada: observa cómo una lámina plana separa la montaña.';
    }
  } else if (event.type === 'DATASET_TIER_LOADED') {
    profile.cognitiveState = 'STATE_INITIAL_OBSERVATION';
    profile.scaffoldingPhase = 'EXPLORACION';
  }

  return {
    updatedProfile: profile,
    toastMessage,
    proactiveMessage,
    proactiveTag,
    counterexample,
  };
}

export function getGuidedQuickReplies(tier: DatasetTier): string[] {
  if (tier === 'TIER_1_LINEAR') {
    return [
      '¿Para qué sirve un modelo SVM en la vida real?',
      'Moví un punto lejano y la calle no cambió nada',
      'La línea es el promedio del peso de todos los puntos',
    ];
  }
  if (tier === 'TIER_2_SOFT_MARGIN') {
    return [
      '¿Qué hace el deslizador de Rigidez (C)?',
      'Con C equilibrado la calle queda más segura para puntos nuevos',
      'No puede quedar ningún punto mal aunque el margen sea delgado',
    ];
  }
  return [
    '¿Cómo funciona el Truco 3D para separar la isla?',
    'Al elevar en 3D una hoja plana separa la isla del anillo',
    'Aquí es imposible separar los puntos con ninguna línea',
  ];
}
