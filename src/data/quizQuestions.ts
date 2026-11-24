import type { NodeId } from '../types/svm';

export type QuizDiagramType =
  | 'FAR_POINT_MOVE'
  | 'WIDE_VS_NARROW'
  | 'OUTLIER_C'
  | 'ISLAND_3D'
  | 'REGRESSION_VS_SVM'
  | 'SPAM_FILTER'
  | 'HIGH_C_OVERFIT'
  | 'SUPPORT_RING';

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  nodeId: NodeId;
  topicLabel: string;
  prompt: string;
  diagram: QuizDiagramType;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

export const SVM_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    nodeId: 'N1_SV',
    topicLabel: '1. Puntos Clave',
    prompt:
      'Si agarras un punto azul que está muy lejos al fondo (sin anillo violeta) y lo mueves un poco, ¿qué le pasa a la calle verde central?',
    diagram: 'FAR_POINT_MOVE',
    options: [
      { id: 'a', label: 'Se mueve bastante porque todos los puntos hacen promedio.' },
      { id: 'b', label: 'No cambia nada: solo los puntos clave del borde sostienen la calle.' },
      { id: 'c', label: 'La calle verde desaparece del mapa.' },
    ],
    correctOptionId: 'b',
    explanation:
      '¡Exacto! En un modelo SVM, los puntos lejanos no empujan la frontera; solo mandan los puntos clave del borde (Vectores de Soporte).',
  },
  {
    id: 'q2',
    nodeId: 'N1_SV',
    topicLabel: '1. Puntos Clave',
    prompt:
      '¿Qué tienen de especial los puntos rodeados por el anillo violeta en el simulador?',
    diagram: 'SUPPORT_RING',
    options: [
      { id: 'a', label: 'Son los puntos más cercanos a la calle del otro equipo y definen la frontera.' },
      { id: 'b', label: 'Son errores que el programa quiere borrar.' },
      { id: 'c', label: 'Son los puntos más viejos del mapa.' },
    ],
    correctOptionId: 'a',
    explanation:
      'Esos puntos con anillo violeta son los Pilares o Vectores de Soporte: si mueves uno de ellos, toda la calle verde se recalcula.',
  },
  {
    id: 'q3',
    nodeId: 'N2_MARGIN',
    topicLabel: '2. Calle Segura',
    prompt:
      'Hay varias líneas rectas que separan bien los puntos azules de los naranjas. ¿Cuál elige siempre un modelo SVM?',
    diagram: 'WIDE_VS_NARROW',
    options: [
      { id: 'a', label: 'La que pasa bien pegadita a los puntos azules.' },
      { id: 'b', label: 'La que deja la calle vacía (margen) más ancha posible entre ambos equipos.' },
      { id: 'c', label: 'Una línea completamente vertical al azar.' },
    ],
    correctOptionId: 'b',
    explanation:
      'SVM busca el pasillo más ancho posible porque ese espacio libre sirve como colchón de seguridad cuando llegan datos nuevos.',
  },
  {
    id: 'q4',
    nodeId: 'N2_MARGIN',
    topicLabel: '2. Calle Segura',
    prompt:
      '¿En qué se diferencia una línea de SVM de una línea de tendencia (regresión)?',
    diagram: 'REGRESSION_VS_SVM',
    options: [
      { id: 'a', label: 'La línea de SVM pasa por encima de todos los puntos para unirlos.' },
      { id: 'b', label: 'Son exactamente lo mismo.' },
      { id: 'c', label: 'La línea de SVM pasa por el espacio vacío para separar dos grupos como una cerca.' },
    ],
    correctOptionId: 'c',
    explanation:
      'Una línea de tendencia atraviesa los puntos para predecir un número; SVM dibuja una cerca por el espacio libre para clasificar grupos.',
  },
  {
    id: 'q5',
    nodeId: 'N3_CPARAM',
    topicLabel: '3. Puntos Rebeldes (C)',
    prompt:
      'Un solo punto naranja se coló dentro del barrio azul. ¿Qué pasa si subes la Rigidez (C) al máximo para atraparlo?',
    diagram: 'HIGH_C_OVERFIT',
    options: [
      { id: 'a', label: 'La calle se vuelve muy delgada y torcida, y el modelo falla más con puntos nuevos.' },
      { id: 'b', label: 'La calle se vuelve mucho más ancha y relajada.' },
      { id: 'c', label: 'El punto naranja cambia automáticamente de color a azul.' },
    ],
    correctOptionId: 'a',
    explanation:
      'Ser demasiado estricto por un solo infiltrado (C muy alto) encoge la calle y hace que el modelo "memorice" el ruido en lugar de aprender bien.',
  },
  {
    id: 'q6',
    nodeId: 'N3_CPARAM',
    topicLabel: '3. Puntos Rebeldes (C)',
    prompt:
      'Si entrenas un SVM para separar correos buenos de correo basura (spam) y hay 1 correo raro mal etiquetado, ¿qué conviene hacer?',
    diagram: 'SPAM_FILTER',
    options: [
      { id: 'a', label: 'Usar una Rigidez (C) equilibrada que tolere ese caso raro y mantenga una calle segura.' },
      { id: 'b', label: 'Bloquear todos los correos para tener cero errores.' },
      { id: 'c', label: 'Quitar la línea separadora.' },
    ],
    correctOptionId: 'a',
    explanation:
      'En el mundo real siempre hay datos raros o ruido. Un C equilibrado tolera pequeños errores para acertar mucho mejor con correos futuros.',
  },
  {
    id: 'q7',
    nodeId: 'N4_KERNEL',
    topicLabel: '4. Truco 3D',
    prompt:
      'El equipo azul forma una isla en el centro rodeada por un anillo naranja. ¿Por qué una línea recta en 2D no logra separarlos?',
    diagram: 'ISLAND_3D',
    options: [
      { id: 'a', label: 'Porque el computador se quedó sin memoria.' },
      { id: 'b', label: 'Porque cualquier línea recta corta el anillo naranja y mezcla ambos grupos.' },
      { id: 'c', label: 'Porque hay demasiados puntos azules.' },
    ],
    correctOptionId: 'b',
    explanation:
      'En una hoja plana 2D no existe ninguna recta que encierre un círculo completo. Para eso SVM usa el truco del Kernel.',
  },
  {
    id: 'q8',
    nodeId: 'N4_KERNEL',
    topicLabel: '4. Truco 3D',
    prompt:
      '¿Cómo resuelve el "Truco 3D" (Kernel) el problema de la isla rodeada?',
    diagram: 'ISLAND_3D',
    options: [
      { id: 'a', label: 'Borra los puntos naranjas del borde.' },
      { id: 'b', label: 'Eleva la isla central hacia arriba en 3D para que una lámina plana la corte limpio.' },
      { id: 'c', label: 'Cambia los colores de todos los puntos al mismo equipo.' },
    ],
    correctOptionId: 'b',
    explanation:
      '¡Brillante! Al darles altura (3D), los puntos del centro suben como una montaña y una hoja plana los separa limpiamente del anillo de abajo.',
  },
];

export function computeQuizBadge(scorePercent: number): {
  title: string;
  message: string;
} {
  if (scorePercent >= 88) {
    return {
      title: 'Maestro de Fronteras SVM',
      message: '¡Dominas súper bien cómo piensan y deciden las Máquinas de Vectores de Soporte!',
    };
  }
  if (scorePercent >= 63) {
    return {
      title: 'Constructor Geométrico',
      message: '¡Muy buen trabajo! Ya entiendes las ideas principales; repasa en el laboratorio los temas pendientes.',
    };
  }
  if (scorePercent >= 38) {
    return {
      title: 'Aprendiz de Fronteras',
      message: 'Vas por buen camino. Te recomendamos completar las Misiones en el simulador y volver a intentarlo.',
    };
  }
  return {
    title: 'Explorador Inicial',
    message: '¡Todo gran descubrimiento empieza probando! Juega 3 minutos en el Laboratorio y verás cómo todo cobra sentido.',
  };
}
