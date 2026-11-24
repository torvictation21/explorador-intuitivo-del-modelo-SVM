# Documento técnico operativo: Modelo del Estudiante Dinámico (DAPI 03) para el agente tutor de SVM - Grado 9no

## 1. Ficha técnica y arquitectura general del modelo del estudiante

### Identificación del sistema
* **Código de artefacto técnico:** MOD-EST-DAPI-03-SVM-G9
* **Denominación del subsistema:** Motor de Modelado Cognitivo Multimodal y Trazabilidad Pedagógica (*Student Model Engine* — Tutor-SVM MOCAVI).
* **Población objetivo:** Estudiantes de Grado 9no de Educación Básica Secundaria (14 a 15 años) en la asignatura de Tecnología e Informática.
* **Articulación arquitectónica:** Consume la red conceptual y los 4 niveles de dominio definidos en la Ontología Pedagógica (`ONT-DAPI-02-SVM-G9`) y ejecuta las salvaguardas éticas y socráticas establecidas en el Protocolo Institucional (`DAPI-01`).

### Principios de diseño cognitivo
1. **Doble validación epistémica (anti-memorización):** Ningún estudiante puede acreditar el dominio de un nodo conceptual únicamente mediante respuestas verbales memorizadas ni mediante ensayo y error aleatorio en el lienzo; el sistema exige sincronía estricta entre la acción geométrica observada y la justificación dialógica.
2. **Trazabilidad no invasiva en tiempo real:** Cada interacción física en el plano cartesiano 2D (arrastre de puntos, ajuste del deslizador $C$, conmutación de *kernel*) se traduce silenciosamente en indicadores de estado cognitivo sin interrumpir el flujo experimental del estudiante.
3. **Adaptación dinámica de andamiaje:** El nivel de ayuda socrática y la complejidad topológica de los conjuntos de datos (*datasets*) se recalibran automáticamente ante evidencia de consolidación o persistencia de concepciones erróneas.

### Matriz de correspondencia ontológica y niveles de dominio observable (Grado 9no)

| Nodo ontológico SVM | Nivel 1: Inicial | Nivel 2: Básico | Nivel 3: Autónomo | Nivel 4: Destacado |
| :--- | :--- | :--- | :--- | :--- |
| **N1. Vectores de Soporte** | Señala visualmente los puntos resaltados en el borde del margen sin explicar su función geométrica. | Comprueba mediante arrastre que mover puntos interiores no altera el hiperplano y que mover puntos de borde sí lo desplaza. | Predice antes de mover un punto si este modificará o no la inclinación de la frontera según su distancia al margen. | Explica por qué la eficiencia de memoria de SVM depende exclusivamente de este subconjunto crítico de datos fronterizos. |
| **N2. Margen Óptimo** | Distingue la línea central (hiperplano) de las dos líneas punteadas que delimitan la franja de seguridad. | Justifica por qué una frontera centrada con franja ancha es superior a una frontera inclinada pegada a una de las clases. | Evalúa el impacto de reducir el margen sobre la capacidad del modelo para clasificar correctamente nuevos puntos de prueba. | Analiza cómo el desbalance de escala entre ejes ($X$ vs. $Y$) distorsiona el cálculo geométrico del ancho del margen. |
| **N3. Parámetro $C$ (Margen Blando)** | Identifica que el deslizador $C$ modifica el ancho de la franja y la tolerancia frente a puntos mal ubicados. | Experimenta moviendo $C$ a sus extremos frente a un dato atípico (*outlier*), observando la tensión entre ancho y error. | Calibra $C$ en un rango intermedio equilibrado que mantiene una franja amplia sin sacrificar la estabilidad ante ruido puntual. | Argumenta críticamente los riesgos de sobreajuste (*overfitting*) en escenarios reales cuando se impone un margen excesivamente rígido. |
| **N4. Kernelización (No Linealidad)** | Reconoce cuándo dos grupos de datos (ej. círculos concéntricos) no pueden ser separados por ninguna línea recta en 2D. | Activa un *kernel* no lineal (RBF/Polinomial) y observa cómo la frontera curva rodea la isla interior de datos. | Relaciona la frontera curva en 2D con la analogía de elevación del terreno a 3D donde un plano recto separa ambas clases. | Selecciona justificadamente entre frontera lineal y no lineal evaluando la estructura geométrica y el riesgo de complejidad innecesaria. |

### Diagrama de flujo funcional del Modelo del Estudiante

```text
[INTERACCIÓN DEL ESTUDIANTE: Acción en Lienzo 2D + Mensaje en Chat Socrático]
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
[MÓDULO 1A: Telemetría de Lienzo 2D]     [MÓDULO 1B: Analizador Semántico]
 - Coordenadas arrastradas (dx, dy)       - Clasificación de intención
 - Contacto con vectores de soporte       - Detección de patrones erróneos
 - Variación parámetro C / Kernel         - Coherencia causal verbal
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     ▼
            [MÓDULO 2: Motor de Inferencia y Evidencia Convergente]
             ├── ¿Evidencia Lienzo == TRUE  &&  Evidencia Verbal == TRUE?
             │      ├── SÍ ──► Nodo = "Consolidado" ──► Subir Nivel / Andamiaje
             │      └── NO ──► Evaluar Persistencia de Error
             │                   ├── Fallos consecutivos >= 2 ──► Degradar Andamiaje
             │                   │                               + Activar Contraejemplo Visual
             │                   └── Fallos consecutivos == 1 ──► Mantener Nivel + Pista Socrática
                                     │
                                     ▼
            [MÓDULO 3: Memoria de Trazabilidad (Vector JSON de Sesión)]
             - Actualiza dominio por nodo, historial de errores y dataset activo
             - Dispara siguiente escenario pedagógico calibrado
```

---

## 2. Módulo 1: Protocolo de telemetría y diagnóstico multimodal en tiempo real

### Tabla formal de telemetría en lienzo 2D

| Variable capturada | Umbral de detección | Significado cognitivo | Evento disparador en el sistema |
| :--- | :--- | :--- | :--- |
| `drag_interior_point_count` | $\ge 3$ arrastres consecutivos de puntos con distancia $> 1.5 \times \text{margen}$ sin tocar vectores de soporte. | **Exploración de invarianza o ilusión de centroide:** El estudiante intenta mover la frontera desplazando puntos interiores profundos. | `EVT_TEST_INVARIANCE`: Activa pregunta socrática sobre por qué la frontera permaneció inmóvil. |
| `sv_hover_dwell_time_ms` | Detención del cursor o selección sostenida $\ge 2500\text{ ms}$ sobre un punto con anillo de vector de soporte. | **Focalización atencional crítica:** El estudiante inspecciona la relación geométrica entre el punto de borde y la línea punteada. | `EVT_SV_FOCUS`: Registra atención positiva en nodo `N1` y habilita validación conceptual. |
| `slider_c_oscillation_rate` | $\ge 5$ cambios bruscos de extremo a extremo ($C_{\min} \leftrightarrow C_{\max}$) en menos de $10\text{ segundos}$. | **Exploración errática / ensayo y error ciego:** Falta de hipótesis causal sobre el efecto de la regularización en el ancho del margen. | `EVT_ERRATIC_TUNING`: Pausa retos complejos y dispara micro-experimento guiado de dos pasos. |
| `c_max_overfit_lock` | Fijación de $C \ge 0.90$ provocando reducción del margen $> 65\%$ para encerrar un único punto atípico aislado. | **Perfeccionismo de margen rígido:** Priorización absoluta de cero errores de entrenamiento sobre la estabilidad geométrica. | `EVT_RIGID_MARGIN_BIAS`: Marca alerta `ERR_RIGID_MARGIN` e inyecta puntos de prueba cerca del borde. |
| `linear_kernel_in_concentric` | $\ge 3$ intentos de reubicar puntos o ajustar $C$ manteniendo `kernel = linear` en un dataset concéntrico. | **Fijación funcional bidimensional:** El estudiante asume que toda clasificación SVM debe resolverse mediante una recta en 2D. | `EVT_2D_FIXATION`: Activa pista de elevación dimensional (transición visual a Kernel RBF). |
| `point_placed_on_hyperplane` | Colocación deliberada de $\ge 2$ puntos nuevos exactamente sobre la línea central de decisión ($|\mathbf{w}\cdot\mathbf{x}+b| < 0.05$). | **Confusión con regresión lineal:** Interpreta la frontera como una línea de tendencia que debe atravesar los datos. | `EVT_REGRESSION_CONFUSION`: Marca alerta `ERR_REGRESSION` y activa contraste visual frontera vs. tendencia. |

### Matriz semántica de concepciones erróneas

| Nombre de la concepción errónea | Patrones de respuesta verbal del estudiante | Diagnóstico del agente | Contraejemplo visual automatizado asignado |
| :--- | :--- | :--- | :--- |
| **1. Ilusión de centroide (`ERR_CENTROID`)** | *"La línea se mueve por el peso de todos los puntos"*, *"Si pongo más puntos atrás, la línea se empuja"*, *"Es el promedio entre los dos grupos"*. | El estudiante confunde el hiperplano de margen máximo con el punto medio entre los centros de masa globales de cada clase. | **`VISUAL_DEMO_INVARIANCE`**: Resalta con candados visuales los vectores de soporte actuales y hace parpadear 6 puntos interiores mientras el sistema los desplaza en bloque sin que el hiperplano cambie de ángulo. |
| **2. Perfeccionismo de margen rígido (`ERR_RIGID_MARGIN`)** | *"No puede quedar ningún punto mal"*, *"Hay que subir C al máximo para que no se equivoque con ese punto"*, *"Un margen más delgado es más exacto"*. | El estudiante asocia el ancho estrecho del margen con mayor precisión, ignorando el fenómeno de sobreajuste ante nuevos datos. | **`VISUAL_DEMO_OVERFIT_TEST`**: Congela la frontera estrecha creada por el estudiante y libera una ráfaga de 8 puntos de prueba con ruido normal alrededor del grupo mayoritario para visualizar las clasificaciones erróneas. |
| **3. Confusión con regresión lineal (`ERR_REGRESSION`)** | *"La línea debería pasar por encima de los puntos"*, *"¿Por qué pasa por el espacio vacío?"*, *"Sirve para predecir el valor de Y según X"*. | Transferencia negativa desde gráficas de funciones lineales y líneas de tendencia estadística vistas en ciencias o matemáticas. | **`VISUAL_DEMO_FENCE_VS_TREND`**: Superpone temporalmente una línea punteada gris que atraviesa los puntos (regresión) frente a la avenida coloreada que los separa (SVM), pidiendo identificar cuál divide territorios. |
| **4. Fijación lineal en datos no separables (`ERR_2D_FIXATION`)** | *"Aquí el programa falló"*, *"Es imposible separarlos porque están rodeados"*, *"No existe ninguna línea que sirva aquí"*. | Incapacidad temporal para abstraer que un espacio de características 2D puede proyectarse a 3D para lograr separabilidad lineal. | **`VISUAL_DEMO_3D_ELEVATION`**: Ejecuta una animación de 3 segundos donde los puntos del círculo interior se elevan en el eje $Z$ (altura), mostrando un plano recto transparente cortando entre ambos niveles. |

---

## 3. Módulo 2: Motor de inferencia y regla de evidencia convergente

### Algoritmo formal de la regla de evidencia convergente

El motor de inferencia evalúa cada nodo ontológico $N_k \in \{N_1, N_2, N_3, N_4\}$ cruzando el registro telemétrico del lienzo (`canvas_evidence`) y la evaluación semántica del diálogo (`dialogue_evidence`). Ningún nodo transiciona a estado `CONSOLIDADO` si ambas fuentes no convergen simultáneamente.

```pascal
ALGORITHM EvaluateConvergentEvidence(student_state, node_id, canvas_telemetry, dialogue_analysis)
INPUT:
    student_state     : JSON Object (Vector de Perfil de Sesión actual)
    node_id           : String ("N1_SV", "N2_MARGIN", "N3_CPARAM", "N4_KERNEL")
    canvas_telemetry  : Record { action_valid: Boolean, error_flag: String, timestamp: Integer }
    dialogue_analysis : Record { reasoning_coherent: Boolean, detected_misconception: String, turn_count: Integer }
OUTPUT:
    updated_state     : JSON Object
    pedagogical_action: Record { scaffolding_phase: String, trigger_visual: String, prompt_directive: String }

BEGIN
    node_record <- student_state.ontology_nodes[node_id]
    
    // 1. Verificar presencia de concepción errónea en cualquiera de las dos modalidades
    active_error <- NULL
    IF (canvas_telemetry.error_flag != "NONE") THEN
        active_error <- canvas_telemetry.error_flag
    ELSE IF (dialogue_analysis.detected_misconception != "NONE") THEN
        active_error <- dialogue_analysis.detected_misconception
    END IF

    // 2. Gestión de error y persistencia
    IF (active_error != NULL) THEN
        node_record.consecutive_errors <- node_record.consecutive_errors + 1
        node_record.status <- "EN_CONFLICTO"
        student_state.misconceptions_history[active_error].occurrences <- 
            student_state.misconceptions_history[active_error].occurrences + 1
        student_state.misconceptions_history[active_error].resolved <- FALSE

        IF (node_record.consecutive_errors >= 2) THEN
            // Disparador de degradación de andamiaje y contraejemplo visual obligado
            pedagogical_action <- ExecuteScaffoldingDegradation(student_state, node_id, active_error)
        ELSE
            // Primer fallo: Desestabilización socrática leve sin ayuda visual automática
            student_state.scaffolding_state <- "DESESTABILIZACION"
            pedagogical_action <- {
                scaffolding_phase: "DESESTABILIZACION",
                trigger_visual: "NONE",
                prompt_directive: "SOCRATIC_COUNTER_QUESTION_" + active_error
            }
        END IF
        RETURN (student_state, pedagogical_action)
    END IF

    // 3. Regla estricta de Evidencia Convergente (Lienzo + Diálogo)
    IF (canvas_telemetry.action_valid == TRUE AND dialogue_analysis.reasoning_coherent == TRUE) THEN
        node_record.consecutive_errors <- 0
        node_record.convergent_hits <- node_record.convergent_hits + 1
        
        // Marcar concepciones erróneas previas de este nodo como superadas
        MarkNodeMisconceptionsResolved(student_state, node_id)

        IF (node_record.convergent_hits >= 2) THEN
            node_record.status <- "CONSOLIDADO"
            node_record.mastery_level <- PromoteMasteryLevel(node_record.mastery_level)
            student_state.scaffolding_state <- "TRANSFERENCIA"
            pedagogical_action <- {
                scaffolding_phase: "TRANSFERENCIA",
                trigger_visual: "UNLOCK_NEXT_SCENARIO",
                prompt_directive: "TRANSFER_CHALLENGE_" + node_id
            }
        ELSE
            node_record.status <- "EN_PROGRESO"
            pedagogical_action <- {
                scaffolding_phase: "DESESTABILIZACION",
                trigger_visual: "NONE",
                prompt_directive: "REQUEST_SECOND_VALIDATION_" + node_id
            }
        END IF
    ELSE
        // Evidencia unilateral (solo manipuló bien sin explicar, o solo recitó sin demostrar en lienzo)
        node_record.status <- "EVIDENCIA_UNILATERAL"
        IF (canvas_telemetry.action_valid == TRUE AND dialogue_analysis.reasoning_coherent == FALSE) THEN
            pedagogical_action <- {
                scaffolding_phase: "EXPLORACION",
                trigger_visual: "HIGHLIGHT_ACTIVE_ELEMENTS",
                prompt_directive: "ASK_WHY_CANVAS_WORKED"
            }
        ELSE
            pedagogical_action <- {
                scaffolding_phase: "EXPLORACION",
                trigger_visual: "PROMPT_CANVAS_ACTION",
                prompt_directive: "ASK_STUDENT_TO_DEMONSTRATE_IN_CANVAS"
            }
        END IF
    END IF

    RETURN (student_state, pedagogical_action)
END
```

### Lógica de persistencia de error y degradación de andamiaje

Cuando `consecutive_errors >= 2` para un mismo nodo o concepción errónea, el procedimiento `ExecuteScaffoldingDegradation` ejecuta tres acciones deterministas:
1. **Descenso de nivel de autonomía operativa:** Si el estudiante se encontraba en fase de `TRANSFERENCIA` o `DESESTABILIZACION` autónoma, el sistema retrocede su estado a `EXPLORACION_GUIADA` y bloquea temporalmente el avance hacia datasets de mayor complejidad.
2. **Inyección de contraejemplo visual automatizado:** El motor envía al frontend la señal `trigger_visual` correspondiente a la matriz de la Sección 2 (por ejemplo, `VISUAL_DEMO_INVARIANCE` o `VISUAL_DEMO_OVERFIT_TEST`), forzando una observación controlada antes de permitir nuevos intentos libres.
3. **Restricción del espacio de acción:** Se deshabilitan temporalmente los controles secundarios (como el cambio de kernel o la adición masiva de puntos) dejando activo únicamente el control crítico necesario para resolver el conflicto cognitivo específico.

---

## 4. Módulo 3: Especificación del vector de estado y adaptación de escenarios

### Schema JSON formal del Vector de Perfil de Sesión

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://mocavi.edu.co/schemas/svm-student-profile-v1.json",
  "title": "VectorPerfilSesionSVM",
  "type": "object",
  "required": [
    "session_id",
    "grade_level",
    "active_dataset_tier",
    "scaffolding_state",
    "ontology_nodes",
    "misconceptions_history",
    "telemetry_summary"
  ],
  "properties": {
    "session_id": {
      "type": "string",
      "description": "Identificador anónimo de la sesión educativa (sin PII del estudiante)."
    },
    "grade_level": {
      "type": "string",
      "const": "9no_Secundaria"
    },
    "active_dataset_tier": {
      "type": "string",
      "enum": ["TIER_1_LINEAR_SEPARABLE", "TIER_2_NOISY_SOFT_MARGIN", "TIER_3_NONLINEAR_CONCENTRIC"]
    },
    "scaffolding_state": {
      "type": "string",
      "enum": ["EXPLORACION", "EXPLORACION_GUIADA", "DESESTABILIZACION", "TRANSFERENCIA"]
    },
    "ontology_nodes": {
      "type": "object",
      "required": ["N1_SV", "N2_MARGIN", "N3_CPARAM", "N4_KERNEL"],
      "properties": {
        "N1_SV": { "$ref": "#/$defs/nodeState" },
        "N2_MARGIN": { "$ref": "#/$defs/nodeState" },
        "N3_CPARAM": { "$ref": "#/$defs/nodeState" },
        "N4_KERNEL": { "$ref": "#/$defs/nodeState" }
      }
    },
    "misconceptions_history": {
      "type": "object",
      "properties": {
        "ERR_CENTROID": { "$ref": "#/$defs/misconceptionRecord" },
        "ERR_RIGID_MARGIN": { "$ref": "#/$defs/misconceptionRecord" },
        "ERR_REGRESSION": { "$ref": "#/$defs/misconceptionRecord" },
        "ERR_2D_FIXATION": { "$ref": "#/$defs/misconceptionRecord" }
      }
    },
    "telemetry_summary": {
      "type": "object",
      "required": ["total_point_drags", "sv_targeted_drags", "c_slider_changes", "kernel_switches", "visual_demos_triggered"],
      "properties": {
        "total_point_drags": { "type": "integer", "minimum": 0 },
        "sv_targeted_drags": { "type": "integer", "minimum": 0 },
        "c_slider_changes": { "type": "integer", "minimum": 0 },
        "kernel_switches": { "type": "integer", "minimum": 0 },
        "visual_demos_triggered": { "type": "array", "items": { "type": "string" } }
      }
    }
  },
  "$defs": {
    "nodeState": {
      "type": "object",
      "required": ["status", "mastery_level", "convergent_hits", "consecutive_errors"],
      "properties": {
        "status": {
          "type": "string",
          "enum": ["NO_INICIADO", "EN_PROGRESO", "EVIDENCIA_UNILATERAL", "EN_CONFLICTO", "CONSOLIDADO"]
        },
        "mastery_level": {
          "type": "string",
          "enum": ["INICIAL", "BASICO", "AUTONOMO", "DESTACADO"]
        },
        "convergent_hits": { "type": "integer", "minimum": 0 },
        "consecutive_errors": { "type": "integer", "minimum": 0 }
      }
    },
    "misconceptionRecord": {
      "type": "object",
      "required": ["occurrences", "resolved", "last_intervention_id"],
      "properties": {
        "occurrences": { "type": "integer", "minimum": 0 },
        "resolved": { "type": "boolean" },
        "last_intervention_id": { "type": ["string", "null"] }
      }
    }
  }
}
```

### Matriz de progresión de datasets y criterios ontológicos de transición

| Nivel de escenario (*Dataset Tier*) | Configuración geométrica del lienzo | Nodos ontológicos activos | Condición obligatoria de desbloqueo hacia el siguiente nivel |
| :--- | :--- | :--- | :--- |
| **Tier 1: Datos Linealmente Separables** (`TIER_1_LINEAR_SEPARABLE`) | Dos nubes disjuntas (Clase A y Clase B) con separación limpia; deslizador $C$ fijado en valor alto y *kernel* bloqueado en `Lineal`. | `N1_SV` (Vectores de Soporte) y `N2_MARGIN` (Margen Óptimo). | `N1_SV.status == "CONSOLIDADO"` AND `N2_MARGIN.status == "CONSOLIDADO"` AND `ERR_CENTROID.resolved == TRUE` (si fue activado). |
| **Tier 2: Datos con Solapamiento y Ruido** (`TIER_2_NOISY_SOFT_MARGIN`) | Dos nubes principales separables con 2 a 3 puntos atípicos (*outliers*) infiltrados en la zona contraria; se desbloquea el deslizador del parámetro $C$. | `N3_CPARAM` (Margen Blando) + refuerzo de `N1_SV` y `N2_MARGIN`. | `N3_CPARAM.status == "CONSOLIDADO"` AND precisión en conjunto de prueba oculto $\ge 85\%$ sin colapsar el ancho del margen. |
| **Tier 3: Configuraciones Radiales / No Lineales** (`TIER_3_NONLINEAR_CONCENTRIC`) | Una clase agrupada en el centro del plano rodeada por un anillo exterior de la segunda clase; se desbloquea el selector de *Kernel* (`Lineal`, `Polinomial`, `RBF`) y la vista de proyección 3D. | `N4_KERNEL` (Kernelización) + integración crítica de todos los nodos previos. | `N4_KERNEL.status == "CONSOLIDADO"` AND justificación verbal exitosa de transferencia sobre sesgo o generalización (`Nivel Destacado`). |

---

## 5. Protocolo de andamiaje socrático tripartito

El agente tutor regula sus intervenciones conversacionales según la fase activa en `scaffolding_state`, cumpliendo la regla absoluta de **nunca entregar la configuración óptima ni la definición resuelta**:

### Fase 1: Exploración (`EXPLORACION` / `EXPLORACION_GUIADA`)
* **Objetivo cognitivo:** Activar la percepción visoespacial, orientar la atención hacia los elementos geométricos relevantes del plano 2D y fomentar la formulación de primeras hipótesis causales.
* **Regla operativa:** Formular preguntas descriptivas y experimentales directas sobre lo que ocurre en pantalla al realizar una acción simple.
* **Ejemplo contextualizado (Nodo `N1_SV`):**
  > *"Observa la franja de seguridad delimitada por las dos líneas punteadas entre los puntos azules y naranjas. Si seleccionas uno de los puntos azules que está bien al fondo a la izquierda —lejos de las líneas punteadas— y lo arrastras hacia arriba, ¿qué crees que sucederá con la línea central? Haz la prueba en el lienzo y cuéntame qué observaste."*

### Fase 2: Desestabilización (`DESESTABILIZACION`)
* **Objetivo cognitivo:** Provocar conflicto cognitivo productivo cuando el estudiante manifiesta una concepción errónea (`ERR_CENTROID`, `ERR_RIGID_MARGIN`, `ERR_REGRESSION` o `ERR_2D_FIXATION`) o muestra incoherencia entre lo que hace y lo que explica.
* **Regla operativa:** Contrastar la predicción errónea del estudiante con la evidencia visual del simulador mediante un contraejemplo focalizado.
* **Ejemplo contextualizado (Ante `ERR_RIGID_MARGIN`):**
  > *"Mencionaste que subir el parámetro C al máximo mejora el modelo porque atrapa ese único punto naranja infiltrado. Mira ahora el ancho que quedó entre las dos líneas punteadas: es casi una línea delgada. Si mañana llegan cinco puntos azules nuevos cerca de esa frontera con una ligera variación normal, ¿qué pasará con ellos al cruzar un pasillo tan estrecho?"*

### Fase 3: Transferencia (`TRANSFERENCIA`)
* **Objetivo cognitivo:** Consolidar la abstracción conceptual y proyectar el razonamiento geométrico hacia escenarios inéditos, cambios de dimensionalidad o implicaciones éticas de los datos.
* **Regla operativa:** Plantear desafíos de predicción sin manipulación previa o preguntas de extrapolación a problemas reales de clasificación.
* **Ejemplo contextualizado (Nodo `N4_KERNEL` y Ética):**
  > *"Ahora que comprobaste cómo elevar los puntos centrales hacia una tercera dimensión permite separarlos con un corte plano recto, imagina que este modelo clasifica solicitudes de becas usando dos variables: promedio académico y horas de actividades extracurriculares. Si en los datos de entrenamiento casi no incluimos estudiantes de zonas rurales, ¿hacia qué lado crees que se desplazará injustamente la frontera de decisión?"*

---

## 6. Referencias técnico-pedagógicas

* Aleven, V., Roll, I., McLaren, B. M., & Koedinger, K. R. (2016). Help helps, but only so much: Research on help seeking with intelligent tutoring systems. *International Journal of Artificial Intelligence in Education*, 26(1), 205–223. https://doi.org/10.1007/s40593-015-0089-1
* Bull, S., & Kay, J. (2016). SMILI☺: A framework for interfaces to learning data in open learner models, learning analytics and related fields. *International Journal of Artificial Intelligence in Education*, 26(1), 293–331. https://doi.org/10.1007/s40593-015-0090-8
* Casal-Otero, L., Catala, A., Fernández-Morante, C., Taboada, M., Cebreiro, B., & Barro, S. (2023). AI literacy in K-12: A systematic literature review. *International Journal of STEM Education*, 10(1), 29. https://doi.org/10.1186/s40594-023-00418-7
* Corbett, A. T., & Anderson, J. R. (1994). Knowledge tracing: Modeling the acquisition of procedural knowledge. *User Modeling and User-Adapted Interaction*, 4(4), 253–278. https://doi.org/10.1007/BF01099821
* Cortes, C., & Vapnik, V. (1995). Support-vector networks. *Machine Learning*, 20(3), 273–297. https://doi.org/10.1007/BF00994018
* Tedre, M., Toivonen, T., Kahila, J., Vartiainen, H., Valtonen, T., Jormanainen, I., & Pears, A. (2021). Teaching Machine Learning in K–12 classroom: Pedagogical and technological trajectories for artificial intelligence education. *IEEE Access*, 9, 110558–110572. https://doi.org/10.1109/ACCESS.2021.3097962