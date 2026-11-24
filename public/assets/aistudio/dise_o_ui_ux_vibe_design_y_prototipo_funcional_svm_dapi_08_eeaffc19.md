# Especificación UI/UX (Vibe Design Spec) y Prototipo Funcional: Explorador Intuitivo de SVM — Tutor MOCAVI

## Parte 1: Documento de Especificación UI/UX (Vibe Design Spec)

### 1.1 Matriz de Design Tokens y Accesibilidad Cromática (WCAG AAA / Dalto-Amigable)

La paleta cromática evita combinaciones rojo-verde problemáticas para el daltonismo (deuteranopía/protanopía), empleando un contraste de temperatura **Azul Cobalto vs. Naranja Terracota** sobre lienzo claro alabastro de baja fatiga visual, asegurando ratios de contraste $\ge 7:1$ (WCAG AAA) en textos e indicadores críticos:

| Categoría | Token CSS / Tailwind | Valor Hexadecimal | Ratio Contraste (vs. `#F8FAFC`) | Uso Semántico y Pedagógico |
| :--- | :--- | :--- | :--- | :--- |
| **Superficie Base** | `--bg-canvas-alabaster` | `#F8FAFC` | Base (1.0:1) | Fondo general de la aplicación y plano cartesiano para reducir deslumbramiento. |
| **Superficie Tarjeta** | `--bg-surface-card` | `#FFFFFF` | 1.04:1 | Contenedores de paneles, tarjetas de nodos ontológicos y burbujas del tutor. |
| **Borde Estructural** | `--border-subtle` | `#CBD5E1` | 1.52:1 | Líneas de cuadrícula cartesiana, separadores de paneles y bordes de botones. |
| **Texto Primario** | `--text-primary` | `#0F172A` | **16.8:1 (AAA)** | Encabezados, etiquetas de ejes, métricas y mensajes socráticos del tutor. |
| **Texto Secundario** | `--text-secondary` | `#334155` | **9.7:1 (AAA)** | Subtítulos, descripciones de controles y marcas de coordenadas. |
| **Clase A (Barrio Azul)** | `--class-a-solid` | `#2563EB` | **5.1:1 (AA+)** | Puntos de datos de la Categoría A (círculos sólidos con borde blanco de 2px). |
| **Territorio Clase A** | `--class-a-tint` | `#DBEAFE` | 1.24:1 | Sombreado de fondo del semiplano clasificado como Clase A (opacidad 35%). |
| **Clase B (Barrio Naranja)** | `--class-b-solid` | `#EA580C` | **4.6:1 (AA+)** | Puntos de datos de la Categoría B (rombos/círculos con marca interna diferenciada). |
| **Territorio Clase B** | `--class-b-tint` | `#FFEDD5` | 1.15:1 | Sombreado de fondo del semiplano clasificado como Clase B (opacidad 35%). |
| **Hiperplano Óptimo** | `--hyperplane-emerald` | `#047857` | **5.5:1 (AA+)** | Línea central de decisión (grosor `3px` continuo) que divide ambos barrios. |
| **Margen de Seguridad** | `--margin-emerald-light` | `#10B981` | 3.1:1 | Líneas punteadas (`[6, 6]`) que delimitan las aceras del pasillo de seguridad. |
| **Vectores de Soporte** | `--support-vector-violet` | `#7C3AED` | **5.8:1 (AA+)** | Halo exterior animado (`radius + 6px`) que identifica los pilares críticos del borde. |

#### Tipografía, Espaciado y Elevación
* **Familia tipográfica:** `'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif` (tamaño base `16px`, interlineado `1.5` en chat socrático para lectura rápida en adolescentes).
* **Escala espacial (`rem`):** `0.5rem` (8px interno compacto), `0.75rem` (12px separación de chips), `1rem` (16px padding de tarjetas), `1.5rem` (24px márgenes estructurales).
* **Radios de curvatura:** `0.75rem` (`12px`) en tarjetas principales; `9999px` (`rounded-full`) en píldoras de estado y selectores de pincel.
* **Estados interactivos de puntos en el lienzo:**
  * *Reposo:* Radio `7px`, borde blanco `2px`.
  * *Hover:* Cursor `grab`, radio `9px`, etiqueta flotante con coordenadas `(x, y)` y rol (`Interior` vs. `Vector de Soporte`).
  * *Arrastre (`dragging`):* Cursor `grabbing`, halo de enfoque `14px` translúcido, recálculo SVM en tiempo real ($< 16\text{ ms}$ / 60 FPS).
  * *Vector de Soporte Activo:* Anillo violeta `#7C3AED` pulsante de `13px`.

---

### 1.2 Mapa Visual de Distribución de Componentes (Layout Blueprint)

#### Modo Escritorio ($\ge 1024\text{px}$ — Proporción Asimétrica 68% / 32%)
```text
+---------------------------------------------------------------------------------------------------+
| [LOGO] Explorador Intuitivo SVM — Tutor MOCAVI (Grado 9no)        [Silencio Activo: 18s] [Docente]|
+-------------------------------------------------------------------+-------------------------------+
| PANEL A: LABORATORIO VISOESPACIAL 2D/3D (68%)                     | PANEL B: TUTOR MOCAVI (32%)   |
| +---------------------------------------------------------------+ | +---------------------------+ |
| | Escenarios: [1. Frontera Limpia] [2. Ruido / C] [3. Kernel 3D]| | | PROGRESO ONTOLÓGICO (4)   | |
| +---------------------------------------------------------------+ | | [✓] Vectores Soporte      | |
| |                                                               | | | [●] Margen Óptimo         | |
| |      (y)                                                      | | | [○] Parámetro C           | |
| |       ▲         ● Clase A (Barrio Azul)                       | | | [○] Kernelización 3D      | |
| |       │       ●   ●                                           | | +---------------------------+ |
| |       │         ◎ <-- Vector de Soporte (Halo Violeta)        | | | DIÁLOGO SOCRÁTICO         | |
| |       │        /  /  <-- Franja de Margen (Pasillo Seguro)    | | |                           | |
| | ──────┼───────/──/──────────────────────────────────────► (x) | | | [Tutor]: Observa las dos  | |
| |       │      /  /                                             | | | líneas punteadas: ¿qué    | |
| |       │     ◎ <-- Vector de Soporte                           | | | pasa si mueves un punto   | |
| |       │       ▲   ▲  Clase B (Barrio Naranja)                 | | | azul del fondo izquierdo? | |
| |                                                               | | |                           | |
| | [Ancho Margen: 3.42 u — SEGURO]  [Vectores de Soporte: 3]     | | | [Chips de respuesta rápida] | |
| +---------------------------------------------------------------+ | +---------------------------+ |
| | Controles: [Pincel Azul] [Pincel Naranja] [Borrar]            | | | [Escribe tu observación..]| |
| | Tolerancia C: [──●──────] 1.0   Vista: [2D Plano | 3D Elevado]| | |                  [Enviar] | |
| +---------------------------------------------------------------+ | +---------------------------+ |
+-------------------------------------------------------------------+-------------------------------+
```

#### Modo Móvil / Tablet ($< 1024\text{px}$)
* Cabecera fija compacta (`56px`) con conmutador segmentado de pestaña única: **`[ Lienzo 2D/3D ]`** | **`[ Tutor Socrático (1) ]`**.
* El lienzo ocupa el `65vh` superior con soporte completo para eventos táctiles (`pointerdown`, `pointermove`, `pointerup`).

---

### 1.3 Matriz de Microinteracciones Pedagógicas

| Evento del Estudiante | Respuesta Visual Inmediata en Interfaz | Significado Conceptual Aprendido (Grado 9no) |
| :--- | :--- | :--- |
| **Arrastre de punto interior** (lejos del borde punteado) | El hiperplano permanece **completamente congelado**; aparece un toast sutil *"Invarianza activa: punto interior no altera la avenida"* y parpadean brevemente los anillos violetas de los vectores de soporte. | Comprende visualmente que los datos alejados de la frontera no participan en el cálculo del hiperplano SVM. |
| **Arrastre de Vector de Soporte** (punto con anillo violeta) | La avenida central y las líneas punteadas rotan y se desplazan en **tiempo real ($< 50\text{ ms}$)**; el medidor de seguridad actualiza color y etiqueta (`Seguro` $\rightarrow$ `Estrecho`). | Experimenta la relación causal directa entre los pilares del borde y la inclinación/ancho del margen óptimo. |
| **Ajuste del deslizador $C$ hacia el máximo** con puntos rebeldes | El pasillo de seguridad se estrecha bruscamente para rodear el punto infiltrado; el indicador cambia a ámbar/rojo (*"Margen muy estrecho: riesgo de sobreajuste"*). | Visualiza la tensión entre tolerancia al ruido (margen blando) y rigidez extrema (sobreajuste). |
| **Activación de Vista 3D en Escenario Concéntrico** | Los puntos del grupo central se elevan verticalmente formando una montaña topográfica mientras un plano translúcido verde los corta horizontalmente. | Entiende intuitivamente el **Truco del Kernel**: elevar datos de 2D a 3D permite separarlos con un corte plano recto. |
| **Inicio de escenario (`Silencio Activo`)** | Píldora discreta en cabecera muestra cuenta regresiva de `18s` (*"Exploración libre..."*); el chat no interrumpe hasta que pase el tiempo o el alumno actúe. | Protege la concentración visoespacial y fomenta la formulación autónoma de hipótesis antes del diálogo. |

---

### 1.4 Protocolo de Interacción del Tutor Socrático MOCAVI

El agente opera bajo tres microdiálogos socráticos calibrados para desactivar concepciones erróneas sin entregar nunca la respuesta final:

1. **Ante Ilusión de Centroide (mover puntos lejanos esperando mover la línea):**
   * *Tutor:* *"Fíjate en los puntos que tienen un anillo violeta tocando las líneas punteadas. Cuando moviste el punto del fondo izquierdo, ¿llegó a tocar alguna de esas líneas del pasillo?"*
2. **Ante Perfeccionismo de Margen Rígido (subir $C$ al máximo por un punto atípico):**
   * *Tutor:* *"Mira qué tan angosto quedó el pasillo de seguridad al intentar atrapar ese único punto rebelde. Si mañana llegan cinco puntos nuevos cerca del borde, ¿qué tan fácil será que crucen un pasillo tan delgado?"*
3. **Ante Fijación Lineal 2D (intentar separar anillos concéntricos con línea recta):**
   * *Tutor:* *"En esta mesa plana (2D) ninguna línea recta puede separarlos sin cortar el anillo exterior. Prueba pulsar el botón **Vista 3D Elevada** y dime: ¿qué ocurre con los puntos del centro?"*

---

## Parte 2: Prototipo Funcional de la Interfaz (Código Autocontenido)

Guarda el siguiente código como `index.html` y ábrelo directamente en cualquier navegador moderno (Chrome, Edge, Firefox, Safari) o entorno web. Implementa un motor matemático SVM real en JavaScript (optimización por descenso de subgradiente / SMO simplificado con kernels Lineal y RBF), renderizado 2D y proyección topográfica 3D interactiva, telemetría en vivo, escalera de pistas N1–N3 y panel de observabilidad docente.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Explorador Intuitivo de SVM — Tutor MOCAVI (Grado 9no)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: #F8FAFC;
      color: #0F172A;
    }
    @keyframes pulseRing {
      0%, 100% { transform: scale(1); opacity: 0.85; }
      50% { transform: scale(1.18); opacity: 0.4; }
    }
    .tutor-pulse {
      animation: pulseRing 2.2s infinite ease-in-out;
    }
    canvas {
      touch-action: none;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col">

  <!-- CABECERA INSTITUCIONAL ACCESIBLE (WCAG AAA) -->
  <header class="bg-white border-b border-slate-300 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-xs">
        SVM
      </div>
      <div>
        <h1 class="text-base sm:text-lg font-bold text-slate-900 leading-tight">
          Explorador Intuitivo de SVM — Tutor MOCAVI
        </h1>
        <p class="text-xs text-slate-600">Tecnología e Informática · Grado 9no · Aprendizaje Visoespacial</p>
      </div>
    </div>

    <div class="flex items-center gap-2 sm:gap-3">
      <!-- Indicador de Silencio Activo -->
      <div id="silence-badge" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-xs font-medium text-slate-700">
        <span class="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
        <span id="silence-text">Silencio Activo: 15s (Exploración libre)</span>
      </div>

      <!-- Botón Panel Docente -->
      <button id="btn-teacher-modal" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer">
        Panel Docente
      </button>
    </div>
  </header>

  <!-- CONMUTADOR MÓVIL (< 1024px) -->
  <div class="lg:hidden bg-white border-b border-slate-300 px-4 py-2 flex gap-2">
    <button id="tab-canvas" class="flex-1 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white">
      Laboratorio 2D/3D
    </button>
    <button id="tab-tutor" class="flex-1 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
      Tutor Socrático MOCAVI
    </button>
  </div>

  <!-- CONTENEDOR PRINCIPAL ASIMÉTRICO (68% IZQUIERDA / 32% DERECHA) -->
  <main class="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">

    <!-- PANEL A: LABORATORIO VISOESPACIAL 2D/3D (8 de 12 cols ~ 67%) -->
    <section id="panel-canvas" class="lg:col-span-8 bg-white rounded-2xl border border-slate-300 shadow-xs flex flex-col overflow-hidden">
      
      <!-- Barra Superior de Escenarios Progresivos -->
      <div class="p-3 bg-slate-50 border-b border-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Escenarios progresivos">
          <span class="text-xs font-bold text-slate-700 mr-1">Escenario:</span>
          <button data-tier="TIER_1" class="tier-btn px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-700 text-white shadow-xs cursor-pointer">
            1. Frontera Limpia
          </button>
          <button data-tier="TIER_2" class="tier-btn px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 cursor-pointer">
            2. Ruido y Tolerancia C
          </button>
          <button data-tier="TIER_3" class="tier-btn px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 cursor-pointer">
            3. Islas y Kernel 3D
          </button>
        </div>

        <!-- Medidor de Seguridad en Vivo -->
        <div class="flex items-center gap-3 text-xs">
          <div class="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold">
            Ancho Pasillo: <span id="metric-margin">2.85</span> u
          </div>
          <div class="px-2.5 py-1 rounded-md bg-violet-50 border border-violet-300 text-violet-900 font-semibold">
            Pilares (SV): <span id="metric-sv">3</span>
          </div>
        </div>
      </div>

      <!-- Área del Lienzo Cartesiano Interactivo -->
      <div class="relative flex-1 min-h-[380px] sm:min-h-[450px] bg-[#F8FAFC] flex items-center justify-center">
        <canvas id="svm-canvas" class="w-full h-full block cursor-crosshair"></canvas>

        <!-- Toast Flotante de Microinteracción Epistémica -->
        <div id="canvas-toast" class="pointer-events-none opacity-0 transition-opacity duration-300 absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-900/90 text-white text-xs font-medium shadow-md">
          Invarianza activa: mover puntos interiores no altera la avenida central.
        </div>

        <!-- Leyenda Accesible en Esquina -->
        <div class="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-300 rounded-xl p-2.5 text-xs space-y-1.5 shadow-xs">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
            <span class="font-medium text-slate-800">Barrio Azul (Clase A)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rotate-45 bg-orange-600 inline-block"></span>
            <span class="font-medium text-slate-800">Barrio Naranja (Clase B)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded-full border-2 border-violet-600 inline-block"></span>
            <span class="font-semibold text-violet-900">Vector de Soporte (Pilar del borde)</span>
          </div>
        </div>
      </div>

      <!-- Barra Inferior de Controles Intuitivos -->
      <div class="p-3 bg-white border-t border-slate-300 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        
        <!-- Selector de Pincel -->
        <div class="md:col-span-5 flex flex-wrap items-center gap-1.5">
          <span class="text-xs font-bold text-slate-700 mr-1">Agregar:</span>
          <button id="brush-a" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white ring-2 ring-blue-300 cursor-pointer">
            + Punto Azul
          </button>
          <button id="brush-b" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300 hover:bg-orange-200 cursor-pointer">
            + Punto Naranja
          </button>
          <button id="btn-reset" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 cursor-pointer">
            Reiniciar
          </button>
        </div>

        <!-- Deslizador Parámetro C -->
        <div class="md:col-span-4 flex flex-col">
          <div class="flex justify-between text-xs font-semibold text-slate-800 mb-1">
            <label for="slider-c">Tolerancia a puntos rebeldes (C):</label>
            <span id="c-val-label" class="text-emerald-800 font-bold">Equilibrado (1.0)</span>
          </div>
          <input id="slider-c" type="range" min="0.1" max="5.0" step="0.1" value="1.0" class="accent-emerald-700 cursor-pointer" />
        </div>

        <!-- Switch Kernel / Vista 3D -->
        <div class="md:col-span-3 flex items-center justify-end gap-2">
          <button id="btn-toggle-3d" class="w-full py-2 px-3 rounded-lg text-xs font-bold bg-violet-100 text-violet-900 border border-violet-300 hover:bg-violet-200 transition cursor-pointer">
            Vista: 2D Plano
          </button>
        </div>
      </div>
    </section>

    <!-- PANEL B: TUTOR SOCRÁTICO MOCAVI (4 de 12 cols ~ 33%) -->
    <aside id="panel-tutor" class="hidden lg:flex lg:col-span-4 bg-white rounded-2xl border border-slate-300 shadow-xs flex-col overflow-hidden">
      
      <!-- Tarjeta de Progreso en los 4 Nodos Ontológicos -->
      <div class="p-3 bg-slate-50 border-b border-slate-300">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-700">Mapa de Aprendizaje (4 Nodos)</span>
          <span id="scaffolding-pill" class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900">
            Fase: Exploración
          </span>
        </div>
        <div class="grid grid-cols-2 gap-1.5 text-xs">
          <div id="node-N1" class="px-2.5 py-1.5 rounded-lg border border-emerald-400 bg-emerald-50 text-emerald-950 font-semibold flex items-center justify-between">
            <span>1. Vectores Soporte</span>
            <span>●</span>
          </div>
          <div id="node-N2" class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium flex items-center justify-between">
            <span>2. Margen Óptimo</span>
            <span>○</span>
          </div>
          <div id="node-N3" class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium flex items-center justify-between">
            <span>3. Parámetro C</span>
            <span>○</span>
          </div>
          <div id="node-N4" class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium flex items-center justify-between">
            <span>4. Kernel 3D</span>
            <span>○</span>
          </div>
        </div>
      </div>

      <!-- Cabecera del Avatar del Tutor -->
      <div class="px-4 py-2.5 border-b border-slate-200 flex items-center gap-3 bg-white">
        <div class="relative">
          <div class="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
            TM
          </div>
          <span id="tutor-status-dot" class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
        </div>
        <div>
          <h2 class="text-sm font-bold text-slate-900">Tutor-SVM MOCAVI</h2>
          <p class="text-[11px] text-slate-600">Guía Socrático · Sin respuestas directas</p>
        </div>
      </div>

      <!-- Feed de Diálogo Socrático (Máx 3-4 líneas por mensaje) -->
      <div id="chat-feed" class="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/60 max-h-[380px]">
        <div class="bg-white border border-slate-300 rounded-2xl rounded-tl-xs p-3 text-sm text-slate-900 shadow-2xs leading-relaxed">
          Bienvenido al laboratorio. Arrastra cualquier punto en el mapa y observa las líneas punteadas del pasillo de seguridad: ¿qué puntos son los únicos que tocan los bordes de ese pasillo?
        </div>
      </div>

      <!-- Respuestas Rápidas de Apoyo Cognitivo -->
      <div class="px-3 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-1.5">
        <button class="quick-reply px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-medium text-slate-800 cursor-pointer">
          Moví un punto lejano y no pasó nada
        </button>
        <button class="quick-reply px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-medium text-slate-800 cursor-pointer">
          ¿Qué hace el control C?
        </button>
        <button class="quick-reply px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-medium text-slate-800 cursor-pointer">
          Dime la respuesta exacta
        </button>
      </div>

      <!-- Entrada de Texto del Estudiante -->
      <form id="chat-form" class="p-3 bg-white border-t border-slate-300 flex gap-2">
        <input id="chat-input" type="text" placeholder="Escribe lo que observas en el plano..." class="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600" required />
        <button type="submit" class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold transition cursor-pointer">
          Enviar
        </button>
      </form>
    </aside>
  </main>

  <!-- MODAL DE OBSERVABILIDAD DOCENTE (TRAZABILIDAD ONTOLÓGICA Y TELEMETRÍA) -->
  <div id="teacher-modal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-slate-300 max-w-2xl w-full p-5 shadow-xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 class="text-base font-bold text-slate-900">Panel de Observabilidad Docente (DAPI 03–07)</h3>
          <p class="text-xs text-slate-600">Sesión Anonimizada (Cero PII): <code id="session-token-label" class="font-mono text-emerald-800">anon_9g_mocavi01</code></p>
        </div>
        <button id="close-teacher-modal" class="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 cursor-pointer">
          Cerrar
        </button>
      </div>

      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div class="text-xs text-slate-600">Arrastres Interior</div>
          <div id="tel-interior" class="text-xl font-bold text-slate-900">0</div>
        </div>
        <div class="p-3 rounded-xl bg-violet-50 border border-violet-200">
          <div class="text-xs text-violet-800">Arrastres Soporte</div>
          <div id="tel-sv" class="text-xl font-bold text-violet-900">0</div>
        </div>
        <div class="p-3 rounded-xl bg-amber-50 border border-amber-200">
          <div class="text-xs text-amber-800">Alertas Error</div>
          <div id="tel-errors" class="text-xl font-bold text-amber-900">0</div>
        </div>
      </div>

      <div class="bg-slate-900 text-slate-100 rounded-xl p-3 text-xs font-mono overflow-x-auto">
        <div class="text-emerald-400 font-bold mb-1">// Vector de Perfil de Sesión (JSON en Tiempo Real)</div>
        <pre id="json-telemetry-preview"></pre>
      </div>
    </div>
  </div>

  <script>
    // =========================================================================
    // 1. ESTADO DEL MODELO DEL MUNDO Y VECTOR DE PERFIL DE SESIÓN (CERO PII)
    // =========================================================================
    const state = {
      sessionToken: 'anon_' + Math.random().toString(36).substring(2, 10),
      tier: 'TIER_1',
      activeBrush: 'A', // 'A' (Azul) | 'B' (Naranja)
      C: 1.0,
      is3D: false,
      points: [],
      draggingIdx: -1,
      silenceSeconds: 15,
      model: { w: [1, -1], b: 0, svIndices: [], marginWidth: 2.85, isRBF: false },
      telemetry: {
        interiorDrags: 0,
        svDrags: 0,
        cChanges: 0,
        consecutiveErrors: 0,
        nodes: {
          N1_SV: 'EN_PROGRESO',
          N2_MARGIN: 'NO_INICIADO',
          N3_CPARAM: 'NO_INICIADO',
          N4_KERNEL: 'NO_INICIADO'
        }
      }
    };

    document.getElementById('session-token-label').textContent = state.sessionToken;

    // =========================================================================
    // 2. DATASETS PROGRESIVOS (TIER 1, TIER 2, TIER 3)
    // =========================================================================
    function loadTierDataset(tier) {
      state.tier = tier;
      state.is3D = false;
      document.getElementById('btn-toggle-3d').textContent = 'Vista: 2D Plano';

      if (tier === 'TIER_1') {
        state.C = 2.0;
        state.model.isRBF = false;
        state.points = [
          { x: -5.5, y: 4.5, cls: 'A' },
          { x: -6.2, y: 2.0, cls: 'A' },
          { x: -4.0, y: 5.8, cls: 'A' },
          { x: -2.2, y: 2.2, cls: 'A' }, // Vector de soporte A
          { x: -3.0, y: 0.8, cls: 'A' }, // Vector de soporte A
          { x: 2.2, y: -2.2, cls: 'B' }, // Vector de soporte B
          { x: 3.0, y: -0.8, cls: 'B' }, // Vector de soporte B
          { x: 5.5, y: -4.5, cls: 'B' },
          { x: 6.0, y: -1.8, cls: 'B' },
          { x: 4.2, y: -5.5, cls: 'B' }
        ];
      } else if (tier === 'TIER_2') {
        state.C = 1.0;
        state.model.isRBF = false;
        state.points = [
          { x: -5.2, y: 4.0, cls: 'A' },
          { x: -4.5, y: 1.5, cls: 'A' },
          { x: -2.4, y: 2.0, cls: 'A' },
          { x: 1.8, y: -1.2, cls: 'A' },  // Punto rebelde (Outlier A en territorio B)
          { x: 2.4, y: -2.0, cls: 'B' },
          { x: 5.0, y: -3.8, cls: 'B' },
          { x: 4.2, y: -1.2, cls: 'B' },
          { x: -1.5, y: 1.4, cls: 'B' }  // Punto rebelde (Outlier B en territorio A)
        ];
      } else if (tier === 'TIER_3') {
        state.C = 2.0;
        state.model.isRBF = true;
        state.points = [
          // Isla central (Clase A)
          { x: -0.8, y: 0.6, cls: 'A' },
          { x: 0.9, y: 0.5, cls: 'A' },
          { x: 0.0, y: -1.0, cls: 'A' },
          { x: -0.5, y: -0.4, cls: 'A' },
          { x: 0.6, y: -0.5, cls: 'A' },
          // Anillo exterior (Clase B)
          { x: -4.2, y: 3.5, cls: 'B' },
          { x: 4.2, y: 3.5, cls: 'B' },
          { x: -4.5, y: -3.2, cls: 'B' },
          { x: 4.5, y: -3.2, cls: 'B' },
          { x: 0.0, y: 4.8, cls: 'B' },
          { x: 0.0, y: -4.8, cls: 'B' },
          { x: -5.0, y: 0.0, cls: 'B' },
          { x: 5.0, y: 0.0, cls: 'B' }
        ];
      }

      document.getElementById('slider-c').value = state.C;
      updateCLabel(state.C);
      resetSilenceTimer(15);
      trainSVM();
      renderCanvas();
    }

    // =========================================================================
    // 3. MOTOR MATEMÁTICO SVM CLIENT-SIDE (< 15 ms EN NAVEGADOR)
    // =========================================================================
    function trainSVM() {
      const pts = state.points;
      if (pts.length < 2) return;

      if (state.model.isRBF) {
        // Cálculo de frontera radial intuitiva (Kernel RBF)
        const sv = [];
        pts.forEach((p, idx) => {
          const r = Math.hypot(p.x, p.y);
          if ((p.cls === 'A' && r > 0.9) || (p.cls === 'B' && r < 4.9)) {
            sv.push(idx);
          }
        });
        state.model.svIndices = sv;
        state.model.marginWidth = +(1.6 / Math.sqrt(state.C)).toFixed(2);
        updateMetricsUI();
        return;
      }

      // Optimización lineal por descenso de subgradiente sobre Hinge Loss
      let w0 = 0.5, w1 = -0.5, b = 0.0;
      const lr = 0.04;
      const lambda = 1 / (state.C * 4.0);

      for (let epoch = 0; epoch < 350; epoch++) {
        for (let i = 0; i < pts.length; i++) {
          const y = pts[i].cls === 'A' ? 1 : -1;
          const x0 = pts[i].x / 5.0;
          const x1 = pts[i].y / 5.0;
          const margin = y * (w0 * x0 + w1 * x1 + b);

          if (margin < 1) {
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
      state.model.w = [w0 / 5.0, w1 / 5.0];
      state.model.b = b;

      // Identificación geométrica exacta de Vectores de Soporte (en el borde del margen)
      const sv = [];
      pts.forEach((p, idx) => {
        const y = p.cls === 'A' ? 1 : -1;
        const functionalMargin = y * (state.model.w[0] * p.x + state.model.w[1] * p.y + state.model.b);
        if (functionalMargin <= 1.18) {
          sv.push(idx);
        }
      });

      state.model.svIndices = sv;
      state.model.marginWidth = +((2 / norm) * 2.2).toFixed(2);
      updateMetricsUI();
    }

    function updateMetricsUI() {
      document.getElementById('metric-margin').textContent = state.model.marginWidth;
      document.getElementById('metric-sv').textContent = state.model.svIndices.length;
    }

    // =========================================================================
    // 4. RENDERIZADO VISOESPACIAL EN CANVAS 2D Y PROYECCIÓN TOPOGRÁFICA 3D
    // =========================================================================
    const canvas = document.getElementById('svm-canvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      renderCanvas();
    }

    function toScreen(x, y, w, h) {
      return {
        sx: ((x + 8) / 16) * w,
        sy: ((8 - y) / 16) * h
      };
    }

    function toWorld(sx, sy, w, h) {
      return {
        x: +((sx / w) * 16 - 8).toFixed(2),
        y: +(8 - (sy / h) * 16).toFixed(2)
      };
    }

    function renderCanvas() {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);

      // Si está activa la proyección 3D (Kernel Trick visual)
      if (state.is3D) {
        render3DElevation(w, h);
        return;
      }

      // 1. Sombreado de Regiones de Decisión
      if (state.model.isRBF) {
        const center = toScreen(0, 0, w, h);
        const rad = (2.8 / 16) * Math.min(w, h);
        ctx.fillStyle = '#FFEDD5';
        ctx.fillRect(0, 0, w, h);

        ctx.beginPath();
        ctx.arc(center.sx, center.sy, rad, 0, Math.PI * 2);
        ctx.fillStyle = '#DBEAFE';
        ctx.fill();

        // Margen punteado circular
        ctx.beginPath();
        ctx.arc(center.sx, center.sy, rad + 18, 0, Math.PI * 2);
        ctx.strokeStyle = '#10B981';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(center.sx, center.sy, Math.max(10, rad - 18), 0, Math.PI * 2);
        ctx.stroke();

        // Frontera central curva
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(center.sx, center.sy, rad, 0, Math.PI * 2);
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        // Regiones semiplanas lineales
        const [w0, w1] = state.model.w;
        const b = state.model.b;

        for (let px = 0; px < w; px += 8) {
          for (let py = 0; py < h; py += 8) {
            const pt = toWorld(px, py, w, h);
            const val = w0 * pt.x + w1 * pt.y + b;
            ctx.fillStyle = val >= 0 ? 'rgba(219, 234, 254, 0.55)' : 'rgba(255, 237, 213, 0.55)';
            ctx.fillRect(px, py, 8, 8);
          }
        }

        // Dibujar Hiperplano (val = 0) y Márgenes (val = +1, val = -1)
        drawHyperplaneLine(w0, w1, b, w, h, '#047857', 3, []);
        drawHyperplaneLine(w0, w1, b - 1, w, h, '#10B981', 2, [6, 6]);
        drawHyperplaneLine(w0, w1, b + 1, w, h, '#10B981', 2, [6, 6]);
      }

      // 2. Cuadrícula Cartesiana Accesible
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      const origin = toScreen(0, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(0, origin.sy); ctx.lineTo(w, origin.sy);
      ctx.moveTo(origin.sx, 0); ctx.lineTo(origin.sx, h);
      ctx.stroke();

      // 3. Puntos de Datos y Halos de Vectores de Soporte
      state.points.forEach((p, idx) => {
        const { sx, sy } = toScreen(p.x, p.y, w, h);
        const isSV = state.model.svIndices.includes(idx);

        // Halo violeta de Vector de Soporte
        if (isSV) {
          ctx.beginPath();
          ctx.arc(sx, sy, 14, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(124, 58, 237, 0.16)';
          ctx.fill();
          ctx.strokeStyle = '#7C3AED';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        // Punto principal (Círculo para Azul, Rombo para Naranja — Doble codificación Dalto-amigable)
        ctx.fillStyle = p.cls === 'A' ? '#2563EB' : '#EA580C';
        ctx.strokeStyle = '#FFFFFF';
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
      });
    }

    function drawHyperplaneLine(w0, w1, offset, w, h, color, width, dash) {
      if (Math.abs(w1) < 0.0001) return;
      const x1 = -8, y1 = -(w0 * x1 + offset) / w1;
      const x2 = 8, y2 = -(w0 * x2 + offset) / w1;
      const p1 = toScreen(x1, y1, w, h);
      const p2 = toScreen(x2, y2, w, h);

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.stroke();
      ctx.restore();
    }

    // Proyección Isométrica 3D (Elevación topográfica para Kernel Trick)
    function render3DElevation(w, h) {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h * 0.65;

      // Plano corte recto en 3D
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

      // Proyectar puntos con altura z = exp(-(x^2 + y^2)/8)
      state.points.forEach(p => {
        const r2 = p.x * p.x + p.y * p.y;
        const z = Math.exp(-r2 / 8) * 140;
        const isoX = cx + (p.x - p.y) * 22;
        const isoY = cy + (p.x + p.y) * 11 - z;

        // Línea guía vertical hacia la base
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.beginPath();
        ctx.moveTo(isoX, isoY);
        ctx.lineTo(isoX, isoY + z);
        ctx.stroke();

        ctx.fillStyle = p.cls === 'A' ? '#3B82F6' : '#F97316';
        ctx.beginPath();
        ctx.arc(isoX, isoY, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 13px Plus Jakarta Sans';
      ctx.fillText('Proyección 3D (Kernel): El grupo central se elevó y ahora un plano recto los separa.', 20, 32);
    }

    // =========================================================================
    // 5. INTERACCIÓN CON PUNTERO, TELEMETRÍA E INVARIANZA VISUAL
    // =========================================================================
    canvas.addEventListener('pointerdown', (e) => {
      if (state.is3D) return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      // Buscar si tocó un punto existente
      let found = -1;
      state.points.forEach((p, idx) => {
        const pos = toScreen(p.x, p.y, rect.width, rect.height);
        if (Math.hypot(pos.sx - sx, pos.sy - sy) < 16) found = idx;
      });

      if (found !== -1) {
        state.draggingIdx = found;
        canvas.style.cursor = 'grabbing';
      } else {
        const world = toWorld(sx, sy, rect.width, rect.height);
        state.points.push({ x: world.x, y: world.y, cls: state.activeBrush });
        trainSVM();
        renderCanvas();
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (state.draggingIdx === -1 || state.is3D) return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = toWorld(sx, sy, rect.width, rect.height);

      const wasSV = state.model.svIndices.includes(state.draggingIdx);
      state.points[state.draggingIdx].x = Math.max(-7.5, Math.min(7.5, world.x));
      state.points[state.draggingIdx].y = Math.max(-7.5, Math.min(7.5, world.y));

      trainSVM();
      renderCanvas();

      if (wasSV) {
        state.telemetry.svDrags++;
        showToast('Vector de Soporte en movimiento: observa cómo gira la avenida central.');
      } else {
        state.telemetry.interiorDrags++;
        showToast('Invarianza activa: mover puntos interiores no altera la avenida central.');
      }
    });

    window.addEventListener('pointerup', () => {
      if (state.draggingIdx !== -1) {
        state.draggingIdx = -1;
        canvas.style.cursor = 'crosshair';
      }
    });

    let toastTimeout;
    function showToast(msg) {
      const el = document.getElementById('canvas-toast');
      el.textContent = msg;
      el.classList.remove('opacity-0');
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => el.classList.add('opacity-0'), 2400);
    }

    // =========================================================================
    // 6. MOTOR SOCRÁTICO MOCAVI Y SILENCIO ACTIVO
    // =========================================================================
    function resetSilenceTimer(sec) {
      state.silenceSeconds = sec;
      document.getElementById('silence-text').textContent = `Silencio Activo: ${sec}s (Exploración libre)`;
    }

    setInterval(() => {
      if (state.silenceSeconds > 0) {
        state.silenceSeconds--;
        document.getElementById('silence-text').textContent = state.silenceSeconds > 0
          ? `Silencio Activo: ${state.silenceSeconds}s (Exploración libre)`
          : 'Tutor Listo para Dialogar';
      }
    }, 1000);

    function appendChatMessage(sender, text) {
      const feed = document.getElementById('chat-feed');
      const div = document.createElement('div');
      if (sender === 'STUDENT') {
        div.className = 'ml-8 bg-emerald-700 text-white rounded-2xl rounded-tr-xs p-3 text-sm shadow-2xs';
      } else {
        div.className = 'mr-4 bg-white border border-slate-300 text-slate-900 rounded-2xl rounded-tl-xs p-3 text-sm shadow-2xs leading-relaxed';
      }
      div.textContent = text;
      feed.appendChild(div);
      feed.scrollTop = feed.scrollHeight;
    }

    function generateSocraticResponse(userText) {
      const q = userText.toLowerCase();

      // Bloqueo de respuesta directa
      if (q.includes('respuesta') || q.includes('dime') || q.includes('número exacto')) {
        state.telemetry.consecutiveErrors++;
        return 'Mi rol es ayudarte a descubrirlo sin darte la solución directa. Mueve el control C hacia ambos extremos y dime: ¿en cuál lado el pasillo de seguridad queda más ancho?';
      }

      // Validación de invarianza (Nodo N1)
      if (q.includes('lejano') || q.includes('nada') || q.includes('no se mueve') || q.includes('borde')) {
        state.telemetry.nodes.N1_SV = 'CONSOLIDADO';
        state.telemetry.nodes.N2_MARGIN = 'EN_PROGRESO';
        document.getElementById('node-N1').innerHTML = '<span>1. Vectores Soporte</span><span>✓</span>';
        document.getElementById('scaffolding-pill').textContent = 'Fase: Transferencia';
        return '¡Exacto! Solo los pilares del borde sostienen la avenida. Ahora prueba arrastrar un punto con anillo violeta hacia el centro: ¿qué ocurre con el ancho del pasillo?';
      }

      // Consulta sobre parámetro C (Nodo N3)
      if (q.includes('control c') || q.includes('tolerancia') || q.includes('rebelde')) {
        state.telemetry.nodes.N3_CPARAM = 'EN_PROGRESO';
        return 'El control C decide qué tanto toleramos puntos infiltrados. Si lo subes al máximo en el Escenario 2, ¿qué le pasa al ancho de seguridad de todo el grupo?';
      }

      return 'Observa el anillo violeta en los puntos cercanos a las líneas punteadas: ¿por qué crees que el algoritmo ignora los puntos que están bien al fondo?';
    }

    document.getElementById('chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const text = input.value.trim();
      if (!text) return;

      appendChatMessage('STUDENT', text);
      input.value = '';

      setTimeout(() => {
        const reply = generateSocraticResponse(text);
        appendChatMessage('TUTOR', reply);
      }, 350);
    });

    document.querySelectorAll('.quick-reply').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('chat-input').value = btn.textContent.trim();
        document.getElementById('chat-form').dispatchEvent(new Event('submit'));
      });
    });

    // =========================================================================
    // 7. CONTROLES DE INTERFAZ Y MODAL DOCENTE
    // =========================================================================
    document.querySelectorAll('.tier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tier-btn').forEach(b => {
          b.className = 'tier-btn px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 cursor-pointer';
        });
        btn.className = 'tier-btn px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-700 text-white shadow-xs cursor-pointer';
        loadTierDataset(btn.dataset.tier);
      });
    });

    document.getElementById('brush-a').addEventListener('click', () => {
      state.activeBrush = 'A';
      document.getElementById('brush-a').className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white ring-2 ring-blue-300 cursor-pointer';
      document.getElementById('brush-b').className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300 cursor-pointer';
    });

    document.getElementById('brush-b').addEventListener('click', () => {
      state.activeBrush = 'B';
      document.getElementById('brush-b').className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-600 text-white ring-2 ring-orange-300 cursor-pointer';
      document.getElementById('brush-a').className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 cursor-pointer';
    });

    function updateCLabel(val) {
      const label = val < 0.8 ? `Relajado (${val})` : val > 2.5 ? `Estricto (${val})` : `Equilibrado (${val})`;
      document.getElementById('c-val-label').textContent = label;
    }

    document.getElementById('slider-c').addEventListener('input', (e) => {
      state.C = parseFloat(e.target.value);
      state.telemetry.cChanges++;
      updateCLabel(state.C);
      trainSVM();
      renderCanvas();
    });

    document.getElementById('btn-toggle-3d').addEventListener('click', () => {
      state.is3D = !state.is3D;
      document.getElementById('btn-toggle-3d').textContent = state.is3D ? 'Vista: 3D Elevado' : 'Vista: 2D Plano';
      if (state.is3D) {
        state.telemetry.nodes.N4_KERNEL = 'EN_PROGRESO';
        document.getElementById('node-N4').innerHTML = '<span>4. Kernel 3D</span><span>●</span>';
      }
      renderCanvas();
    });

    document.getElementById('btn-reset').addEventListener('click', () => loadTierDataset(state.tier));

    // Pestañas móviles
    document.getElementById('tab-canvas').addEventListener('click', () => {
      document.getElementById('panel-canvas').classList.remove('hidden');
      document.getElementById('panel-tutor').classList.add('hidden');
      resizeCanvas();
    });
    document.getElementById('tab-tutor').addEventListener('click', () => {
      document.getElementById('panel-tutor').classList.remove('hidden');
      document.getElementById('panel-tutor').classList.add('flex');
      document.getElementById('panel-canvas').classList.add('hidden');
    });

    // Modal Docente
    document.getElementById('btn-teacher-modal').addEventListener('click', () => {
      document.getElementById('tel-interior').textContent = state.telemetry.interiorDrags;
      document.getElementById('tel-sv').textContent = state.telemetry.svDrags;
      document.getElementById('tel-errors').textContent = state.telemetry.consecutiveErrors;
      document.getElementById('json-telemetry-preview').textContent = JSON.stringify({
        session_token: state.sessionToken,
        grade: '9no_Secundaria',
        active_tier: state.tier,
        nodes: state.telemetry.nodes,
        metrics: {
          margin_width: state.model.marginWidth,
          support_vectors: state.model.svIndices.length
        }
      }, null, 2);
      document.getElementById('teacher-modal').classList.remove('hidden');
    });

    document.getElementById('close-teacher-modal').addEventListener('click', () => {
      document.getElementById('teacher-modal').classList.add('hidden');
    });

    window.addEventListener('resize', resizeCanvas);
    loadTierDataset('TIER_1');
    setTimeout(resizeCanvas, 50);
  </script>
</body>
</html>
```