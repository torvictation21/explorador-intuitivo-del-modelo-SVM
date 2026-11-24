# Documento de especificación funcional (PRD): Explorador Intuitivo de SVM — Tutor MOCAVI

## 1. Visión del producto y objetivos de aprendizaje

### Declaración de valor pedagógico
**Explorador Intuitivo de SVM — Tutor MOCAVI** es una plataforma web interactiva de arquitectura *client-side* diseñada para democratizar la comprensión geométrica e intuitiva de las **Máquinas de Vectores de Soporte (SVM)** en estudiantes de **Grado 9no de Educación Básica Secundaria (14 a 15 años)** dentro de la asignatura de Tecnología e Informática.

El sistema resuelve la brecha cognitiva entre las matemáticas escolares (plano cartesiano bidimensional) y el aprendizaje automático supervisado mediante dos componentes acoplados en tiempo real:
1. Un **Laboratorio Visoespacial Interactivo** que traduce hiperplanos, márgenes y *kernels* a metáforas espaciales manipulables (avenidas de separación, pasillos de seguridad, pilares de borde y elevación topográfica 2D $\rightarrow$ 3D).
2. Un **Agente Tutor Socrático (Tutor-SVM MOCAVI)** gobernado por telemetría conductual y análisis semántico que fomenta el descubrimiento autónomo sin entregar fórmulas algebraicas multivariables ni respuestas resueltas.

### Alineación curricular y resultados de aprendizaje
* **Estándares de referencia:** CSTA K-12 Computer Science Standards (`3A-AP-13`, `3A-DA-12`), marco AI4K12 (Gran Idea 3: Aprendizaje Automático) y Recomendación sobre la Ética de la IA de la UNESCO.
* **Objetivos de aprendizaje verificables:**
  * **OA-1 (Vectores de soporte e invarianza):** Demostrar mediante manipulación espacial que únicamente los puntos fronterizos determinan la posición e inclinación del hiperplano de separación.
  * **OA-2 (Margen geométrico óptimo):** Argumentar por qué maximizar el ancho de la franja vacía entre clases mejora la capacidad de generalización ante datos nuevos.
  * **OA-3 (Margen blando y parámetro $C$):** Calibrar el equilibrio entre tolerancia al ruido (datos atípicos) y estabilidad del margen evitando el sobreajuste (*overfitting*).
  * **OA-4 (Kernelización intuitiva y ética de datos):** Comprender cómo una transformación dimensional (2D a 3D) permite separar patrones concéntricos no lineales y evaluar críticamente el impacto de sesgos en los conjuntos de entrenamiento.

### Alcance funcional delimitado
* **Incluido en el alcance (In-Scope):** Motor matemático SVM ejecutado 100% en el navegador (kernels Lineal, Polinomial y RBF), bus de eventos telemétricos en tiempo real, tutor socrático con memoria dual y escalera de pistas N1–N3, contraejemplos visuales automatizados y panel de observabilidad docente con alertas silenciosas.
* **Excluido del alcance (Out-of-Scope):** Autenticación mediante datos personales identificables (PII), almacenamiento permanente en nube fuera de la sesión escolar, exhibición de ecuaciones matriciales o multiplicadores de Lagrange, y resolución automática de ejercicios por parte del asistente conversacional.

---

## 2. Arquitectura de la aplicación y flujo de datos

### Estructura modular de doble panel sincronizado
La interfaz gráfica se organiza en una vista dividida responsiva (70% espacio de experimentación visual / 30% mediación dialógica) conectada mediante un **Bus de Eventos Reactivo (`MOCAVIEventBus`)**:

* **Panel A — Laboratorio Visoespacial 2D/3D (`SpatialCanvasModule`):**
  * **Motor de cálculo SVM Client-Side:** Implementación optimizada de *Sequential Minimal Optimization* (SMO) en JavaScript/WebAssembly que recalcula frontera, márgenes y vectores de soporte en $< 50\text{ ms}$.
  * **Capa de renderizado Canvas/WebGL:** Dibuja regiones de decisión sombreadas, línea central (hiperplano), líneas punteadas (bordes del margen), anillos luminosos alrededor de los vectores de soporte y transición animada 2D $\rightarrow$ 3D para patrones radiales.
  * **Controles pedagógicos:** Selector de clase de pincel (Clase A Azul / Clase B Naranja), selector de escenarios progresivos (*Tier 1*, *Tier 2*, *Tier 3*), deslizador de tolerancia ($C$) y selector de geometría de frontera (*Lineal*, *Curva suave*, *Islas/Anillos*).
* **Panel B — Tutor Socrático MOCAVI (`SocraticTutorModule`):**
  * **Gestor de Silencio Activo:** Temporizador determinista que bloquea interrupciones durante los primeros $15\text{–}20\text{ s}$ de cada escenario o durante arrastres fluidos en el lienzo.
  * **Motor de Inferencia y Memoria Dual:** Evalúa la convergencia entre telemetría motriz y respuestas textuales, ejecutando llamadas a herramientas (`trigger_pedagogical_counterexample` y `teacher_alert_event`).

### Diagrama de comunicación de eventos

```text
┌─────────────────────────────────────┐         ┌──────────────────────────────────────┐
│   PANEL A: LABORATORIO VISOESPACIAL │         │    PANEL B: TUTOR SOCRÁTICO MOCAVI   │
│  - Canvas 2D / Proyección 3D        │         │  - Chat Socrático (Máx. 3-4 líneas)  │
│  - Motor SVM Client-Side (< 50 ms)  │         │  - Buffer Memoria Trabajo (5T + 10E) │
│  - Controles: Puntos, C, Kernel     │         │  - Vector Perfil Sesión (JSON)       │
└──────────────────┬──────────────────┘         └──────────────────┬───────────────────┘
                   │                                               │
                   │  1. Emite telemetry_event                     │
                   │     (drag, slider C, hover SV, idle)          │
                   ▼                                               ▼
          ┌─────────────────────────────────────────────────────────────────┐
          │                 BUS DE EVENTOS REACTIVO (MOCAVIEventBus)        │
          │  - Sincroniza estado geométrico <-> estado cognitivo            │
          │  - Ejecuta trigger_pedagogical_counterexample (tras 2 fallos)   │
          │  - Emite teacher_alert_event (tras agotar pistas N1-N3)         │
          └────────────────────────────────┬────────────────────────────────┘
                                           │
                                           ▼
                          ┌─────────────────────────────────┐
                          │ PANEL C: OBSERVABILIDAD DOCENTE │
                          │ - Trazabilidad 4 Nodos SVM      │
                          │ - Alertas Silenciosas de Aula   │
                          └─────────────────────────────────┘
```

### Esquemas JSON formales y validados

#### Esquema 1: Vector de Perfil de Sesión (`session_profile`)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SessionProfileVector",
  "type": "object",
  "required": ["session_token", "grade", "active_tier", "scaffolding_phase", "nodes", "misconceptions"],
  "properties": {
    "session_token": {
      "type": "string",
      "pattern": "^anon_[a-zA-Z0-9]{12}$",
      "description": "Token efímero anonimizado sin datos personales (Cero PII)."
    },
    "grade": { "type": "string", "const": "9no_Secundaria" },
    "active_tier": {
      "type": "string",
      "enum": ["TIER_1_LINEAR", "TIER_2_SOFT_MARGIN", "TIER_3_KERNEL_NONLINEAR"]
    },
    "scaffolding_phase": {
      "type": "string",
      "enum": ["EXPLORACION", "DESESTABILIZACION", "TRANSFERENCIA"]
    },
    "nodes": {
      "type": "object",
      "required": ["N1_SV", "N2_MARGIN", "N3_CPARAM", "N4_KERNEL"],
      "properties": {
        "N1_SV": { "$ref": "#/$defs/nodeProgress" },
        "N2_MARGIN": { "$ref": "#/$defs/nodeProgress" },
        "N3_CPARAM": { "$ref": "#/$defs/nodeProgress" },
        "N4_KERNEL": { "$ref": "#/$defs/nodeProgress" }
      }
    },
    "misconceptions": {
      "type": "object",
      "properties": {
        "ERR_CENTROID": { "$ref": "#/$defs/errorTracker" },
        "ERR_RIGID_MARGIN": { "$ref": "#/$defs/errorTracker" },
        "ERR_REGRESSION": { "$ref": "#/$defs/errorTracker" },
        "ERR_2D_FIXATION": { "$ref": "#/$defs/errorTracker" }
      }
    }
  },
  "$defs": {
    "nodeProgress": {
      "type": "object",
      "required": ["status", "mastery_score", "canvas_verified", "verbal_verified", "consecutive_errors"],
      "properties": {
        "status": {
          "type": "string",
          "enum": ["NO_INICIADO", "EN_PROGRESO", "EN_CONFLICTO", "CONSOLIDADO"]
        },
        "mastery_score": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
        "canvas_verified": { "type": "boolean" },
        "verbal_verified": { "type": "boolean" },
        "consecutive_errors": { "type": "integer", "minimum": 0 }
      }
    },
    "errorTracker": {
      "type": "object",
      "required": ["count", "hint_level_reached", "resolved"],
      "properties": {
        "count": { "type": "integer", "minimum": 0 },
        "hint_level_reached": { "type": "integer", "minimum": 0, "maximum": 3 },
        "resolved": { "type": "boolean" }
      }
    }
  }
}
```

#### Esquema 2: Buffer de Memoria de Trabajo (`working_memory_buffer`)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "WorkingMemoryBuffer",
  "type": "object",
  "required": ["dialogue_window", "telemetry_window"],
  "properties": {
    "dialogue_window": {
      "type": "array",
      "maxItems": 5,
      "description": "Buffer circular FIFO con los últimos 5 turnos conversacionales.",
      "items": {
        "type": "object",
        "required": ["turn_id", "sender", "text", "detected_intent"],
        "properties": {
          "turn_id": { "type": "integer" },
          "sender": { "type": "string", "enum": ["STUDENT", "TUTOR"] },
          "text": { "type": "string" },
          "detected_intent": { "type": "string" }
        }
      }
    },
    "telemetry_window": {
      "type": "array",
      "maxItems": 10,
      "description": "Buffer circular FIFO con las últimas 10 interacciones motrices del lienzo 2D.",
      "items": {
        "type": "object",
        "required": ["timestamp_ms", "event_type", "payload"],
        "properties": {
          "timestamp_ms": { "type": "integer" },
          "event_type": {
            "type": "string",
            "enum": [
              "POINT_ADDED",
              "POINT_DRAGGED_INTERIOR",
              "POINT_DRAGGED_SV",
              "POINT_ON_HYPERPLANE",
              "C_SLIDER_CHANGED",
              "KERNEL_SWITCHED",
              "IDLE_THRESHOLD_REACHED"
            ]
          },
          "payload": {
            "type": "object",
            "properties": {
              "margin_width": { "type": "number" },
              "sv_count": { "type": "integer" },
              "c_value": { "type": "number" },
              "kernel": { "type": "string" },
              "hyperplane_delta_angle": { "type": "number" }
            }
          }
        }
      }
    }
  }
}
```

#### Esquema 3: Firma del Despachador de Contraejemplos (`trigger_pedagogical_counterexample`)
```json
{
  "name": "trigger_pedagogical_counterexample",
  "description": "Proyecta una demostración visual no invasiva en el Panel A tras 2 fallos consecutivos sin alterar los datos del estudiante.",
  "parameters": {
    "type": "object",
    "required": ["counterexample_type", "target_node", "misconception_code", "duration_ms"],
    "properties": {
      "counterexample_type": {
        "type": "string",
        "enum": [
          "HIGHLIGHT_SUPPORT_VECTORS",
          "INJECT_OVERFIT_TEST_BURST",
          "COMPARE_FENCE_VS_TREND",
          "ANIMATE_2D_TO_3D_ELEVATION"
        ]
      },
      "target_node": {
        "type": "string",
        "enum": ["N1_SV", "N2_MARGIN", "N3_CPARAM", "N4_KERNEL"]
      },
      "misconception_code": {
        "type": "string",
        "enum": ["ERR_CENTROID", "ERR_RIGID_MARGIN", "ERR_REGRESSION", "ERR_2D_FIXATION"]
      },
      "duration_ms": {
        "type": "integer",
        "minimum": 2000,
        "maximum": 6000
      }
    }
  }
}
```

#### Esquema 4: Evento de Alerta Silenciosa al Docente (`teacher_alert_event`)
```json
{
  "name": "teacher_alert_event",
  "description": "Notifica silenciosamente al panel docente cuando se agotan los 3 niveles de pistas socráticas sin desbloqueo.",
  "parameters": {
    "type": "object",
    "required": ["session_token", "timestamp_iso", "stalled_node", "exhausted_misconception", "diagnostic_summary"],
    "properties": {
      "session_token": { "type": "string", "pattern": "^anon_[a-zA-Z0-9]{12}$" },
      "timestamp_iso": { "type": "string", "format": "date-time" },
      "stalled_node": { "type": "string", "enum": ["N1_SV", "N2_MARGIN", "N3_CPARAM", "N4_KERNEL"] },
      "exhausted_misconception": { "type": "string" },
      "diagnostic_summary": { "type": "string", "maxLength": 220 }
    }
  }
}
```

---

## 3. Especificación detallada de historias de usuario (HU-01 a HU-04)

### HU-01: Manipulación de puntos e invarianza de hiperplano
| Atributo | Especificación |
| :--- | :--- |
| **Enunciado canónico** | **Como** estudiante de Grado 9no, **quiero** agregar y arrastrar puntos de dos categorías en el plano cartesiano 2D **para** observar en tiempo real qué puntos modifican la línea separadora y cuáles no la afectan. |
| **Precondiciones** | El simulador está cargado en `TIER_1_LINEAR` con al menos 3 puntos de Clase A y 3 puntos de Clase B; el motor SVM client-side está activo. |
| **Flujo principal** | 1. El estudiante selecciona un punto ubicado en el interior profundo de la nube azul (lejos de las líneas punteadas).<br>2. Arrastra el punto a una nueva coordenada interior sin cruzar el borde del margen.<br>3. El motor SVM recalcula en $< 50\text{ ms}$ y mantiene idénticos el hiperplano y el margen (`hyperplane_delta_angle == 0`).<br>4. El estudiante arrastra posteriormente un punto resaltado con anillo de Vector de Soporte.<br>5. El hiperplano y las líneas de margen rotan y se desplazan dinámicamente en sincronía con el cursor. |
| **Flujo alternativo / Excepciones** | Si el estudiante arrastra un punto de Clase A cruzando completamente hacia el territorio de Clase B en `TIER_1_LINEAR`, el sistema recalcula una nueva frontera si es linealmente separable o emite el evento `NON_SEPARABLE_STATE` invitando a explorar el margen blando. |
| **Postcondiciones** | `telemetry_window` registra `POINT_DRAGGED_INTERIOR` o `POINT_DRAGGED_SV` y habilita la verificación de `canvas_verified = true` para el nodo `N1_SV`. |

**Criterios de aceptación (Gherkin):**
```gherkin
Escenario: Invarianza del hiperplano al mover puntos interiores
  Dado que el simulador muestra dos clases linealmente separables con el hiperplano y márgenes visibles
  Cuando el estudiante arrastra un punto que no es vector de soporte dentro de su propio territorio sin tocar el margen
  Entonces el hiperplano y las líneas punteadas deben permanecer en la misma posición e inclinación en menos de 50 ms
  Y el bus de telemetría debe registrar el evento "POINT_DRAGGED_INTERIOR".

Escenario: Sensibilidad del hiperplano al desplazar un vector de soporte
  Dado que el estudiante identifica un punto resaltado con anillo de vector de soporte
  Cuando el estudiante arrastra ese vector de soporte 1 unidad hacia la clase contraria
  Entonces el hiperplano y el ancho del margen deben recalcularse y renderizarse en tiempo real en menos de 50 ms
  Y el bus de telemetría debe registrar el evento "POINT_DRAGGED_SV".
```

---

### HU-02: Escenarios progresivos y diálogo socrático conciso
| Atributo | Especificación |
| :--- | :--- |
| **Enunciado canónico** | **Como** estudiante de Grado 9no, **quiero** avanzar por escenarios de dificultad progresiva acompañados de preguntas cortas y claras **para** comprender el margen óptimo, el parámetro $C$ y las fronteras curvas sin abrumarme con fórmulas matemáticas. |
| **Precondiciones** | Sesión inicializada con token anónimo y timer de Silencio Activo configurado entre $15\text{ s}$ y $20\text{ s}$. |
| **Flujo principal** | 1. Al cargar un escenario, el tutor mantiene Silencio Activo durante $18\text{ segundos}$ permitiendo exploración libre.<br>2. Transcurrido el tiempo o ante la primera consulta del alumno, el tutor emite una intervención de máximo 3 a 4 líneas usando metáforas de calles y barrios, cerrando con una única pregunta abierta.<br>3. Tras demostrar convergencia (acción válida en lienzo + explicación coherente) en `TIER_1_LINEAR`, se desbloquea `TIER_2_SOFT_MARGIN` (datos con ruido y deslizador $C$) y luego `TIER_3_KERNEL_NONLINEAR` (anillos concéntricos y vista 3D). |
| **Flujo alternativo / Excepciones** | Si el estudiante solicita directamente la respuesta (*"dime qué valor pongo en C"*), el tutor bloquea la entrega numérica y propone un micro-experimento comparando ambos extremos del deslizador. |
| **Postcondiciones** | El progreso queda registrado en `session_profile` y los escenarios superiores se desbloquean únicamente tras consolidar los nodos previos. |

**Criterios de aceptación (Gherkin):**
```gherkin
Escenario: Respeto al Silencio Activo y formato socrático conciso
  Dado que el estudiante acaba de cargar un escenario nuevo en el simulador
  Cuando transcurren los primeros 15 segundos de exploración en el lienzo sin que el estudiante escriba en el chat
  Entonces el panel del tutor debe permanecer en silencio sin emitir mensajes emergentes
  Y cuando intervenga posteriormente, su respuesta debe tener máximo 4 líneas, cero fórmulas algebraicas y terminar con exactamente una pregunta abierta.
```

---

### HU-03: Detección y mitigación de errores conceptuales
| Atributo | Especificación |
| :--- | :--- |
| **Enunciado canónico** | **Como** sistema tutor inteligente, **quiero** detectar automáticamente patrones de error en las acciones del lienzo y en las respuestas del estudiante **para** desplegar pistas graduadas y contraejemplos visuales que corrijan sus concepciones erróneas. |
| **Precondiciones** | `working_memory_buffer` activo recibiendo telemetría del Panel A y mensajes del Panel B. |
| **Flujo principal** | 1. El estudiante incurre en un patrón erróneo (ej. sube $C$ al máximo colapsando el margen por un único *outlier*).<br>2. Ante el primer fallo, el tutor activa Pista Nivel 1 (foco visual sobre el ancho del pasillo).<br>3. Si persiste el error en el siguiente intento, activa Pista Nivel 2 (micro-experimento guiado).<br>4. Al acumular 2 fallos consecutivos (`consecutive_errors == 2`), el motor invoca `trigger_pedagogical_counterexample` proyectando la ayuda visual automatizada en el lienzo.<br>5. Cuando el estudiante ajusta correctamente el modelo y explica el motivo, el nodo cambia a `CONSOLIDADO`. |
| **Flujo alternativo / Excepciones** | Si tras ejecutar el contraejemplo visual (Nivel 3) el estudiante acumula un tercer fallo consecutivo o permanece inactivo $> 120\text{ s}$, se dispara `teacher_alert_event`. |
| **Postcondiciones** | `misconceptions[code].resolved` pasa a `true` una vez verificada la convergencia multimodal. |

**Criterios de aceptación (Gherkin):**
```gherkin
Escenario: Activación de contraejemplo visual tras dos fallos consecutivos
  Dado que un estudiante manifiesta perfeccionismo de margen rígido fijando C al máximo para encerrar un punto atípico
  Cuando el estudiante reincide por segunda vez consecutiva en el mismo error tras recibir las pistas de Nivel 1 y Nivel 2
  Entonces el motor debe invocar la herramienta "trigger_pedagogical_counterexample" con "INJECT_OVERFIT_TEST_BURST"
  Y el lienzo debe proyectar una ráfaga de puntos de prueba sin modificar las coordenadas originales creadas por el estudiante.
```

---

### HU-04: Panel de observabilidad docente y trazabilidad ontológica
| Atributo | Especificación |
| :--- | :--- |
| **Enunciado canónico** | **Como** docente de Tecnología e Informática, **quiero** visualizar en tiempo real el estado de avance ontológico de la clase y recibir alertas silenciosas de bloqueo crítico **para** intervenir presencialmente con los estudiantes que requieran apoyo personalizado. |
| **Precondiciones** | Al menos una sesión anónima activa emitiendo telemetría hacia el tablero docente. |
| **Flujo principal** | 1. El docente abre la vista de observabilidad de aula.<br>2. Visualiza la matriz agregada de los 4 nodos ontológicos (`N1_SV`, `N2_MARGIN`, `N3_CPARAM`, `N4_KERNEL`) identificados únicamente por `session_token`.<br>3. Cuando un estudiante agota los 3 niveles de pistas socráticas, el tablero muestra una notificación silenciosa con el nodo estancado y una síntesis diagnóstica de $\le 220$ caracteres.<br>4. El docente puede desplegar la documentación técnica de respaldo pedagógico integrada en la plataforma. |
| **Flujo alternativo / Excepciones** | Si no existen bloqueos críticos, el panel muestra únicamente indicadores de progreso por escenario sin generar notificaciones intrusivas. |
| **Postcondiciones** | El docente identifica con precisión qué concepto geométrico requiere refuerzo en el aula sin comprometer la privacidad de los menores. |

**Criterios de aceptación (Gherkin):**
```gherkin
Escenario: Recepción de alerta silenciosa tras agotamiento de pistas N1-N3
  Dado que un estudiante ha recibido las pistas de Nivel 1, Nivel 2 y Nivel 3 en el nodo "N3_CPARAM"
  Cuando el estudiante registra un tercer fallo consecutivo o supera 120 segundos de inactividad posterior
  Entonces el sistema debe emitir un evento "teacher_alert_event" hacia el panel docente
  Y el panel debe mostrar el token anónimo de sesión, el nodo bloqueado y el resumen diagnóstico sin exponer datos personales.
```

---

## 4. Matriz de telemetría pedagógica y escalonamiento socrático

| Concepción errónea | Evento disparador en telemetría / chat | Nivel 1: Pregunta orientadora breve (Foco visual) | Nivel 2: Señalización visoespacial atencional (Micro-experimento) | Nivel 3: Inyección de contraejemplo automático (`consecutive_errors >= 2`) | Regla de convergencia multimodal para cerrar el nodo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Ilusión de centroide** (`ERR_CENTROID`) | `POINT_DRAGGED_INTERIOR >= 3` intentos consecutivos intentando mover la frontera desde el fondo, o frases como *"el peso de todos los puntos empuja la línea"*. | *"Mira los puntos que tienen un anillo brillante sobre las líneas punteadas: ¿hay algún punto del fondo tocando ese borde?"* | Resalta con pulso luminoso los vectores de soporte actuales y pide arrastrar un punto lejano del fondo observando la quietud de la avenida central. | Invoca `HIGHLIGHT_SUPPORT_VECTORS`: bloquea visualmente con candados los pilares del borde mientras anima el desplazamiento de puntos interiores sin mover el hiperplano. | El estudiante arrastra intencionalmente un vector de soporte (`POINT_DRAGGED_SV`) **Y** explica verbalmente que solo los puntos del borde determinan la frontera. |
| **2. Perfeccionismo de margen rígido** (`ERR_RIGID_MARGIN`) | `C_SLIDER_CHANGED` fijado en $C \ge 0.90$ reduciendo el margen $> 65\%$ por un *outlier*, o frases como *"no puede quedar ni un punto equivocado"*. | *"Observa qué tan delgada quedó tu calle de seguridad al forzar la línea para atrapar ese único punto rebelde."* | Destaca el indicador de ancho de margen en alerta ámbar y pide reducir gradualmente $C$ hasta recuperar una franja amplia y estable. | Invoca `INJECT_OVERFIT_TEST_BURST`: lanza 8 puntos de prueba nuevos cerca de la frontera estrecha para visualizar cómo son clasificados erróneamente. | El estudiante calibra $C$ en un rango intermedio equilibrado ($E_{\text{test}} \le 15\%$) **Y** justifica que un margen ancho protege mejor ante datos nuevos. |
| **3. Confusión con regresión lineal** (`ERR_REGRESSION`) | `POINT_ON_HYPERPLANE >= 2` puntos colocados deliberadamente encima de la línea central, o frases como *"la línea debe pasar por encima de los puntos"*. | *"Fíjate en los dos colores de fondo a cada lado de la línea central: ¿la línea busca conectar puntos o separar dos barrios?"* | Parpadea suavemente las dos áreas cromáticas del plano y pide observar en qué territorio queda un punto colocado exactamente sobre la línea. | Invoca `COMPARE_FENCE_VS_TREND`: superpone temporalmente una línea de tendencia gris atravesando los puntos frente a la franja vacía de separación SVM. | El estudiante ubica puntos en sus respectivas regiones separadas **Y** diferencia verbalmente entre trazar una tendencia y construir una frontera de separación. |

---

## 5. Panel de observabilidad docente y alertas silenciosas

### Mapeo de los 4 nodos ontológicos en el tablero de aula
El panel docente traduce el `SessionProfileVector` de cada sesión activa en un mapa de calor semántico por nodo ontológico:
* **Nodo 1 — Vectores de Soporte (`N1_SV`):** Mide comprensión de invarianza ante puntos interiores y dependencia exclusiva de los puntos frontera.
* **Nodo 2 — Margen Óptimo (`N2_MARGIN`):** Mide capacidad para identificar y justificar la franja de máxima separación entre clases.
* **Nodo 3 — Parámetro $C$ (`N3_CPARAM`):** Mide equilibrio entre tolerancia al ruido (*margen blando*) y prevención de sobreajuste (*margen rígido*).
* **Nodo 4 — Kernelización (`N4_KERNEL`):** Mide comprensión intuitiva de la proyección dimensional 2D $\rightarrow$ 3D ante datos concéntricos no lineales.

### Umbrales de activación y métricas de progreso de aula
1. **Indicadores de estado por estudiante (anonimizado):**
   * `Gris`: Nodo no iniciado.
   * `Azul`: Exploración activa dentro de parámetros esperados.
   * `Ámbar`: Concepción errónea detectada (Pista N1 o N2 en curso).
   * `Rojo (Alerta Silenciosa)`: Bloqueo crítico tras agotar N1, N2 y N3 (`consecutive_errors >= 3` o inactividad $> 120\text{ s}$ post-contraejemplo).
2. **Métricas agregadas de grupo:** Porcentaje de consolidación por nodo ontológico en el curso, concepción errónea predominante de la sesión y tiempo promedio de resolución por escenario (*Tier 1* a *Tier 3*).

---

## 6. Requerimientos no funcionales y criterios de aceptación del sistema

| Categoría | Requerimiento técnico / pedagógico | Métrica / Criterio de aceptación verificable |
| :--- | :--- | :--- |
| **Rendimiento y latencia** | Recálculo matemático del modelo SVM y actualización visual en el lienzo 2D al arrastrar nodos o mover el deslizador $C$. | Latencia punta a punta (evento de puntero $\rightarrow$ renderizado de hiperplano, márgenes y vectores de soporte) **$< 50\text{ ms}$** ($60\text{ FPS}$ sostenidos en navegadores estándar de aula). |
| **Silencio Activo** | Protección del tiempo de procesamiento visoespacial del estudiante sin interrupciones conversacionales prematuras. | Temporizador estricto de **$15\text{ a }20\text{ segundos}$** de silencio inicial por escenario y bloqueo de mensajes consecutivos hasta recibir acción o respuesta del alumno. |
| **Privacidad y seguridad (Cero PII)** | Cumplimiento estricto de estándares de protección de datos de menores (COPPA / GDPR-K). | Cero captura, almacenamiento o transmisión de nombres, correos, documentos o IP; identificación exclusiva mediante `session_token` efímero destruido al cerrar la pestaña. |
| **Usabilidad y diseño cognitivo** | Adaptación visual y lingüística para estudiantes de Grado 9no (14–15 años). | Interfaz libre de sobrecarga visual; respuestas del tutor limitadas a **máximo 3–4 líneas**, lenguaje basado en analogías espaciales y exactamente **1 pregunta abierta** por turno. |
| **Contención algorítmica** | Barreras deterministas contra la entrega de soluciones directas o formalismo matemático avanzado. | **0% de incidencias** en pruebas adversariales donde el tutor revele coordenadas $(x, y)$, valores numéricos exactos de $C$, ecuaciones matriciales o multiplicadores de Lagrange. |
| **Integración documental** | Disponibilidad de trazabilidad pedagógica y ontológica dentro de la plataforma web. | Acceso integrado desde la interfaz a la documentación técnica del modelo pedagógico MOCAVI, ontología DAPI 02, modelo del estudiante DAPI 03 y arquitectura de mediación socrática. |