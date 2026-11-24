# Protocolo Técnico-Pedagógico: Motor de Mediación Socrática Graduada (DAPI 04) para la Enseñanza de SVM - Grado 9no

## 1. Marco Operativo y Fundamentación Epistémica del Agente Socrático

### Identificación y alcance del subsistema
* **Código de artefacto técnico:** MOT-SOC-DAPI-04-SVM-G9
* **Denominación del subsistema:** Motor de Mediación Socrática Graduada y Regulación de Intervención (*Socratic Mediation & Scaffolding Engine* — Tutor-SVM MOCAVI).
* **Población destinataria:** Estudiantes de Grado 9no de Educación Básica Secundaria (14 a 15 años) en el área de Tecnología e Informática.
* **Integración sistémica:** Opera sobre el Vector de Perfil de Sesión definido en `MOD-EST-DAPI-03-SVM-G9`, consulta la red ontológica y los niveles de dominio de `ONT-DAPI-02-SVM-G9`, y ejecuta estrictamente las salvaguardas éticas y de autonomía cognitiva establecidas en el Protocolo Institucional `DAPI-01`.

### Fundamentación epistémica: Zona de Desarrollo Próximo y carga cognitiva visoespacial
En la enseñanza del aprendizaje automático supervisado a adolescentes de 14 a 15 años, la intervención excesiva o prematura de un agente conversacional interrumpe la construcción de modelos mentales visoespaciales, generando dependencia cognitiva o sobrecarga por atención dividida entre el lienzo geométrico 2D y la ventana de diálogo. Este motor fundamenta su arquitectura de decisión en tres principios:

1. **Principio de Silencio Activo Respetuoso:** Inspirado en la teoría de la carga cognitiva y en la investigación sobre tiempos de espera (*wait-time*) en mediación socrática, el agente reconoce que observar cómo se deforma una frontera al arrastrar un punto exige procesamiento espacial silencioso antes de articular una explicación verbal.
2. **Andamiaje Contingente y Desvanecimiento (*Fading*):** Conforme a los marcos clásicos de andamiaje en Sistemas Tutores Inteligentes (ITS), la ayuda solo se suministra cuando la telemetría demuestra un estancamiento real o una concepción errónea persistente, iniciando siempre por pistas de mínima intrusión (foco visual) antes de recurrir a demostraciones guiadas.
3. **Inviolabilidad de la Agencia Epistémica:** El motor bloquea estructuralmente cualquier salida que contenga coordenadas objetivo $(x, y)$, valores numéricos óptimos del deslizador $C$, selecciones resueltas de *kernel* o definiciones teóricas cerradas previas a la deducción del estudiante.

---

## 2. Matriz de Telemetría y Mapeo de Estados del Estudiante

El motor evalúa continuamente el flujo de eventos provenientes del simulador 2D y del canal conversacional para clasificar al estudiante en uno de cinco estados operativos deterministas:

| Estado cognitivo / conductual inferido | Variables telemétricas capturadas | Umbrales temporales y cuantitativos | Significado pedagógico | Acción inmediata del motor |
| :--- | :--- | :--- | :--- | :--- |
| **1. Procesamiento Inicial (`STATE_INITIAL_OBSERVATION`)** | `time_since_scenario_load_ms`<br>`canvas_event_count` | $0\text{ ms} \le t < 18000\text{ ms}$ tras cargar un escenario, con `canvas_event_count == 0`. | El estudiante está inspeccionando visualmente la distribución de puntos, ejes y colores del nuevo reto. | **Silencio Activo:** Prohibido emitir mensajes emergentes o preguntas intrusivas. |
| **2. Exploración Fluida (`STATE_FLUID_EXPLORATION`)** | `smooth_drag_events`<br>`inter_event_interval_ms`<br>`slider_c_step_delta` | Intervalos entre manipulaciones entre $800\text{ ms}$ y $12000\text{ ms}$; movimientos continuos sin oscilación errática. | El estudiante prueba hipótesis activamente observando la relación causa-efecto entre puntos y frontera. | **Silencio Activo:** Registrar evidencia en `MOD-EST-DAPI-03` sin interrumpir el flujo manipulativo. |
| **3. Espera Dialógica (`STATE_AWAITING_STUDENT_TURN`)** | `last_actor_turn`<br>`time_since_agent_question_ms` | `last_actor_turn == "AGENT"` AND $t < 45000\text{ ms}$ desde la última pregunta socrática. | El agente formuló una pregunta o micro-reto y el estudiante está pensando o ejecutando la prueba solicitada. | **Pausa Obligada:** Bloqueo total de nuevos mensajes del tutor hasta recibir acción o texto. |
| **4. Bloqueo Cognitivo (`STATE_COGNITIVE_STALL`)** | `inactivity_duration_ms`<br>`canvas_event_count`<br>`chat_input_activity` | `inactivity_duration_ms > 45000 ms` sin movimiento de cursor en lienzo ni escritura en chat. | Desorientación sobre qué variable manipular o incapacidad para interpretar el estado actual del plano. | **Activar Escalera de Andamiaje:** Disparar Pista Nivel 1 (Foco Visual). |
| **5. Error Sistemático / Ensayo Ciego (`STATE_SYSTEMATIC_ERROR`)** | `consecutive_node_errors`<br>`slider_oscillation_count`<br>`misconception_flag` | `consecutive_node_errors >= 2` OR $\ge 5$ cambios erráticos de controles en $< 10000\text{ ms}$. | Persistencia de concepción errónea (`ERR_CENTROID`, `ERR_RIGID_MARGIN`, `ERR_REGRESSION`, `ERR_2D_FIXATION`) o manipulación aleatoria. | **Desestabilización + Escalada:** Ejecutar Pista Nivel 2 o Nivel 3 según reincidencia. |
| **6. Frustración o Solicitud de Respuesta (`STATE_FRUSTRATION_OR_SHORTCUT`)** | `sentiment_frustration_score`<br>`direct_answer_request_flag`<br>`repeated_reset_clicks` | Detección semántica de abandono (*"no entiendo nada"*, *"dime el número"*) OR $\ge 3$ clics seguidos en "Reiniciar". | Sobrecarga cognitiva o intento de evadir el esfuerzo de deducción solicitando la solución directa. | **Contención Empática + Reducción de Alcance:** Bloquear solución directa y bajar a Pista Nivel 2 guiada. |

---

## 3. Algoritmo de Control de Flujo Pedagógico

El siguiente algoritmo determinista gobierna cada ciclo de evaluación ($\Delta t = 500\text{ ms}$ o disparado por evento de usuario) del Motor de Mediación Socrática:

```text
ALGORITHM SocraticMediationControlLoop(session_profile, telemetry_snapshot, user_message)
INPUT:
    session_profile    : JSON Object (Estado actualizado desde MOD-EST-DAPI-03)
    telemetry_snapshot : Record {
                           time_since_load_ms: Integer,
                           inactivity_ms: Integer,
                           time_since_last_agent_msg_ms: Integer,
                           last_turn_actor: String, // "AGENT" | "STUDENT"
                           is_dragging_now: Boolean,
                           erratic_action_rate: Float,
                           reset_clicks_window: Integer,
                           canvas_action_completed: Boolean
                         }
    user_message       : Nullable Record {
                           text: String,
                           detected_intent: String, // "HYPOTHESIS" | "QUESTION" | "GIVE_ANSWER" | "FRUSTRATION"
                           misconception_code: String // "NONE" | "ERR_CENTROID" | "ERR_RIGID_MARGIN" | "ERR_REGRESSION" | "ERR_2D_FIXATION"
                         }
OUTPUT:
    mediation_command  : Record {
                           action_type: String, // "SILENCE" | "SOCRATIC_TRIGGER" | "SCAFFOLD_HINT" | "ESCALATE_TEACHER"
                           scaffolding_tier: Integer, // 0, 1, 2, 3
                           visual_directive: String,
                           message_template_id: String
                         }

BEGIN
    // 1. Verificar umbrales críticos de escalamiento al docente humano (Prioridad Máxima)
    IF (CheckTeacherEscalationThresholds(session_profile) == TRUE) THEN
        RETURN {
            action_type: "ESCALATE_TEACHER",
            scaffolding_tier: 3,
            visual_directive: "SHOW_SOFT_SUPPORT_BANNER",
            message_template_id: "MSG_TEACHER_NOTIFIED_CALM"
        }
    END IF

    // 2. Política 1: Reglas de Silencio Activo (Si no hay mensaje nuevo del estudiante)
    IF (user_message == NULL) THEN
        // 2a. Ventana de observación inicial (18 segundos tras cargar escenario)
        IF (telemetry_snapshot.time_since_load_ms < 18000 AND telemetry_snapshot.inactivity_ms == telemetry_snapshot.time_since_load_ms) THEN
            RETURN { action_type: "SILENCE", scaffolding_tier: 0, visual_directive: "NONE", message_template_id: "NONE" }
        END IF

        // 2b. Estudiante arrastrando nodos o explorando fluidamente
        IF (telemetry_snapshot.is_dragging_now == TRUE) THEN
            RETURN { action_type: "SILENCE", scaffolding_tier: 0, visual_directive: "NONE", message_template_id: "NONE" }
        END IF

        // 2c. Pausa obligada tras pregunta del agente mientras no supere umbral de bloqueo (45 s)
        IF (telemetry_snapshot.last_turn_actor == "AGENT" AND telemetry_snapshot.time_since_last_agent_msg_ms <= 45000) THEN
            IF (telemetry_snapshot.canvas_action_completed == FALSE) THEN
                RETURN { action_type: "SILENCE", scaffolding_tier: 0, visual_directive: "NONE", message_template_id: "NONE" }
            END IF
        END IF
    END IF

    // 3. Evaluación de Frustración, Solicitud de Respuesta Directa o Ensayo Ciego
    IF ((user_message != NULL AND user_message.detected_intent IN ["GIVE_ANSWER", "FRUSTRATION"]) 
        OR telemetry_snapshot.erratic_action_rate >= 0.5 
        OR telemetry_snapshot.reset_clicks_window >= 3) THEN
        
        session_profile.current_hint_tier <- MIN(3, session_profile.current_hint_tier + 1)
        RETURN {
            action_type: "SCAFFOLD_HINT",
            scaffolding_tier: MAX(2, session_profile.current_hint_tier),
            visual_directive: "LOCK_SECONDARY_CONTROLS",
            message_template_id: "HINT_TIER_" + MAX(2, session_profile.current_hint_tier) + "_" + session_profile.active_node
        }
    END IF

    // 4. Evaluación de Bloqueo Cognitivo por Inactividad (> 45 segundos)
    IF (telemetry_snapshot.inactivity_ms > 45000) THEN
        session_profile.current_hint_tier <- MIN(3, session_profile.current_hint_tier + 1)
        RETURN {
            action_type: "SCAFFOLD_HINT",
            scaffolding_tier: session_profile.current_hint_tier,
            visual_directive: GetVisualDirectiveForHintTier(session_profile.current_hint_tier, session_profile.active_node),
            message_template_id: "HINT_TIER_" + session_profile.current_hint_tier + "_" + session_profile.active_node
        }
    END IF

    // 5. Política 2: Disparadores Socráticos ante Acción Completada o Mensaje del Estudiante
    IF (user_message != NULL OR telemetry_snapshot.canvas_action_completed == TRUE) THEN
        active_node <- session_profile.active_node
        node_errors <- session_profile.ontology_nodes[active_node].consecutive_errors

        // 5a. Detección de Concepción Errónea -> Fase Desestabilización o Pista Nivel 3
        IF ((user_message != NULL AND user_message.misconception_code != "NONE") OR node_errors >= 1) THEN
            IF (node_errors >= 2) THEN
                // Reincidencia: Escalar a Pista Nivel 3 (Contraejemplo visual guiado)
                session_profile.current_hint_tier <- 3
                RETURN {
                    action_type: "SCAFFOLD_HINT",
                    scaffolding_tier: 3,
                    visual_directive: "TRIGGER_COUNTEREXAMPLE_" + user_message.misconception_code,
                    message_template_id: "HINT_TIER_3_" + user_message.misconception_code
                }
            ELSE
                // Primer error: Disparador Socrático de Desestabilización
                RETURN {
                    action_type: "SOCRATIC_TRIGGER",
                    scaffolding_tier: 0,
                    visual_directive: "PULSE_RELEVANT_GEOMETRY",
                    message_template_id: "SOCRATIC_DESTABILIZE_" + user_message.misconception_code
                }
            END IF
        END IF

        // 5b. Acción válida sin explicación verbal -> Disparador de Validación Verbal
        IF (telemetry_snapshot.canvas_action_completed == TRUE AND user_message == NULL) THEN
            RETURN {
                action_type: "SOCRATIC_TRIGGER",
                scaffolding_tier: 0,
                visual_directive: "HIGHLIGHT_SUPPORT_VECTORS",
                message_template_id: "SOCRATIC_VALIDATE_ACTION_" + active_node
            }
        END IF

        // 5c. Respuesta verbal coherente -> Disparador de Exploración Profunda o Transferencia
        session_profile.current_hint_tier <- 0
        RETURN {
            action_type: "SOCRATIC_TRIGGER",
            scaffolding_tier: 0,
            visual_directive: "NONE",
            message_template_id: "SOCRATIC_TRANSFER_OR_EXPLORE_" + active_node
        }
    END IF

    RETURN { action_type: "SILENCE", scaffolding_tier: 0, visual_directive: "NONE", message_template_id: "NONE" }
END
```

---

## 4. Protocolo Detallado de Políticas de Mediación

### Política 1: Silencio Activo y Respeto al Procesamiento Visoespacial

El silencio del agente no es ausencia de monitoreo, sino un estado activo de observación telemétrica regido por cuatro reglas inviolables:

1. **Ventana de Aclimatación Visual ($15\text{ a }20\text{ segundos}$):** Al iniciar cualquier escenario (*Tier 1, 2 o 3*), el motor establece un temporizador de silencio de $18\text{ segundos}$. Durante este lapso, el estudiante explora libremente la distribución espacial de los puntos de ambos colores, la línea central y las líneas punteadas sin recibir notificaciones emergentes. Si el estudiante inicia una acción antes de los $18\text{ segundos}$, el temporizador se cancela y pasa a monitoreo de exploración fluida.
2. **Inmunidad durante el Arrastre Continuo (`is_dragging_now == TRUE`):** Mientras el estudiante mantiene presionado y desplaza un punto sobre el plano cartesiano o desliza suavemente el control del parámetro $C$, el agente tiene prohibido emitir mensajes. La retroalimentación visual en tiempo real del lienzo (rotación de la frontera y actualización de anillos de soporte) actúa como mediador primario.
3. **Respeto al Turno Cognitivo Post-Pregunta:** Cada vez que el agente formula una pregunta socrática, entra inmediatamente en estado `STATE_AWAITING_STUDENT_TURN` durante un máximo de $45\text{ segundos}$. Nunca encadena dos preguntas seguidas sin haber recibido previamente una acción en el lienzo o una respuesta escrita del estudiante.
4. **Silencio tras Validación Exitosa:** Cuando el estudiante resuelve correctamente un micro-experimento y lo justifica con coherencia, el agente valida brevemente en una oración y guarda silencio durante $10\text{ segundos}$ antes de presentar el siguiente desafío, permitiendo que el estudiante observe su logro en pantalla.

---

### Política 2: Taxonomía de Disparadores Socráticos y Analogías Cotidianas

Todas las intervenciones dialógicas del agente utilizan un registro cercano, claro y motivador adaptado a adolescentes de 14-15 años, sustituyendo la jerga algebraica por **analogías espaciales consistentes** (barrios, calles/avenidas, pilares de borde y elevación de terreno):

| Fase didáctica | Condición de activación | Analogía cotidiana obligatoria | Guion modelo de disparador socrático (sin revelar respuesta) |
| :--- | :--- | :--- | :--- |
| **Fase A: Exploración** (`EXPLORACION`) | Fin de la ventana de silencio inicial ($18\text{ s}$) sin acción previa, o inicio de un nuevo nodo ontológico (`N1` a `N4`). | **Dos barrios y una calle divisoria:** Los puntos azules son casas del Barrio Norte, los naranjas son casas del Barrio Sur, y la franja punteada es la calle que los separa sin tocar ninguna casa. | *"Imagina que los puntos azules y naranjas son casas de dos barrios vecinos y la franja punteada es la avenida que los separa. Si agarras una casa azul que está bien lejos al fondo y la mueves un poco, ¿crees que los constructores tendrán que mover la avenida? Haz la prueba en el mapa y dime qué pasó."* |
| **Fase B: Validación Verbal** (`VALIDACION`) | El estudiante ejecuta una manipulación correcta en el lienzo (ej. ajusta $C$ o cambia el *kernel*) pero aún no ha explicado el porqué. | **Los pilares del borde (Vectores de Soporte):** Únicamente las casas ubicadas en primera fila frente a la acera sostienen el ancho de la calle. | *"¡Bien visto! Al mover ese punto con anillo brillante, toda la avenida cambió de inclinación. ¿Por qué crees que mover ese punto sí movió la frontera, mientras que los puntos de atrás no le hicieron ni cosquillas?"* |
| **Fase C1: Desestabilización — Ilusión de Centroide** (`ERR_CENTROID`) | El estudiante arrastra puntos interiores profundos esperando mover la línea o afirma que la línea es el "promedio de todos". | **Peso de barrio vs. Primera fila:** Acumular casas lejos de la carretera no cambia el límite donde empieza la acera. | *"Veo que agregaste varios puntos azules bien lejos a la izquierda esperando que empujaran la línea verde. Mira las dos líneas punteadas de la calle: ¿alguno de esos puntos nuevos llegó a tocar la acera? ¿Qué pasaría si en lugar de esos, mueves un milímetro uno de los puntos que sí tienen anillo?"* |
| **Fase C2: Desestabilización — Margen Rígido** (`ERR_RIGID_MARGIN`) | El estudiante sube $C$ al máximo para encerrar un punto infiltrado, colapsando el ancho del margen ($> 65\%$). | **Callejón estrecho vs. Autopista segura:** Deformar y estrechar toda una autopista por culpa de una sola casa mal ubicada pone en riesgo el tráfico futuro. | *"Al subir el control C al máximo lograste atrapar ese único punto naranja infiltrado, pero mira en qué se convirtió nuestra avenida: ahora es un callejón súper estrecho. Si mañana llegan cinco casas azules nuevas cerca de ese borde con una pequeña variación, ¿tienen suficiente espacio para caer del lado correcto?"* |
| **Fase C3: Desestabilización — Confusión con Regresión** (`ERR_REGRESSION`) | El estudiante coloca puntos encima del hiperplano o pregunta por qué la línea no pasa tocando los datos. | **Cerca divisoria vs. Ruta de autobús:** Una cerca pasa por el espacio vacío para separar dos terrenos; no pasa por encima de las casas. | *"Si tu misión es construir una cerca que separe dos equipos en una cancha, ¿qué pasaría si trazas la cerca pasando justo por encima de los jugadores en lugar de por el espacio libre entre ambos grupos?"* |
| **Fase C4: Desestabilización — Fijación 2D** (`ERR_2D_FIXATION`) | El estudiante intenta separar anillos concéntricos usando una línea recta y concluye que el algoritmo no funciona. | **Sábana elástica y montaña 3D:** Si no puedes separar dos grupos en una mesa plana con una regla recta, levanta el centro hacia arriba. | *"Tienes razón: sobre esta mesa plana (2D) ninguna regla recta puede separar los puntos del centro sin cortar el anillo exterior. Pero imagina que esta pantalla es una sábana elástica y levantamos los puntos del centro hacia el techo (3D): si pasas una tabla plana entre el techo y la mesa, ¿quedarían separados?"* |

---

### Política 3: Escalera de Andamiaje Progresivo (Prohibición de Solución Directa)

Cuando el estudiante supera los $45\text{ segundos}$ de inactividad, manifiesta frustración verbal, solicita la respuesta directa o acumula errores consecutivos, el motor activa la **Escalera de Andamiaje en Tres Niveles**. En ningún nivel se revelan coordenadas, valores numéricos de $C$ ni reglas resueltas:

| Nivel de la escalera | Disparador exacto | Intervención visual en el lienzo | Guion verbal del agente (Grado 9no) | Criterio de salida del nivel |
| :--- | :--- | :--- | :--- | :--- |
| **Nivel 1: Foco Visual** (`HINT_TIER_1`) | Inactividad $> 45\text{ s}$ en estado `EXPLORACION` o primera duda general (*"no sé qué mirar"*). | Emite un pulso luminoso suave ($2\text{ s}$) alrededor de los **vectores de soporte activos** y atenúa ligeramente los puntos interiores no críticos. | *"Tranquilo, vamos paso a paso. No mires todos los puntos a la vez: fija tu vista únicamente en los puntos que acaban de brillar con un anillo sobre las líneas punteadas. ¿Qué tienen en común esos puntos frente a todos los demás?"* | El estudiante responde señalando su ubicación en el borde o hace clic/arrastra uno de los puntos resaltados. |
| **Nivel 2: Micro-experimento** (`HINT_TIER_2`) | Inactividad persistente ($> 90\text{ s}$ acumulativos), solicitud de respuesta directa (*"dime el número"*), o ensayo ciego con el deslizador $C$. | Bloquea temporalmente controles secundarios y resalta con una flecha guía un único elemento manipulable (un punto específico o un extremo del deslizador $C$). | *"No puedo darte el valor exacto porque perderías la oportunidad de descubrirlo tú, pero hagamos un experimento rápido de 5 segundos: lleva el deslizador C completamente hacia la izquierda y observa qué le pasa al ancho de la calle. Cuando lo hagas, cuéntame si la calle se volvió más ancha o más angosta."* | El estudiante ejecuta la acción física solicitada en el simulador y reporta el cambio geométrico observado. |
| **Nivel 3: Contraejemplo Guiado** (`HINT_TIER_3`) | Reincidencia de la misma concepción errónea (`consecutive_node_errors >= 2`) o bloqueo tras ejecutar el Nivel 2. | Ejecuta una **animación automática de contraste** (`VISUAL_DEMO_INVARIANCE`, `VISUAL_DEMO_OVERFIT_TEST` o `VISUAL_DEMO_3D_ELEVATION`) durante $3\text{ segundos}$ y detiene la simulación para reflexión. | *"Mira lo que acaba de ocurrir en la pantalla: el sistema movió varios puntos del fondo (o lanzó datos nuevos de prueba) y ocurrió algo inesperado con la frontera. Con base en lo que acabas de ver en esa demostración, ¿por qué crees que ocurrió ese resultado?"* | El estudiante formula con sus propias palabras la regla geométrica deducida del contraejemplo visual. |

---

## 5. Protocolo de Escalamiento al Docente Humano

Para evitar la frustración prolongada del estudiante de Grado 9no y garantizar la supervisión pedagógica en el aula, el motor monitorea cuatro métricas cuantitativas de riesgo. Al cumplirse cualquiera de los umbrales críticos, el agente emite una alerta silenciosa al panel del profesor y cambia su tono a acompañamiento de baja presión sin penalizar la calificación.

### Matriz de umbrales deterministas de escalamiento

| Código de alerta | Métrica cuantitativa monitoreada | Umbral determinista de disparo | Comportamiento inmediato del agente con el estudiante | Acción requerida del docente humano |
| :--- | :--- | :--- | :--- | :--- |
| **`ALERT_CONCEPTUAL_LOOP`** | `consecutive_node_errors` en un mismo nodo tras haber ejecutado `HINT_TIER_3`. | $\ge 4$ errores consecutivos en el mismo nodo ontológico dentro de una misma sesión. | Detiene las preguntas evaluativas del nodo, habilita un modo de exploración libre sin retos y muestra un mensaje cálido: *"Ya exploraste bastante este reto; avísale a tu profe para revisarlo juntos en un minuto."* | Acercarse al puesto del estudiante para realizar mediación presencial con apoyo gráfico en pizarra o cuaderno. |
| **`ALERT_PROLONGED_STALL`** | `total_session_inactivity_ms` con ciclos repetidos de `HINT_TIER_1` $\rightarrow$ `HINT_TIER_2` sin respuesta. | $\ge 180000\text{ ms}$ ($3\text{ minutos}$) de inactividad acumulada sin completar ninguna acción válida. | Pausa el temporizador de sesión para no afectar métricas de tiempo y ofrece un botón de *"Pedir ayuda al profesor"*. | Verificar posibles dificultades de lectura, comprensión de la consigna o fallos técnicos en el dispositivo del estudiante. |
| **`ALERT_AFFECTIVE_DISTRESS`** | `frustration_utterance_count` + `rapid_reset_bursts`. | $\ge 3$ expresiones explícitas de frustración o bloqueo emocional en menos de $2\text{ minutos}$. | Suspende toda desestabilización socrática, valida el esfuerzo del estudiante con empatía y notifica discretamente al docente. | Intervención socioemocional breve para reducir ansiedad ante el error y reencuadrar la actividad como juego experimental. |
| **`ALERT_PREREQUISITE_GAP`** | `coordinate_placement_errors` (errores al ubicar pares $(x, y)$ básicos en el plano cartesiano). | $\ge 3$ fallos seguidos al intentar ubicar coordenadas simples en el plano 2D durante el `TIER_1`. | Activa una cuadrícula de coordenadas ampliada con guías visuales de ejes $X$ e $Y$ y notifica vacío de prerrequisito geométrico. | Reforzar brevemente la lectura de pares ordenados $(x, y)$ en el plano cartesiano antes de continuar con SVM. |

### Estructura del reporte sintético de alerta para el docente

Cuando se dispara una alerta, el panel del profesor recibe en tiempo real una ficha compacta de lectura rápida ($< 10\text{ segundos}$):

```json
{
  "alert_id": "ALT-2026-09B-014",
  "session_id": "STU-G9-ANON-024",
  "alert_code": "ALERT_CONCEPTUAL_LOOP",
  "active_dataset_tier": "TIER_2_NOISY_SOFT_MARGIN",
  "blocked_ontology_node": "N3_CPARAM (Margen Blando y Parámetro C)",
  "dominant_misconception": "ERR_RIGID_MARGIN (Perfeccionismo de margen rígido)",
  "scaffolding_history": ["SOCRATIC_DESTABILIZE", "HINT_TIER_2", "HINT_TIER_3_VISUAL_DEMO"],
  "recommended_teacher_action": "Mostrar en pantalla cómo al bajar C la franja punteada recupera su ancho y tolera el punto infiltrado sin perder estabilidad."
}
```

---

## 6. Referencias Fundamentales en Formato APA 7ma edición

* Aleven, V., Roll, I., McLaren, B. M., & Koedinger, K. R. (2016). Help helps, but only so much: Research on help seeking with intelligent tutoring systems. *International Journal of Artificial Intelligence in Education*, 26(1), 205–223. https://doi.org/10.1007/s40593-015-0089-1
* Belland, B. R., Walker, A. E., Kim, N. J., & Lefler, M. (2017). Synthesizing results from empirical research on computer-based scaffolding in STEM education: A meta-analysis. *Review of Educational Research*, 87(2), 309–344. https://doi.org/10.3102/0034654316670999
* Graesser, A. C., Conley, M. W., & Olney, A. (2012). Intelligent tutoring systems. En K. R. Harris, S. Graham, & T. Urdan (Eds.), *APA educational psychology handbook, Vol. 3: Application to learning and teaching* (pp. 451–473). American Psychological Association. https://doi.org/10.1037/13275-018
* Holstein, K., McLaren, B. M., & Aleven, V. (2019). Co-designing a real-time classroom orchestration tool to support teacher–AI complementarity. *Journal of Learning Analytics*, 6(2), 27–52. https://doi.org/10.18608/jla.2019.62.3
* Sweller, J., van Merriënboer, J. J. G., & Paas, F. (2019). Cognitive architecture and instructional design: 20 years later. *Educational Psychology Review*, 31(2), 261–292. https://doi.org/10.1007/s10648-019-09465-5
* VanLehn, K. (2011). The relative effectiveness of human tutoring, intelligent tutoring systems, and other tutoring systems. *Educational Psychologist*, 46(4), 197–221. https://doi.org/10.1080/00461520.2011.611369