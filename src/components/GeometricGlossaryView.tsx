import React, { useState } from 'react';
import { ArrowRight, Lightbulb, Sparkles } from 'lucide-react';
import type { DatasetTier, NodeId } from '../types/svm';

interface GeometricGlossaryViewProps {
  onExploreInLab: (tier: DatasetTier) => void;
}

interface SimpleConceptCard {
  id: number;
  nodeRef: NodeId;
  kidTitle: string;
  scienceName: string;
  oneLine: string;
  realExample: string;
  accent: 'blue' | 'orange' | 'emerald' | 'violet';
}

const SIMPLE_CONCEPTS: SimpleConceptCard[] = [
  {
    id: 1,
    nodeRef: 'N1_SV',
    kidTitle: '¿Qué es un modelo SVM?',
    scienceName: 'Support Vector Machine',
    oneLine:
      'Es una inteligencia artificial que aprende a separar dos grupos trazando la frontera más segura posible entre ellos.',
    realExample: 'Separar correos buenos de correo basura (spam), o distinguir fotos de perros y gatos.',
    accent: 'blue',
  },
  {
    id: 2,
    nodeRef: 'N1_SV',
    kidTitle: 'Puntos Clave (Anillo Violeta)',
    scienceName: 'Vectores de Soporte',
    oneLine:
      'Son los poquitos puntos que están en el borde frente al otro equipo. Solo ellos sostienen la línea verde.',
    realExample: 'Si mueves un punto lejano del fondo, nada cambia; si mueves un punto clave, la línea se gira.',
    accent: 'violet',
  },
  {
    id: 3,
    nodeRef: 'N2_MARGIN',
    kidTitle: 'La Calle Central',
    scienceName: 'Hiperplano de Decisión',
    oneLine:
      'Es la línea verde que divide el mapa en dos lados: todo lo que caiga de un lado se clasifica como Azul y del otro como Naranja.',
    realExample: 'Como la cerca entre dos barrios o la línea de mitad de cancha.',
    accent: 'emerald',
  },
  {
    id: 4,
    nodeRef: 'N2_MARGIN',
    kidTitle: 'El Pasillo de Seguridad',
    scienceName: 'Margen Óptimo',
    oneLine:
      'Es la franja verde vacía alrededor de la línea central. SVM siempre busca hacer este pasillo lo más ancho posible.',
    realExample: 'Un puente ancho te protege si das un paso chueco; un pasillo ancho evita errores con datos nuevos.',
    accent: 'emerald',
  },
  {
    id: 5,
    nodeRef: 'N3_CPARAM',
    kidTitle: 'Puntos Rebeldes (Infiltrados)',
    scienceName: 'Datos Atípicos / Ruido',
    oneLine:
      'Son puntos que quedaron metidos en el territorio contrario por un error o porque son casos muy raros.',
    realExample: 'Un correo de un amigo que dice "¡GRATIS!" y parece spam aunque no lo sea.',
    accent: 'orange',
  },
  {
    id: 6,
    nodeRef: 'N3_CPARAM',
    kidTitle: 'Control de Rigidez (C)',
    scienceName: 'Parámetro C (Margen Blando)',
    oneLine:
      'Decide si el modelo tolera algún infiltrado para mantener una calle ancha (C bajo) o si se aprieta todo por no fallar ninguno (C alto).',
    realExample: 'Si C es demasiado alto, el modelo memoriza los errores y falla cuando llegan datos nuevos.',
    accent: 'orange',
  },
  {
    id: 7,
    nodeRef: 'N4_KERNEL',
    kidTitle: 'El Truco 3D (Montaña)',
    scienceName: 'Truco del Kernel (RBF / Polinomial)',
    oneLine:
      'Cuando una línea recta en 2D no puede separar una isla rodeada, SVM levanta los puntos a 3D para cortarlos con una hoja plana.',
    realExample: 'Como meter una espátula plana por debajo de un centro elevado para separarlo del borde.',
    accent: 'violet',
  },
  {
    id: 8,
    nodeRef: 'N2_MARGIN',
    kidTitle: 'Acertar con Datos Nuevos',
    scienceName: 'Generalización',
    oneLine:
      'El verdadero objetivo de SVM no es memorizar los puntos viejos, sino clasificar bien puntos nuevos que nunca había visto.',
    realExample: 'Como estudiar para entender un tema y poder resolver preguntas nuevas en un examen.',
    accent: 'blue',
  },
];

const FILTERS: Array<{ id: 'ALL' | NodeId; label: string }> = [
  { id: 'ALL', label: 'Todo (8)' },
  { id: 'N1_SV', label: 'Puntos Clave' },
  { id: 'N2_MARGIN', label: 'Calle Segura' },
  { id: 'N3_CPARAM', label: 'Regla C' },
  { id: 'N4_KERNEL', label: 'Truco 3D' },
];

export const GeometricGlossaryView: React.FC<GeometricGlossaryViewProps> = ({
  onExploreInLab,
}) => {
  const [filter, setFilter] = useState<'ALL' | NodeId>('ALL');

  const items =
    filter === 'ALL'
      ? SIMPLE_CONCEPTS
      : SIMPLE_CONCEPTS.filter((item) => item.nodeRef === filter);

  const nodeToTier = (node: NodeId): DatasetTier => {
    if (node === 'N3_CPARAM') return 'TIER_2_SOFT_MARGIN';
    if (node === 'N4_KERNEL') return 'TIER_3_KERNEL_NONLINEAR';
    return 'TIER_1_LINEAR';
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-[#004ac6] font-semibold">
            Explicado en fácil · Sin fórmulas difíciles
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#131b2e] mt-0.5">
            Mini-Guía Visual de SVM
          </h1>
          <p className="text-sm text-[#434655] mt-1">
            Las 8 ideas clave que necesitas para entender cómo decide una inteligencia artificial SVM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#f2f3ff] rounded-xl border border-[#dae2fd]">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filter === f.id
                  ? 'bg-white text-[#004ac6] shadow-xs'
                  : 'text-[#434655] hover:text-[#131b2e]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick 10-second visual summary */}
      <div className="p-4 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-[#006243] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-[#002114] leading-snug">
          <strong>En 10 segundos:</strong> Imagina separar dos grupos de puntos en un mapa. Un modelo{' '}
          <strong>SVM</strong> busca la <strong>calle más ancha posible</strong> entre ambos, guiándose
          solo por los <strong>puntos del borde</strong> (anillo violeta). Si una recta no alcanza, los
          eleva en <strong>3D</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const badgeStyle =
            item.accent === 'blue'
              ? 'text-[#004ac6] bg-[#dbe1ff]/70'
              : item.accent === 'orange'
                ? 'text-[#a73a00] bg-[#ffdbce]/70'
                : item.accent === 'violet'
                  ? 'text-[#6d28d9] bg-[#f5f3ff]'
                  : 'text-[#006243] bg-[#d1fae5]/70';

          return (
            <article
              key={item.id}
              className="bg-white rounded-2xl border border-[#dae2fd] p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h2 className="font-display text-base font-bold text-[#131b2e]">
                    {item.kidTitle}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-md font-mono text-[10.5px] font-semibold ${badgeStyle}`}>
                    En IA: {item.scienceName}
                  </span>
                </div>

                <p className="text-[13.5px] text-[#334155] leading-snug">{item.oneLine}</p>

                <div className="p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e7ff] text-xs text-[#434655] flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-[#006243] shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="leading-snug">{item.realExample}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onExploreInLab(nodeToTier(item.nodeRef))}
                  className="text-xs font-display font-semibold text-[#004ac6] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Verlo en el simulador</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
