import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DIST_PATH = path.resolve(__dirname, 'dist');
const HAS_BUILT_DIST = fs.existsSync(path.join(DIST_PATH, 'index.html'));
const IS_PROD =
  process.env.NODE_ENV === 'production' ||
  (process.env.NODE_ENV !== 'development' && HAS_BUILT_DIST);

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface TutorRequestBody {
  studentMessage: string;
  history: Array<{ sender: 'STUDENT' | 'TUTOR'; text: string }>;
  canvasContext: {
    tierLabel: string;
    kernelLabel: string;
    cParam: number;
    marginWidth: number;
    svCount: number;
    trainAccuracy: number;
    hiddenTestAccuracy: number;
    is3DView: boolean;
    activeMissionTitle?: string | null;
    nextMissionStep?: string | null;
  };
  recentActions: string[];
  pedagogicalSignal: {
    detectedMisconception: string;
    hintTier: number;
    counterexampleCaption: string | null;
    asksDirectAnswer: boolean;
    isFrustrated: boolean;
    nodeJustConsolidated: string | null;
    teacherAlertTriggered: boolean;
  };
}

function buildSocraticSystemInstruction(reqBody: TutorRequestBody): string {
  const { canvasContext, recentActions, pedagogicalSignal } = reqBody;

  const signalDirectives: string[] = [];
  if (pedagogicalSignal.asksDirectAnswer) {
    signalDirectives.push(
      'El estudiante pidió una respuesta directa o fórmula. Con amabilidad y cercanía dile que descubrirlo probando es más divertido y dale un mini-experimento de 1 paso en el lienzo.'
    );
  }
  if (pedagogicalSignal.isFrustrated) {
    signalDirectives.push(
      'El estudiante siente frustración. Valida su esfuerzo con calma (sin notas ni presión) y proponle una sola observación muy fácil.'
    );
  }
  if (pedagogicalSignal.detectedMisconception !== 'NONE') {
    signalDirectives.push(
      `Se detectó una idea incompleta (${pedagogicalSignal.detectedMisconception}, nivel de pista N${pedagogicalSignal.hintTier}). Ayúdale a notar la contradicción visual en el mapa sin regañarlo ni dar la definición de golpe.`
    );
  }
  if (pedagogicalSignal.counterexampleCaption) {
    signalDirectives.push(
      `Acabas de activar una demostración visual automática en su pantalla: "${pedagogicalSignal.counterexampleCaption}". Haz referencia breve a lo que acaba de aparecer en el mapa.`
    );
  }
  if (pedagogicalSignal.nodeJustConsolidated) {
    signalDirectives.push(
      `¡Celebración breve! El estudiante acaba de dominar la idea "${pedagogicalSignal.nodeJustConsolidated}" uniendo prueba en el mapa y explicación propia.`
    );
  }
  if (pedagogicalSignal.teacherAlertTriggered) {
    signalDirectives.push(
      'Se envió un aviso discreto al docente para apoyarlo un minuto; tranquilízalo con cariño.'
    );
  }

  return [
    'Eres el Tutor MOCAVI, un guía amigable, claro y curioso que enseña qué es un modelo SVM (Máquina de Vectores de Soporte) a estudiantes de 9° grado (14 años) en español sencillo.',
    '',
    'REGLAS ESTRICTAS DE RESPUESTA:',
    '1. RESPONDE SIEMPRE LO QUE EL ESTUDIANTE PREGUNTÓ: Si pregunta para qué sirve en la vida real, qué es un botón, qué pasa si hace algo o cómo funciona SVM, dale primero una explicación clara y cercana usando ejemplos de su mundo (filtro de correo spam, separar canciones, barrios azul y naranja, calle verde, infiltrados, montaña 3D). Nunca lo ignores ni respondas con frases genéricas.',
    '2. LENGUAJE DE 9° GRADO (CERO JERGA UNIVERSITARIA): Prohibido usar términos como Lagrange, Hilbert, matriz de Gram, regularización L2, derivada parcial, función de pérdida, programación cuadrática, w^T o ||w||. En su lugar di: "calle verde", "pasillo de seguridad", "puntos clave con anillo violeta", "rigidez C", "truco 3D".',
    '3. BREVEDAD TOTAL: Máximo 3 frases cortas (máximo 330 caracteres en total). Nada de párrafos largos ni listas extensas.',
    '4. CIERRE SOCRÁTICO OBLIGATORIO: Termina con exactamente UNA pregunta corta y concreta (1 solo signo "?") que invite al estudiante a mirar o probar algo en el simulador.',
    '5. SIN RESPUESTAS DE EXAMEN NI FÓRMULAS: Guía mediante experimentos visuales y preguntas.',
    '',
    'ESTADO ACTUAL DEL SIMULADOR DEL ESTUDIANTE:',
    `- Escenario: ${canvasContext.tierLabel}`,
    `- Forma de frontera: ${canvasContext.kernelLabel} (${canvasContext.is3DView ? 'Vista 3D activa' : 'Vista 2D plana'})`,
    `- Rigidez (C): ${canvasContext.cParam.toFixed(1)} | Ancho de calle: ${canvasContext.marginWidth.toFixed(2)} | Puntos clave (anillo violeta): ${canvasContext.svCount}`,
    `- Aciertos actuales: ${Math.round(canvasContext.trainAccuracy * 100)}% en mapa, ${Math.round(canvasContext.hiddenTestAccuracy * 100)}% en puntos nuevos`,
    canvasContext.activeMissionTitle
      ? `- Misión activa: ${canvasContext.activeMissionTitle} (Siguiente paso: ${canvasContext.nextMissionStep ?? 'Explicar lo observado'})`
      : '- Modo libre de exploración',
    recentActions.length > 0
      ? `- Acciones recientes en el mapa: ${recentActions.join(' -> ')}`
      : '- Aún no ha arrastrado puntos en este turno.',
    '',
    signalDirectives.length > 0
      ? `INDICACIÓN PEDAGÓGICA PARA ESTE TURNO:\n${signalDirectives.join('\n')}`
      : 'INDICACIÓN PEDAGÓGICA: Responde directamente su inquietud con claridad y una analogía cotidiana, y cierra con una pregunta práctica sobre su mapa.',
  ].join('\n');
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, geminiReady: Boolean(ai) });
  });

  app.post('/api/tutor', async (req, res) => {
    const body = req.body as TutorRequestBody | undefined;
    if (!body || typeof body.studentMessage !== 'string' || !body.studentMessage.trim()) {
      res.status(400).json({ error: 'Mensaje del estudiante vacío.' });
      return;
    }

    if (!ai) {
      res.status(503).json({
        error:
          'El servicio de IA del tutor no tiene una clave GEMINI_API_KEY configurada en el servidor.',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    try {
      const systemInstruction = buildSocraticSystemInstruction(body);
      const historyLines = (body.history ?? [])
        .slice(-6)
        .map((turn) => `${turn.sender === 'STUDENT' ? 'Estudiante' : 'Tutor'}: ${turn.text}`)
        .join('\n');

      const prompt = [
        historyLines ? `Conversación reciente:\n${historyLines}\n` : '',
        `Mensaje actual del estudiante: "${body.studentMessage.trim()}"`,
        '',
        'Responde como Tutor MOCAVI en español claro de 9° grado (máximo 3 frases cortas y exactamente 1 pregunta final con "?").',
      ]
        .filter(Boolean)
        .join('\n');

      let response;
      let lastErr: unknown = null;
      const retryDelays = [0, 600, 1400];
      for (let attempt = 0; attempt < retryDelays.length; attempt++) {
        if (retryDelays[attempt] > 0) {
          await new Promise((r) => setTimeout(r, retryDelays[attempt]));
        }
        try {
          response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: prompt,
            config: {
              systemInstruction,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });
          lastErr = null;
          break;
        } catch (err: unknown) {
          lastErr = err;
          const msg = err instanceof Error ? err.message : String(err);
          const st =
            typeof err === 'object' && err !== null && 'status' in err
              ? Number((err as { status?: unknown }).status)
              : 0;
          const isTransient =
            st === 503 || st === 500 || msg.includes('UNAVAILABLE') || msg.includes('high demand');
          if (!isTransient) break;
        }
      }
      if (lastErr || !response) {
        throw lastErr ?? new Error('No response from Gemini API');
      }

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'El tutor devolvió una respuesta vacía. Intenta preguntar de nuevo.',
        });
        return;
      }

      // Clean any stray markdown formatting so chat bubbles look natural for 9th graders
      const cleanedReply = rawText
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^#+\s*/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      res.json({ reply: cleanedReply });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: unknown }).status)
          : 0;
      console.error('[/api/tutor] Gemini API error:', status, message);

      if (
        status === 403 ||
        status === 400 ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('API_KEY_INVALID')
      ) {
        res.status(status === 400 ? 400 : 403).json({
          error:
            'No se pudo autenticar o procesar la solicitud con Gemini API. Verifica tu clave en Settings > Secrets.',
          code: 'AUTH_OR_REQUEST_ERROR',
          detail: !IS_PROD ? message.slice(0, 300) : undefined,
        });
        return;
      }

      if (status === 429 || message.includes('RESOURCE_EXHAUSTED')) {
        res.status(429).json({
          error: 'El tutor recibió muchas preguntas seguidas. Espera unos segundos e intenta otra vez.',
          code: 'RATE_LIMIT',
        });
        return;
      }

      res.status(502).json({
        error: 'Hubo un problema temporal conectando con el tutor. Intenta enviar tu pregunta otra vez.',
        code: 'UPSTREAM_ERROR',
        detail: !IS_PROD ? message.slice(0, 300) : undefined,
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      appType: 'spa',
    });

    // Vite 8 still attempts a WebSocket connection to port 24678 from /@vite/client
    // even when ws/hmr are disabled in middlewareMode. Serve a WebSocket-free shim
    // that preserves dev CSS injection and hot-context exports without opening sockets.
    app.get('/@vite/client', (_req, res) => {
      res.type('application/javascript').send(`
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  const data = {};
  return {
    get data() { return data; },
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') return url;
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return pathname + '?' + queryToInject + (search ? '&' + search.slice(1) : '') + (hash || '');
}
export class ErrorOverlay extends HTMLElement {}
`);
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(DIST_PATH));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(DIST_PATH, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[SVM-MOCAVI] Server running on http://localhost:${PORT} (${IS_PROD ? 'production' : 'development'})`
    );
  });

  const shutdown = () => {
    httpServer.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

createServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
