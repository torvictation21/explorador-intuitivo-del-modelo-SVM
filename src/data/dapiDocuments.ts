import type { DapiDocumentMeta } from '../types/svm';

export const DAPI_DOCUMENTS: DapiDocumentMeta[] = [
  {
    id: 'dapi-01',
    number: '01',
    code: 'DAPI-01',
    shortTitle: 'Modelo Pedagógico',
    fullTitle: 'Modelo Pedagógico Institucional MOCAVI (Grado 9no)',
    category: 'Fundamentación Pedagógica',
    statusLabel: 'Activo',
    summary:
      'Fundamentación visoespacial MOCAVI para adolescentes de 14–15 años: traducción geométrica sin cálculo multivariable, matriz de concepciones erróneas y salvaguardas éticas UNESCO/AI4K12.',
    highlights: [
      'Alineación CSTA 3A-AP-13 / 3A-DA-12 y AI4K12 Gran Idea 3',
      'Metáforas espaciales: barrios, avenida central, pilares y elevación 3D',
      'Regla de autonomía cognitiva y alfabetización en sesgos algorítmicos',
    ],
    filePath: '/assets/aistudio/modelo_pedag_gico_agente_tutor_svm_grado_9no_01_fc7399b7.md',
  },
  {
    id: 'dapi-02',
    number: '02',
    code: 'DAPI-02',
    shortTitle: 'Ontología SVM',
    fullTitle: 'Modelo del Conocimiento Pedagógico: Ontología SVM',
    category: 'Conocimiento de Dominio',
    statusLabel: 'Validado',
    summary:
      'Red conceptual de 10 nodos ontológicos de SVM conectados por relaciones epistémicas y 4 niveles progresivos de dominio cognitivo (Inicial, Básico, Autónomo y Destacado).',
    highlights: [
      '10 nodos conceptuales con analogías cotidianas verificables',
      '4 niveles acumulativos de desempeño observable en el lienzo',
      'Protocolo socrático de 4 pasos: anclaje, devolución, micro-experimento y pregunta',
    ],
    filePath: '/assets/aistudio/modelo_del_conocimiento_pedag_gico_svm_ontolog_a_dapi_02_f56d02c1.md',
  },
  {
    id: 'dapi-03',
    number: '03',
    code: 'DAPI-03',
    shortTitle: 'Modelo del Estudiante',
    fullTitle: 'Modelo del Estudiante Dinámico y Evidencia Convergente',
    category: 'Modelado Cognitivo',
    statusLabel: 'Monitoreo Live',
    summary:
      'Motor de diagnóstico multimodal que exige evidencia convergente (acción válida en el lienzo 2D + justificación verbal coherente) antes de consolidar cualquier nodo ontológico.',
    highlights: [
      'Regla estricta de doble validación epistémica anti-memorización',
      'Telemetría en tiempo real: arrastres interiores, SV, oscilación de C y fijación 2D',
      'Degradación automática de andamiaje tras 2 errores consecutivos',
    ],
    filePath: '/assets/aistudio/modelo_del_estudiante_din_mico_svm_dapi_03_908789ab.md',
  },
  {
    id: 'dapi-04',
    number: '04',
    code: 'DAPI-04',
    shortTitle: 'Mediación Socrática',
    fullTitle: 'Motor de Mediación Socrática Graduada y Silencio Activo',
    category: 'Regulación Dialógica',
    statusLabel: 'En Tiempo Real',
    summary:
      'Algoritmo de control pedagógico con Silencio Activo respetuoso (15–20 s), matriz de 6 estados cognitivos, escalera de pistas N1–N3 y umbrales de escalamiento al docente humano.',
    highlights: [
      'Silencio Activo inicial de 18 s e inmunidad durante arrastre continuo',
      'Escalera progresiva: N1 Foco Visual → N2 Micro-experimento → N3 Contraejemplo',
      '4 códigos deterministas de alerta docente (bucle, bloqueo, frustración, prerrequisito)',
    ],
    filePath: '/assets/aistudio/motor_de_mediaci_n_socr_tica_graduada_svm_dapi_04_721105dc.md',
  },
  {
    id: 'dapi-05',
    number: '05',
    code: 'DAPI-05',
    shortTitle: 'Herramientas y Memoria',
    fullTitle: 'Modelo del Mundo, Herramientas Externas y Memoria Dual',
    category: 'Arquitectura Agéntica',
    statusLabel: 'Sincronizado',
    summary:
      'Formalización del espacio de estados 2D, contratos JSON de telemetría, contraejemplos de solo lectura, alertas docentes y arquitectura de memoria dual FIFO + perfil efímero Cero PII.',
    highlights: [
      'Memoria de trabajo FIFO: 5 últimos turnos + 10 eventos telemétricos',
      'Capas de contraejemplo visual read_only_overlay que no borran datos del alumno',
      'Token efímero anonimizado con TTL estricto de 90 minutos (COPPA / GDPR-K)',
    ],
    filePath: '/assets/aistudio/modelo_del_mundo_herramientas_y_memoria_dual_svm_dapi_05_91fa38d0.md',
  },
  {
    id: 'dapi-06',
    number: '06',
    code: 'DAPI-06',
    shortTitle: 'Metaprompt Maestro',
    fullTitle: 'Metaprompt Maestro de Sistema: Tutor-SVM MOCAVI',
    category: 'Gobierno Conversacional',
    statusLabel: 'Reglas Activas',
    summary:
      'Especificación de producción del tutor conversacional: respuestas de máximo 3–4 líneas, una única pregunta abierta de cierre, prohibición de fórmulas complejas y defensa antibypass.',
    highlights: [
      'Brevedad quirúrgica: máximo 3–4 líneas y 1 sola pregunta por turno',
      'Bloqueo absoluto de multiplicadores de Lagrange, matrices y respuestas directas',
      'Defensa contra intentos de bypass y sanitización automática de PII',
    ],
    filePath: '/assets/aistudio/metaprompt_maestro_de_sistema_tutor_svm_mocavi_dapi_06_2e1fea0d.md',
  },
  {
    id: 'dapi-07',
    number: '07',
    code: 'DAPI-07',
    shortTitle: 'PRD Educativo',
    fullTitle: 'Especificación Funcional (PRD Educativo) HU-01 a HU-04',
    category: 'Ingeniería de Producto',
    statusLabel: 'Aprobado',
    summary:
      'Definición integral del producto, arquitectura de doble panel sincronizado por bus de eventos, historias de usuario con criterios Gherkin y requisitos no funcionales (< 50 ms).',
    highlights: [
      'Historias HU-01 a HU-04 verificables con escenarios Gherkin',
      'Presupuesto de latencia matemática SVM < 50 ms en navegador',
      'Panel de observabilidad docente sin exposición de identidad estudiantil',
    ],
    filePath: '/assets/aistudio/especificaci_n_funcional_prd_educativo_svm_dapi_07_7395f347.md',
  },
  {
    id: 'dapi-08',
    number: '08',
    code: 'DAPI-08',
    shortTitle: 'Vibe Design Spec',
    fullTitle: 'Diseño UI/UX (Vibe Design Spec) y Accesibilidad WCAG AAA',
    category: 'Experiencia e Interfaz',
    statusLabel: 'WCAG AAA',
    summary:
      'Sistema de diseño táctil-minimalista con contraste dalto-amigable (Azul Cobalto círculos vs. Naranja Terracota rombos), layout asimétrico 68/32 y microinteracciones epistémicas.',
    highlights: [
      'Doble codificación visual (forma + color) apta para daltonismo',
      'Proporción 68% laboratorio visoespacial / 32% mediación socrática',
      'Microinteracciones de invarianza y proyección topográfica 2D → 3D',
    ],
    filePath: '/assets/aistudio/dise_o_ui_ux_vibe_design_y_prototipo_funcional_svm_dapi_08_eeaffc19.md',
  },
  {
    id: 'dapi-09',
    number: '09',
    code: 'DAPI-09',
    shortTitle: 'Arquitectura Full-Stack',
    fullTitle: 'Arquitectura de Software y Código Fuente (Vibe Coding)',
    category: 'Ingeniería de Software',
    statusLabel: 'Zero-PII Engine',
    summary:
      'Diseño modular completo con separación entre motor SVM client-side, bus de telemetría reactivo, panel socrático, endpoints de mediación y política Zero-PII en memoria volátil.',
    highlights: [
      'Separación limpia de motor matemático, telemetría y capa visual',
      'Ejecución 100% autocontenida y reactiva en tiempo real',
      'Cero cookies de rastreo y purga automática al finalizar la sesión',
    ],
    filePath: '/assets/aistudio/arquitectura_de_software_y_c_digo_fuente_vibe_coding_svm_dapi_09_c22b6329.md',
  },
];

export interface OntologyGlossaryItem {
  id: number;
  nodeRef: 'N1_SV' | 'N2_MARGIN' | 'N3_CPARAM' | 'N4_KERNEL';
  title: string;
  definition: string;
  analogyTitle: string;
  analogy: string;
  relation: string;
  accent: 'blue' | 'orange' | 'emerald' | 'violet';
}

export const ONTOLOGY_GLOSSARY: OntologyGlossaryItem[] = [
  {
    id: 1,
    nodeRef: 'N1_SV',
    title: 'Aprendizaje Supervisado (Clasificación Binaria)',
    definition:
      'Método computacional donde el algoritmo aprende a dividir ejemplos en dos categorías conocidas usando datos previamente etiquetados.',
    analogyTitle: 'Seleccionador deportivo',
    analogy:
      'Observa registros de atletas ya clasificados en Equipo Azul o Equipo Naranja para deducir la regla que separa ambos grupos.',
    relation: 'Requiere conjunto de datos etiquetados',
    accent: 'blue',
  },
  {
    id: 2,
    nodeRef: 'N1_SV',
    title: 'Espacio de Características 2D',
    definition:
      'Plano cartesiano donde cada eje (X, Y) mide un atributo numérico y cada dato aparece como un punto en sus coordenadas exactas.',
    analogyTitle: 'Mapa de dos barrios',
    analogy:
      'La posición este-oeste (X) y norte-sur (Y) de cada casa muestra dos características medidas; el color y la forma indican su barrio.',
    relation: 'Base geométrica del modelo SVM',
    accent: 'blue',
  },
  {
    id: 3,
    nodeRef: 'N2_MARGIN',
    title: 'Datos Linealmente Separables',
    definition:
      'Distribución de puntos de dos clases que pueden separarse completamente con una sola línea recta sin equivocar ningún ejemplo.',
    analogyTitle: 'Barrios a orillas opuestas',
    analogy:
      'Dos barrios situados frente a un terreno baldío completamente recto, sin casas mezcladas entre ambos lados.',
    relation: 'Permite hiperplano lineal de margen limpio',
    accent: 'emerald',
  },
  {
    id: 4,
    nodeRef: 'N2_MARGIN',
    title: 'Hiperplano de Decisión (Frontera Óptima)',
    definition:
      'Línea recta (en 2D) o plano (en 3D) que divide el espacio en dos territorios para decidir a qué clase pertenece cualquier dato nuevo.',
    analogyTitle: 'La avenida central',
    analogy:
      'La línea verde central que divide los dos barrios: todo lo que cae a un lado pertenece al Barrio Azul y al otro al Barrio Naranja.',
    relation: 'Optimiza la separación entre clases',
    accent: 'emerald',
  },
  {
    id: 5,
    nodeRef: 'N2_MARGIN',
    title: 'Margen Geométrico Máximo',
    definition:
      'Franja de seguridad vacía más ancha posible que rodea al hiperplano por ambos lados hasta tocar los puntos más cercanos de cada clase.',
    analogyTitle: 'El pasillo de seguridad más ancho',
    analogy:
      'Cuanto más ancho sea el corredor vacío entre las aceras punteadas, mayor protección habrá si llegan datos nuevos con ligeras variaciones.',
    relation: 'Maximiza la capacidad de generalización',
    accent: 'emerald',
  },
  {
    id: 6,
    nodeRef: 'N1_SV',
    title: 'Vectores de Soporte',
    definition:
      'Subconjunto crítico de puntos ubicados exactamente sobre los bordes del margen (o invadiéndolo) que sostienen la posición y el ángulo de la frontera.',
    analogyTitle: 'Los pilares o casas de primera fila',
    analogy:
      'Rodeados por el anillo violeta, son los únicos puntos que impiden que la avenida se ensanche o se incline más.',
    relation: 'Definen por sí solos el hiperplano óptimo',
    accent: 'violet',
  },
  {
    id: 7,
    nodeRef: 'N1_SV',
    title: 'Invarianza ante Puntos Interiores',
    definition:
      'Propiedad estructural de SVM según la cual mover, agregar o borrar puntos lejos de la frontera no cambia ni un milímetro el hiperplano.',
    analogyTitle: 'Casas al fondo del barrio',
    analogy:
      'Construir o mover edificios en el fondo profundo de un barrio no obliga a mover la avenida que pasa por la frontera exterior.',
    relation: 'Consecuencia directa de los vectores de soporte',
    accent: 'violet',
  },
  {
    id: 8,
    nodeRef: 'N3_CPARAM',
    title: 'Margen Blando y Parámetro C',
    definition:
      'Regulador que equilibra mantener un pasillo ancho y estable frente a exigir que ningún punto atípico (outlier) quede mal clasificado.',
    analogyTitle: 'Tolerancia ante casas rebeldes',
    analogy:
      'Con C bajo toleramos un infiltrado para conservar una autopista ancha; con C alto estrechamos toda la calle para encerrarlo, arriesgando sobreajuste.',
    relation: 'Gestiona ruido y datos solapados',
    accent: 'orange',
  },
  {
    id: 9,
    nodeRef: 'N4_KERNEL',
    title: 'Datos No Linealmente Separables',
    definition:
      'Configuraciones como islas concéntricas donde una clase rodea completamente a la otra y ninguna recta en 2D puede separarlas.',
    analogyTitle: 'Una isla dentro de un anillo',
    analogy:
      'Casas azules agrupadas en el centro rodeadas por un anillo completo de casas naranjas sobre una mesa plana.',
    relation: 'Requiere transformación mediante Kernel',
    accent: 'orange',
  },
  {
    id: 10,
    nodeRef: 'N4_KERNEL',
    title: 'Truco del Kernel (Proyección 2D → 3D)',
    definition:
      'Transformación geométrica que eleva los puntos de un plano 2D hacia una tercera dimensión (altura) donde un corte plano recto sí los separa.',
    analogyTitle: 'Cama elástica / montaña topográfica',
    analogy:
      'Al levantar las casas del centro hacia el techo en 3D, basta pasar una lámina plana entre la cima y la base para separarlas limpiamente.',
    relation: 'Preserva la lógica de corte plano en dimensión superior',
    accent: 'violet',
  },
];
