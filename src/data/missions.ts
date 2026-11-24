import type { DatasetTier, KernelType, MissionId, NodeId } from '../types/svm';

export interface MissionStepDef {
  id: string;
  label: string;
  shortLabel: string;
}

export interface GuidedMissionDef {
  id: MissionId;
  order: number;
  nodeId: NodeId;
  tier: DatasetTier;
  kernel: KernelType;
  cParam: number;
  open3D?: boolean;
  title: string;
  subtitle: string;
  simpleGoal: string;
  realLifeExample: string;
  socraticIntro: string;
  steps: MissionStepDef[];
}

export const GUIDED_MISSIONS: GuidedMissionDef[] = [
  {
    id: 'mission-1',
    order: 1,
    nodeId: 'N1_SV',
    tier: 'TIER_1_LINEAR',
    kernel: 'LINEAR',
    cParam: 2.0,
    title: '¿Quién mueve la calle?',
    subtitle: 'Puntos Clave (Pilares)',
    simpleGoal:
      'Descubre por qué los puntos lejanos no importan y solo los puntos del borde con anillo violeta controlan la frontera.',
    realLifeExample: 'Como dos equipos en una cancha: solo los jugadores del borde definen el espacio libre.',
    socraticIntro:
      '¡Misión 1 lista! Mueve primero un punto azul del fondo (lejos de la calle) y luego mueve uno con anillo violeta. ¿Cuál de los dos sí logró mover la calle verde?',
    steps: [
      {
        id: 'm1-drag-far',
        label: 'Arrastra un punto azul lejano (sin anillo violeta) y mira si la calle se mueve.',
        shortLabel: 'Mover punto lejano',
      },
      {
        id: 'm1-drag-sv',
        label: 'Ahora arrastra un punto con anillo violeta y mira cómo gira la calle.',
        shortLabel: 'Mover punto clave',
      },
      {
        id: 'm1-explain',
        label: 'Cuéntale al Tutor con tus palabras cuál punto mandó en la calle.',
        shortLabel: 'Explicar al tutor',
      },
    ],
  },
  {
    id: 'mission-2',
    order: 2,
    nodeId: 'N2_MARGIN',
    tier: 'TIER_1_LINEAR',
    kernel: 'LINEAR',
    cParam: 2.0,
    title: 'La calle más segura',
    subtitle: 'Ancho de Calle (Margen)',
    simpleGoal:
      'Entiende por qué un modelo SVM busca el pasillo más ancho posible para no equivocarse cuando lleguen datos nuevos.',
    realLifeExample: 'Como cruzar por un puente ancho en vez de una cuerda floja: te da espacio ante errores.',
    socraticIntro:
      '¡Misión 2 lista! Acerca un punto con anillo violeta hacia el centro para hacer la calle más angosta y agrega un punto nuevo. ¿Por qué una calle más ancha protege mejor?',
    steps: [
      {
        id: 'm2-narrow-street',
        label: 'Acerca un punto con anillo violeta hacia el otro color y mira el Ancho de calle.',
        shortLabel: 'Probar ancho de calle',
      },
      {
        id: 'm2-add-point',
        label: 'Pulsa "+ Azul" o "+ Naranja" y coloca un punto nuevo en el mapa.',
        shortLabel: 'Añadir punto nuevo',
      },
      {
        id: 'm2-explain',
        label: 'Dile al Tutor por qué conviene dejar una calle ancha entre ambos grupos.',
        shortLabel: 'Explicar al tutor',
      },
    ],
  },
  {
    id: 'mission-3',
    order: 3,
    nodeId: 'N3_CPARAM',
    tier: 'TIER_2_SOFT_MARGIN',
    kernel: 'LINEAR',
    cParam: 1.0,
    title: '¡Hay infiltrados en el mapa!',
    subtitle: 'Rigidez (Regla C)',
    simpleGoal:
      'Encuentra el punto justo con el deslizador C para ignorar errores raros sin arruinar la calle de todo el grupo.',
    realLifeExample: 'Como un filtro de correo: si bloquea todo por un solo correo raro, bloquea también mensajes buenos.',
    socraticIntro:
      '¡Misión 3 lista! Aquí hay 2 puntos rebeldes metidos en el lado contrario. Prueba mover Rigidez (C) hasta "Estricto" y luego a "Relajado": ¿en qué lado la calle se ve más segura?',
    steps: [
      {
        id: 'm3-strict-c',
        label: 'Lleva el deslizador de Rigidez (C) hacia la derecha (Estricto, 4.0 o más).',
        shortLabel: 'Probar C estricto',
      },
      {
        id: 'm3-relaxed-c',
        label: 'Ahora bájalo hacia la izquierda (Relajado, 1.5 o menos) para recuperar la calle.',
        shortLabel: 'Probar C relajado',
      },
      {
        id: 'm3-explain',
        label: 'Cuéntale al Tutor si conviene apretar toda la calle por un solo infiltrado.',
        shortLabel: 'Explicar al tutor',
      },
    ],
  },
  {
    id: 'mission-4',
    order: 4,
    nodeId: 'N4_KERNEL',
    tier: 'TIER_3_KERNEL_NONLINEAR',
    kernel: 'LINEAR',
    cParam: 2.0,
    open3D: false,
    title: 'El truco mágico en 3D',
    subtitle: 'Montaña 3D (Kernel)',
    simpleGoal:
      'Mira cómo elevar una isla rodeada hacia arriba en 3D permite separarla fácilmente con una hoja plana.',
    realLifeExample: 'Como sacar un huevo frito con una espátula plana: desde arriba parece imposible, pero en 3D sale limpio.',
    socraticIntro:
      '¡Misión 4 lista! El equipo azul está atrapado dentro de un anillo naranja. Cambia la forma a "Burbujas (Islas)" y pulsa "Ver en 3D": ¿cómo logra la hoja verde plana separarlos?',
    steps: [
      {
        id: 'm4-kernel-rbf',
        label: 'Cambia la forma de frontera de "Línea Recta" a "Burbujas (Islas)" o "Curva".',
        shortLabel: 'Activar forma curva',
      },
      {
        id: 'm4-open-3d',
        label: 'Pulsa "Ver en 3D", mueve la elevación y gira la montaña con tu mouse.',
        shortLabel: 'Explorar en 3D',
      },
      {
        id: 'm4-explain',
        label: 'Explica al Tutor cómo una lámina plana separa la isla azul del anillo naranja.',
        shortLabel: 'Explicar al tutor',
      },
    ],
  },
];

export function getMissionById(id: MissionId | null): GuidedMissionDef | null {
  if (!id) return null;
  return GUIDED_MISSIONS.find((m) => m.id === id) ?? null;
}

export function getNextMissionId(id: MissionId): MissionId | null {
  const idx = GUIDED_MISSIONS.findIndex((m) => m.id === id);
  if (idx < 0 || idx + 1 >= GUIDED_MISSIONS.length) return null;
  return GUIDED_MISSIONS[idx + 1].id;
}
