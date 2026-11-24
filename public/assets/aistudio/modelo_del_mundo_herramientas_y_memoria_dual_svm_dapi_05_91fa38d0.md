# Protocolo técnico de arquitectura: modelo del mundo, herramientas y memoria dual (DAPI 05)

## 1. Delimitación del modelo del mundo y ontología de dominio

### Definición del espacio de estados del simulador 2D
El entorno de simulación web para el aprendizaje de Máquinas de Vectores de Soporte (SVM) en Grado 9no se formaliza como un sistema de estados finitos y observables $S = \langle D, H, M, V, \theta, \tau \rangle$, donde cada variable representa una dimensión física e interpretable en el plano cartesiano bidimensional $[-10, 10] \times [-10, 10]$:

* **$D = \{(x_i, y_i, c_i)\}_{i=1}^n$ (Conjunto de puntos activos):** Colección de nodos visibles en el lienzo, donde $(x_i, y_i) \in \mathbb{R}^2$ son las coordenadas cartesianas manipulables por el estudiante y $c_i \in \{\text{CLASE\_A}, \text{CLASE\_B}\}$ representa la categoría binaria (Azul o Naranja).
* **$H$ (Frontera de decisión / Hiperplano):** Curva o recta continua calculada en tiempo real por el motor matemático del cliente que particiona el plano en dos regiones cromáticas disjuntas.
* **$M \in \mathbb{R}^+$ (Ancho geométrico del margen):** Distancia perpendicular total entre las dos líneas punteadas que flanquean el hiperplano de decisión, traducida visualmente como el "ancho del pasillo de seguridad".
* **$V \subseteq D$ (Subconjunto de vectores de soporte):** Puntos críticos de $D$ ubicados exactamente sobre los bordes del margen (o invadiéndolo bajo margen blando) que sostienen matemáticamente la posición e inclinación de $H$.
* **$\theta = \langle C, K \rangle$ (Vector de hiperparámetros de interfaz):** Estado de los dos controles pedagógicos expuestos al estudiante:
  * $C \in [0.01, 10.0]$: Deslizador de rigidez / tolerancia a errores (*Margen blando* vs. *Margen rígido*).
  * $K \in \{\text{LINEAR}, \text{POLY}, \text{RBF}\}$: Selector de geometría de frontera (*Línea recta*, *Curva suave* o *Islas/Anillos*).
* **$\tau \in \mathbb{R}^+_0$ (Estado temporal e interacción):** Temporizador de inactividad continua desde el último evento motriz o textual, junto con la tasa de errores de clasificación en entrenamiento ($E_{\text{train}}$) y en conjunto de prueba oculto ($E_{\text{test}}$).

### Matriz ontológica de los 4 conceptos clave e indicadores observables

| Nodo ontológico | Definición operativa (Grado 9no) | Analogía visoespacial MOCAVI | Indicadores observables en interfaz 2D |
| :--- | :--- | :--- | :--- |
| **N1. Vectores de Soporte (`N1_SV`)** | Subconjunto mínimo de puntos situados en la frontera que determinan por sí solos la ubicación y el ángulo del hiperplano separador. | **Los pilares del borde:** Únicas casas situadas en primera fila que sostienen las aceras de la avenida central. | 1. El estudiante selecciona o arrastra exclusivamente puntos rodeados por el anillo luminoso de soporte.<br>2. Al arrastrar puntos interiores lejanos, verifica que el ángulo de $H$ permanece invariante ($\Delta H = 0$). |
| **N2. Margen Óptimo (`N2_MARGIN`)** | Franja de seguridad vacía más ancha posible entre las dos clases, diseñada para maximizar la protección frente a nuevos datos futuros. | **La avenida más ancha:** Espacio libre máximo entre dos barrios para evitar accidentes si un vehículo se desvía ligeramente. | 1. El estudiante compara configuraciones buscando maximizar la variable visible `margin_width`.<br>2. Evita colocar puntos nuevos dentro de la zona punteada que colapsen el pasillo de seguridad. |
| **N3. Parámetro $C$ (`N3_CPARAM`)** | Regulador del equilibrio entre mantener una avenida ancha y estable frente a la obligación de clasificar sin errores puntos atípicos (*outliers*). | **Regla de tolerancia ante casas infiltradas:** Decidir si ignorar una casa aislada en terreno ajeno o torcer toda la autopista para encerrarla. | 1. Ante un *outlier* infiltrado, ajusta $C$ a un valor intermedio ($0.5 \le C \le 2.5$) en lugar de fijarlo en extremos ($0.01$ o $10.0$).<br>2. Mantiene $E_{\text{test}} \le 15\%$ preservando un ancho de margen saludable. |
| **N4. Kernelización (`N4_KERNEL`)** | Proyección matemática que eleva los datos planos (2D) hacia una tercera dimensión (altura) para separarlos mediante un corte plano recto. | **Elevación del terreno:** Hundir o levantar el centro de una sábana elástica para pasar una tabla plana entre dos grupos concéntricos. | 1. Ante un dataset radial/concéntrico, cambia el selector $K$ de `LINEAR` a `RBF` o `POLY`.<br>2. Activa la vista de proyección 3D para inspeccionar el corte plano transversal. |

### Catálogo de concepciones erróneas mapeadas contra acciones de telemetría

| ID Concepción Errónea | Descripción cognitiva en Grado 9no | Patrón de telemetría observable en el lienzo | Acción correctiva disparada por el agente |
| :--- | :--- | :--- | :--- |
| **`ERR_ALL_POINTS_MARGIN`** | Creer que el margen debe ensancharse para abarcar todos los puntos de cada nube o que los puntos lejanos empujan la frontera. | `drag_interior_point_count >= 3` con desplazamiento $> 2.0$ unidades mientras $\Delta H == 0$, seguido de intentos repetidos en el fondo de la nube. | Invoca `HIGHLIGHT_SUPPORT_VECTORS` con candados visuales en $V$ y pregunta por qué los puntos del fondo no alteraron la línea central. |
| **`ERR_SOFT_MARGIN_AS_BUG`** | Confundir el margen blando (permitir que un punto atípico quede mal clasificado) con un fallo o error de cálculo del algoritmo. | `c_slider_value >= 8.5` inmediatamente después de observar 1 punto atípico cruzando la frontera, reduciendo `margin_width` en $> 60\%$. | Invoca `INJECT_OVERFIT_TEST_BURST` (8 puntos de prueba cerca del borde) para evidenciar cómo el margen estrecho falla ante datos nuevos. |
| **`ERR_COMPLEX_KERNEL_BIAS`** | Asumir que un kernel no lineal (`RBF`) siempre es superior a uno lineal (`LINEAR`), incluso cuando los datos son perfectamente separables por una recta. | Selección de `kernel == "RBF"` y `c_slider_value >= 7.0` en `TIER_1_LINEAR_SEPARABLE`, creando islas cerradas alrededor de puntos individuales. | Formula pregunta socrática de navaja de Occam comparando la simplicidad de una avenida recta frente a fronteras cerradas sobreajustadas. |
| **`ERR_2D_FIXATION`** | Pensar que si dos grupos forman anillos concéntricos en el plano, el algoritmo SVM queda inutilizado al no existir ninguna línea recta separadora. | `linear_kernel_attempts >= 3` en `TIER_3_NONLINEAR_CONCENTRIC` con inactividad posterior $\tau \ge 30\text{ s}$. | Invoca `ANIMATE_2D_TO_3D_ELEVATION` para mostrar cómo los puntos centrales se elevan en $Z$ permitiendo un corte plano recto. |

---

## 2. Catálogo formal de herramientas externas y contratos de API

### Contrato 1: Ingesta de telemetría en tiempo real (`telemetry_event`)
Este esquema valida cada paquete JSON emitido de forma asíncrona por el simulador web 2D hacia el motor cognitivo del agente tutor ante cualquier interacción motriz o vencimiento de umbral temporal.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://mocavi.edu.co/api/schemas/telemetry_event.v1.json",
  "title": "TelemetryEventPayload",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "event_id",
    "ephemeral_session_token",
    "timestamp_ms",
    "event_type",
    "canvas_snapshot"
  ],
  "properties": {
    "event_id": {
      "type": "string",
      "pattern": "^evt_[a-zA-Z0-9]{12}$"
    },
    "ephemeral_session_token": {
      "type": "string",
      "pattern": "^sess_[a-f0-9]{32}$",
      "description": "Token criptográfico efímero sin vinculación a identidad real (Cero PII)."
    },
    "timestamp_ms": {
      "type": "integer",
      "minimum": 0
    },
    "event_type": {
      "type": "string",
      "enum": [
        "POINT_DRAGGED",
        "POINT_ADDED",
        "POINT_REMOVED",
        "C_SLIDER_CHANGED",
        "KERNEL_SWITCHED",
        "INACTIVITY_THRESHOLD_REACHED",
        "DATASET_TIER_LOADED"
      ]
    },
    "interaction_detail": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "target_point_id": { "type": ["string", "null"] },
        "is_support_vector": { "type": "boolean" },
        "distance_to_hyperplane": { "type": "number", "minimum": 0 },
        "delta_hyperplane_angle_deg": { "type": "number", "minimum": 0, "maximum": 180 },
        "previous_value": { "type": ["number", "string", "null"] },
        "current_value": { "type": ["number", "string", "null"] },
        "inactivity_duration_sec": { "type": "integer", "minimum": 0 }
      }
    },
    "canvas_snapshot": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "dataset_tier",
        "active_kernel",
        "c_parameter",
        "total_points",
        "support_vectors_count",
        "margin_width",
        "train_accuracy",
        "hidden_test_accuracy"
      ],
      "properties": {
        "dataset_tier": {
          "type": "string",
          "enum": ["TIER_1_LINEAR_SEPARABLE", "TIER_2_NOISY_SOFT_MARGIN", "TIER_3_NONLINEAR_CONCENTRIC"]
        },
        "active_kernel": {
          "type": "string",
          "enum": ["LINEAR", "POLY", "RBF"]
        },
        "c_parameter": {
          "type": "number",
          "minimum": 0.01,
          "maximum": 10.0
        },
        "total_points": { "type": "integer", "minimum": 2, "maximum": 100 },
        "support_vectors_count": { "type": "integer", "minimum": 2 },
        "margin_width": { "type": "number", "minimum": 0 },
        "train_accuracy": { "type": "number", "minimum": 0, "maximum": 1 },
        "hidden_test_accuracy": { "type": "number", "minimum": 0, "maximum": 1 }
      }
    }
  }
}
```

### Contrato 2: Disparador de contraejemplos pedagógicos visuales (`trigger_pedagogical_counterexample`)
Herramienta invocada exclusivamente por el agente cuando el motor de inferencia verifica **dos fallos consecutivos** (`consecutive_errors >= 2`) en un nodo ontológico. Permite ejecutar superposiciones visuales pedagógicas sin modificar las coordenadas de los datos del estudiante ni alterar los controles $C$ o $K$.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://mocavi.edu.co/api/schemas/trigger_pedagogical_counterexample.v1.json",
  "title": "TriggerPedagogicalCounterexampleTool",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "tool_name",
    "ephemeral_session_token",
    "precondition_verified",
    "action_command",
    "visual_parameters"
  ],
  "properties": {
    "tool_name": {
      "type": "string",
      "const": "trigger_pedagogical_counterexample"
    },
    "ephemeral_session_token": {
      "type": "string",
      "pattern": "^sess_[a-f0-9]{32}$"
    },
    "precondition_verified": {
      "type": "boolean",
      "const": true,
      "description": "Bloqueo duro: solo puede invocarse si consecutive_errors >= 2."
    },
    "action_command": {
      "type": "string",
      "enum": [
        "HIGHLIGHT_SUPPORT_VECTORS",
        "INJECT_OVERFIT_TEST_BURST",
        "ANIMATE_2D_TO_3D_ELEVATION"
      ]
    },
    "visual_parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": ["duration_ms", "read_only_overlay", "auto_revert_after_ms"],
      "properties": {
        "duration_ms": {
          "type": "integer",
          "minimum": 1500,
          "maximum": 6000
        },
        "read_only_overlay": {
          "type": "boolean",
          "const": true,
          "description": "Garantiza que la capa visual no sobrescribe los datos del alumno."
        },
        "auto_revert_after_ms": {
          "type": "integer",
          "minimum": 3000,
          "maximum": 10000
        },
        "pulse_ring_color_hex": {
          "type": "string",
          "pattern": "^#[0-9A-Fa-f]{6}$",
          "default": "#10B981"
        },
        "ghost_test_points_count": {
          "type": "integer",
          "minimum": 5,
          "maximum": 10,
          "description": "Puntos fantasma temporales para revelar errores de generalización por sobreajuste."
        },
        "elevation_axis_z_scale": {
          "type": "number",
          "minimum": 1.0,
          "maximum": 3.0,
          "description": "Factor de elevación visual para demostrar separabilidad lineal en 3D."
        }
      }
    }
  }
}
```

### Contrato 3: Notificación silenciosa al tablero docente (`teacher_alert_event`)
Payload emitido de manera asíncrona y transparente para el estudiante hacia la consola de monitoreo del aula cuando se agotan los 3 niveles de andamiaje socrático (`N1 Foco Visual`, `N2 Micro-experimento`, `N3 Contraejemplo Guiado`) sin desbloqueo cognitivo.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://mocavi.edu.co/api/schemas/teacher_alert_event.v1.json",
  "title": "TeacherAlertEventPayload",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "alert_id",
    "ephemeral_session_token",
    "station_label",
    "severity",
    "blocked_ontology_node",
    "active_misconception",
    "scaffolding_exhausted",
    "diagnostic_summary_for_teacher"
  ],
  "properties": {
    "alert_id": {
      "type": "string",
      "pattern": "^alrt_[a-zA-Z0-9]{10}$"
    },
    "ephemeral_session_token": {
      "type": "string",
      "pattern": "^sess_[a-f0-9]{32}$"
    },
    "station_label": {
      "type": "string",
      "pattern": "^Equipo-[0-9]{2}$",
      "description": "Etiqueta física del puesto de cómputo en el aula (sin nombre del menor)."
    },
    "severity": {
      "type": "string",
      "enum": ["MODERATE_STALL", "CRITICAL_COGNITIVE_BLOCK"]
    },
    "blocked_ontology_node": {
      "type": "string",
      "enum": ["N1_SV", "N2_MARGIN", "N3_CPARAM", "N4_KERNEL"]
    },
    "active_misconception": {
      "type": "string",
      "enum": [
        "ERR_ALL_POINTS_MARGIN",
        "ERR_SOFT_MARGIN_AS_BUG",
        "ERR_COMPLEX_KERNEL_BIAS",
        "ERR_2D_FIXATION",
        "UNCLASSIFIED_FRUSTRATION"
      ]
    },
    "scaffolding_exhausted": {
      "type": "object",
      "additionalProperties": false,
      "required": ["n1_visual_focus_used", "n2_micro_experiment_used", "n3_counterexample_used", "total_failed_attempts"],
      "properties": {
        "n1_visual_focus_used": { "type": "boolean", "const": true },
        "n2_micro_experiment_used": { "type": "boolean", "const": true },
        "n3_counterexample_used": { "type": "boolean", "const": true },
        "total_failed_attempts": { "type": "integer", "minimum": 3 }
      }
    },
    "diagnostic_summary_for_teacher": {
      "type": "string",
      "maxLength": 280,
      "description": "Síntesis accionable de 2 líneas para intervención presencial del docente en el aula."
    }
  }
}
```

---

## 3. Especificación técnica de la arquitectura de memoria dual

### Memoria de trabajo (Short-Term / FIFO Sliding Window)
La memoria de trabajo mantiene dos colas circulares (*First-In, First-Out*) acotadas en memoria volátil del navegador/sesión para evaluar la coherencia inmediata entre acción motriz y explicación verbal:

1. **Buffer Dialógico (`dialogue_fifo_buffer`, capacidad máxima = 5 turnos):** Almacena los últimos 5 pares `{role: "student" | "tutor", text_hash, detected_intent, target_node, timestamp_ms}`. Al ingresar un sexto turno, se descarta automáticamente el más antiguo.
2. **Buffer Telemétrico (`telemetry_fifo_buffer`, capacidad máxima = 10 eventos):** Almacena las últimas 10 interacciones relevantes en el lienzo 2D (`POINT_DRAGGED`, `C_SLIDER_CHANGED`, `KERNEL_SWITCHED`), conservando los deltas geométricos ($\Delta M$, $\Delta H$, `is_support_vector`).

#### Algoritmo de cruce para verificar coherencia acción-explicación
Antes de acreditar progreso en cualquier nodo ontológico, el motor ejecuta la función `VerifyCrossModalCoherence`:

```text
FUNCTION VerifyCrossModalCoherence(dialogue_fifo_buffer, telemetry_fifo_buffer, target_node)
INPUT:
    dialogue_fifo_buffer  : Queue[5] of DialogueTurn
    telemetry_fifo_buffer : Queue[10] of TelemetryEvent
    target_node           : String ("N1_SV" | "N2_MARGIN" | "N3_CPARAM" | "N4_KERNEL")
OUTPUT:
    coherence_result      : Record { is_coherent: Boolean, mismatch_reason: String }

BEGIN
    last_student_turn <- GetLatestStudentTurn(dialogue_fifo_buffer)
    recent_actions    <- FilterEventsByWindow(telemetry_fifo_buffer, window_ms = 30000)

    // 1. Verificar que existan acciones reales en el lienzo antes de aceptar explicaciones verbales
    IF (Length(recent_actions) == 0) THEN
        RETURN { is_coherent: FALSE, mismatch_reason: "VERBAL_WITHOUT_CANVAS_EXPERIMENT" }
    END IF

    // 2. Validar correspondencia específica según el nodo ontológico activo
    SWITCH (target_node)
        CASE "N1_SV":
            moved_sv <- ExistsEvent(recent_actions, event_type == "POINT_DRAGGED" AND is_support_vector == TRUE)
            moved_in <- ExistsEvent(recent_actions, event_type == "POINT_DRAGGED" AND is_support_vector == FALSE)
            explains_border <- ContainsCausalConcept(last_student_turn, ["borde", "punteada", "anillo", "sostiene", "no cambia"])
            IF ((moved_sv OR moved_in) AND explains_border) THEN
                RETURN { is_coherent: TRUE, mismatch_reason: "NONE" }
            END IF

        CASE "N2_MARGIN":
            widened_margin <- LatestSnapshot(recent_actions).margin_width >= OptimalThreshold(recent_actions) * 0.85
            explains_safety <- ContainsCausalConcept(last_student_turn, ["ancho", "pasillo", "espacio", "seguridad", "lejos"])
            IF (widened_margin AND explains_safety) THEN
                RETURN { is_coherent: TRUE, mismatch_reason: "NONE" }
            END IF

        CASE "N3_CPARAM":
            balanced_c <- LatestSnapshot(recent_actions).c_parameter BETWEEN 0.4 AND 2.5
            explains_tradeoff <- ContainsCausalConcept(last_student_turn, ["tolerancia", "infiltrado", "estrecha", "equilibrio", "error"])
            IF (balanced_c AND explains_tradeoff) THEN
                RETURN { is_coherent: TRUE, mismatch_reason: "NONE" }
            END IF

        CASE "N4_KERNEL":
            switched_nonlinear <- ExistsEvent(recent_actions, event_type == "KERNEL_SWITCHED" AND current_value IN ["RBF", "POLY"])
            explains_elevation <- ContainsCausalConcept(last_student_turn, ["curva", "elevar", "3d", "altura", "rodea"])
            IF (switched_nonlinear AND explains_elevation) THEN
                RETURN { is_coherent: TRUE, mismatch_reason: "NONE" }
            END IF
    END SWITCH

    RETURN { is_coherent: FALSE, mismatch_reason: "ACTION_EXPLANATION_DIVERGENCE" }
END
```

### Memoria persistente de sesión (JSON Schema)
Almacena el estado longitudinal de la sesión escolar activa (destruido automáticamente al cerrar la sesión o finalizar la clase), parametrizando el dominio continuo $[0.0, 1.0]$ por nodo y el registro de analogías ya utilizadas para evitar repetición conversacional.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://mocavi.edu.co/schemas/persistent_session_memory.v1.json",
  "title": "PersistentSessionMemorySVM",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "ephemeral_session_token",
    "created_at_epoch_ms",
    "expires_at_epoch_ms",
    "current_scenario_tier",
    "scaffolding_level_active",
    "ontology_mastery",
    "resolved_misconceptions",
    "exhausted_analogies"
  ],
  "properties": {
    "ephemeral_session_token": {
      "type": "string",
      "pattern": "^sess_[a-f0-9]{32}$"
    },
    "created_at_epoch_ms": { "type": "integer", "minimum": 0 },
    "expires_at_epoch_ms": {
      "type": "integer",
      "minimum": 0,
      "description": "TTL estricto de 90 minutos (duración máxima de bloque escolar) para purga automática."
    },
    "current_scenario_tier": {
      "type": "string",
      "enum": ["TIER_1_LINEAR_SEPARABLE", "TIER_2_NOISY_SOFT_MARGIN", "TIER_3_NONLINEAR_CONCENTRIC"]
    },
    "scaffolding_level_active": {
      "type": "integer",
      "enum": [0, 1, 2, 3],
      "description": "0: Silencio/Exploración libre, 1: Foco visual, 2: Micro-experimento, 3: Contraejemplo guiado."
    },
    "ontology_mastery": {
      "type": "object",
      "additionalProperties": false,
      "required": ["N1_SV", "N2_MARGIN", "N3_CPARAM", "N4_KERNEL"],
      "properties": {
        "N1_SV": { "$ref": "#/$defs/nodeMasteryEntry" },
        "N2_MARGIN": { "$ref": "#/$defs/nodeMasteryEntry" },
        "N3_CPARAM": { "$ref": "#/$defs/nodeMasteryEntry" },
        "N4_KERNEL": { "$ref": "#/$defs/nodeMasteryEntry" }
      }
    },
    "resolved_misconceptions": {
      "type": "array",
      "uniqueItems": true,
      "items": {
        "type": "string",
        "enum": [
          "ERR_ALL_POINTS_MARGIN",
          "ERR_SOFT_MARGIN_AS_BUG",
          "ERR_COMPLEX_KERNEL_BIAS",
          "ERR_2D_FIXATION"
        ]
      }
    },
    "exhausted_analogies": {
      "type": "array",
      "uniqueItems": true,
      "items": {
        "type": "string",
        "enum": [
          "ANALOGY_AVENIDA_ANCHA",
          "ANALOGY_PILARES_BORDE",
          "ANALOGY_CASA_INFILTRADA",
          "ANALOGY_SABANA_ELASTICA_3D",
          "ANALOGY_CERCA_VS_TENDENCIA"
        ]
      },
      "description": "Impide que el agente repita una analogía que ya fue presentada o superada en la sesión."
    }
  },
  "$defs": {
    "nodeMasteryEntry": {
      "type": "object",
      "additionalProperties": false,
      "required": ["score", "consecutive_errors", "convergent_validations", "consolidated"],
      "properties": {
        "score": {
          "type": "number",
          "minimum": 0.0,
          "maximum": 1.0
        },
        "consecutive_errors": {
          "type": "integer",
          "minimum": 0
        },
        "convergent_validations": {
          "type": "integer",
          "minimum": 0
        },
        "consolidated": {
          "type": "boolean"
        }
      }
    }
  }
}
```

---

## 4. Políticas de gobierno pedagógico, socrático y privacidad

### Reglas duras de no-resolución (Auditoría adversarial de seguridad pedagógica)
Para garantizar que ningún vector de entrada del estudiante (ingeniería de prompts, súplicas de frustración o manipulación de eventos) permita al agente resolver el reto por el alumno, se imponen cuatro bloqueos arquitectónicos inmutables:

1. **Inmutabilidad de estado del estudiante (`read_only_overlay: true`):** Ninguna herramienta invocada por el agente posee permisos de escritura sobre el arreglo de puntos $D$ ni sobre los controles $\theta = \langle C, K \rangle$ del estudiante. Las capas visuales de contraejemplo se renderizan en un *layer* temporal superpuesto que se autodestruye tras `auto_revert_after_ms`.
2. **Filtro de salida numérico y de coordenadas:** Antes de renderizar cualquier respuesta textual en el chat, un validador determinista inspecciona la cadena generada y bloquea su emisión si contiene pares ordenados exactos de solución (`(x, y)` objetivo), valores numéricos específicos para fijar el deslizador (`pon C en 1.2`) o código fuente ejecutable.
3. **Política de Silencio Activo:** El agente tiene prohibido emitir mensajes durante los primeros `18 segundos` tras la carga de un escenario o mientras el estudiante mantenga intervalos entre arrastres inferiores a `4 segundos` (flujo de exploración activa), así como inmediatamente después de formular una pregunta socrática hasta recibir respuesta.
4. **Prohibición de formalismo algebraico avanzado:** Queda bloqueada la generación de ecuaciones de optimización cuadrática, multiplicadores de Lagrange o producto punto vectorial, exigiendo traducción estricta al léxico visoespacial MOCAVI (ancho de pasillo, puntos de borde, tolerancia ante infiltrados, elevación del terreno).

### Protocolo de andamiaje socrático en 3 niveles antes del escalamiento docente

| Nivel de escalera | Disparador de activación | Acción del agente y restricción socrática | Criterio de transición al siguiente nivel |
| :--- | :--- | :--- | :--- |
| **Nivel 1: Foco Visual (`scaffolding_level = 1`)** | Inactividad $\tau \ge 45\text{ s}$ o primer error conceptual aislado (`consecutive_errors == 1`). | Orienta la atención visual hacia un elemento geométrico específico del plano mediante una pregunta abierta corta, sin sugerir qué acción ejecutar. | Si tras `30 s` adicionales persiste la inactividad o ocurre un segundo error (`consecutive_errors == 2`), asciende a **Nivel 2**. |
| **Nivel 2: Micro-experimento (`scaffolding_level = 2`)** | Segundo fallo consecutivo (`consecutive_errors == 2`) o exploración errática del deslizador $C$ ($\ge 5$ oscilaciones en $10\text{ s}$). | Propone una única acción motriz acotada de comparación causa-efecto (ej. *"Mueve un solo punto lejano del borde y observa si la línea central cambia"*). | Si el estudiante ejecuta la acción pero mantiene una conclusión errónea o falla por tercera vez (`consecutive_errors == 3`), asciende a **Nivel 3**. |
| **Nivel 3: Contraejemplo Guiado (`scaffolding_level = 3`)** | Tercer fallo consecutivo (`consecutive_errors == 3`) o expresión explícita de bloqueo/frustración. | Invoca `trigger_pedagogical_counterexample` (`HIGHLIGHT_SUPPORT_VECTORS`, `INJECT_OVERFIT_TEST_BURST` o `ANIMATE_2D_TO_3D_ELEVATION`) y pide al estudiante describir el contraste visual observado. | Si tras el contraejemplo visual el estudiante no logra articular la regla en 2 turnos, emite `teacher_alert_event` al docente humano. |

### Salvaguarda de privacidad de datos para menores de edad
En cumplimiento estricto de los estándares internacionales de protección de datos infantiles y juveniles (UNESCO, COPPA/GDPR-K y normativa escolar vigente):

* **Cero recolección de PII (Información Personal Identificable):** El sistema no solicita, procesa ni almacena nombres, apellidos, correos electrónicos, documentos de identidad, fotografías ni credenciales personales de los estudiantes de Grado 9no.
* **Anonimización mediante token efímero:** Cada sesión genera localmente un identificador aleatorio de un solo uso (`sess_[32 hex]`) vinculado únicamente a una etiqueta física de aula (`Equipo-01` a `Equipo-40`) para permitir al docente ubicar el puesto físico en caso de alerta presencial.
* **Purga automática por TTL (*Time-To-Live*):** Tanto la memoria de trabajo FIFO como el vector JSON de memoria persistente de sesión residen exclusivamente en almacenamiento volátil con caducidad estricta de `90 minutos` (`expires_at_epoch_ms`), eliminándose irreversiblemente al cerrar la pestaña o finalizar la clase.