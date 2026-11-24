import React, { useEffect, useState } from 'react';
import {
  X,
  FileText,
  Activity,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Search,
  Database,
  Bell,
  Clock,
  BookOpen,
} from 'lucide-react';
import type {
  DialogueTurn,
  QuizAttemptResult,
  SessionProfileVector,
  SvmModelState,
  TeacherAlertPayload,
  TelemetryEvent,
} from '../types/svm';
import { DAPI_DOCUMENTS } from '../data/dapiDocuments';
import { MarkdownViewer } from './MarkdownViewer';

interface TeacherPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SessionProfileVector;
  displaySessionId: string;
  model: SvmModelState;
  telemetryBuffer: TelemetryEvent[];
  dialogueBuffer: DialogueTurn[];
  teacherAlerts: TeacherAlertPayload[];
  silenceSeconds: number;
  completedMissionsCount: number;
  quizResult: QuizAttemptResult | null;
}

type ModalTab = 'docs' | 'observability';

export const TeacherPanelModal: React.FC<TeacherPanelModalProps> = ({
  isOpen,
  onClose,
  profile,
  displaySessionId,
  model,
  telemetryBuffer,
  dialogueBuffer,
  teacherAlerts,
  silenceSeconds,
  completedMissionsCount,
  quizResult,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('docs');
  const [selectedDocId, setSelectedDocId] = useState<string>(DAPI_DOCUMENTS[0].id);
  const [docCache, setDocCache] = useState<Record<string, string>>({});
  const [loadingDoc, setLoadingDoc] = useState<boolean>(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  const selectedDoc =
    DAPI_DOCUMENTS.find((d) => d.id === selectedDocId) ?? DAPI_DOCUMENTS[0];

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Fetch the real complete Markdown file for the selected DAPI document (01 to 09)
  useEffect(() => {
    if (!isOpen || activeTab !== 'docs') return;
    if (docCache[selectedDoc.id]) {
      setDocError(null);
      return;
    }

    let cancelled = false;
    setLoadingDoc(true);
    setDocError(null);

    fetch(selectedDoc.filePath)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          setDocCache((prev) => ({ ...prev, [selectedDoc.id]: text }));
          setLoadingDoc(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDocError('No se pudo cargar el archivo documental completo.');
          setLoadingDoc(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeTab, selectedDoc, docCache]);

  if (!isOpen) return null;

  const nodeList = Object.values(profile.nodes);
  const misconceptionList = Object.values(profile.misconceptions);
  const remainingMinutes = Math.max(
    1,
    Math.round((profile.expiresAtMs - Date.now()) / 60000)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-panel-title"
      className="fixed inset-0 z-50 bg-[#131b2e]/70 flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl border border-[#dae2fd] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#f2f3ff] border-b border-[#dae2fd] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#004ac6] text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="teacher-panel-title"
                className="font-display text-lg sm:text-xl font-bold text-[#131b2e] leading-tight"
              >
                Traza Pedagógica y Panel Docente — Marco DAPI (01 al 09)
              </h2>
              <p className="text-xs text-[#434655] flex flex-wrap items-center gap-x-2">
                <span>Ingeniería Curricular MOCAVI · Grado 9no</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[#006243] font-medium">
                  Sesión Anónima {displaySessionId} ({profile.stationLabel}) · Cero PII
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Segmented Mode Switch inside Panel */}
            <div
              role="tablist"
              aria-label="Secciones del Panel Docente"
              className="flex items-center gap-1 p-1 bg-[#e2e7ff] rounded-xl"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'docs'}
                onClick={() => setActiveTab('docs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'docs'
                    ? 'bg-white text-[#004ac6] shadow-xs'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Visor Documental (01–09)</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'observability'}
                onClick={() => setActiveTab('observability')}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'observability'
                    ? 'bg-white text-[#004ac6] shadow-xs'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Observabilidad y Alertas ({teacherAlerts.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel docente"
              className="p-2 rounded-xl bg-white border border-[#dae2fd] text-[#131b2e] hover:bg-[#e2e7ff] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* TAB 1: COMPLETE 9-DOCUMENT VIEWER (DAPI 01 TO 09) */}
        {activeTab === 'docs' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Document Selector Rail */}
            <nav
              aria-label="Selector de los 9 documentos DAPI"
              className="w-full md:w-72 lg:w-80 bg-[#faf8ff] border-b md:border-b-0 md:border-r border-[#dae2fd] p-3 overflow-y-auto shrink-0 flex flex-row md:flex-col gap-1.5"
            >
              {DAPI_DOCUMENTS.map((doc) => {
                const active = doc.id === selectedDoc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setSearchQuery('');
                    }}
                    aria-current={active ? 'page' : undefined}
                    className={`text-left p-2.5 rounded-xl border transition-all shrink-0 md:shrink w-56 md:w-full cursor-pointer ${
                      active
                        ? 'bg-white border-[#004ac6] shadow-xs'
                        : 'bg-transparent border-transparent hover:bg-[#f2f3ff]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className={`font-mono text-[11px] font-bold ${
                          active ? 'text-[#004ac6]' : 'text-[#434655]'
                        }`}
                      >
                        {doc.code}
                      </span>
                      <span className="text-[10.5px] font-medium text-[#006243]">
                        {doc.statusLabel}
                      </span>
                    </div>
                    <div className="font-display text-[13.5px] font-semibold text-[#131b2e] leading-snug">
                      {doc.number}. {doc.shortTitle}
                    </div>
                    <div className="text-[11px] text-[#434655] line-clamp-1 mt-0.5">
                      {doc.category}
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Right Structured Document Reading Pane */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Document Meta Strip & Search */}
              <div className="px-5 py-3.5 border-b border-[#eaedff] bg-[#faf8ff]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[#434655]">
                    <span className="font-mono font-bold text-[#004ac6]">{selectedDoc.code}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedDoc.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#006243] font-medium">{selectedDoc.statusLabel}</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#131b2e] mt-0.5">
                    {selectedDoc.fullTitle}
                  </h3>
                </div>

                <div className="relative w-full sm:w-64 shrink-0">
                  <Search
                    className="w-4 h-4 text-[#737686] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <label htmlFor="doc-search-input" className="sr-only">
                    Buscar dentro del documento actual
                  </label>
                  <input
                    id="doc-search-input"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar en este documento..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-[#dae2fd] text-xs text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
                  />
                </div>
              </div>

              {/* Document Full Structured Markdown Body */}
              <div
                data-testid="dapi-doc-viewer"
                className="flex-1 overflow-y-auto px-6 py-5"
              >
                {/* Compact Executive Summary Box */}
                <div className="mb-5 p-4 rounded-xl bg-[#f2f3ff] border border-[#dae2fd]">
                  <p className="text-[13px] text-[#131b2e] leading-relaxed">
                    {selectedDoc.summary}
                  </p>
                  <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-[#003ea8]">
                    {selectedDoc.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" aria-hidden="true" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {loadingDoc && (
                  <div className="py-12 text-center text-sm text-[#434655]">
                    Cargando documento estructurado {selectedDoc.code}...
                  </div>
                )}

                {docError && (
                  <div className="p-4 rounded-xl bg-[#ffdad6] text-[#93000a] text-sm">
                    {docError}
                  </div>
                )}

                {!loadingDoc && !docError && docCache[selectedDoc.id] && (
                  <MarkdownViewer
                    content={docCache[selectedDoc.id]}
                    searchQuery={searchQuery}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE OBSERVABILITY, ANONYMOUS SESSION STATE & TEACHER ALERTS */}
        {activeTab === 'observability' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-[#faf8ff]">
            {/* Anonymous Privacy & Session Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-white p-4 rounded-xl border border-[#dae2fd]">
                <div className="flex items-center gap-1.5 text-xs text-[#006243] font-semibold">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span>Estado de Privacidad</span>
                </div>
                <div className="font-mono text-sm font-bold text-[#131b2e] mt-1.5">
                  Cero PII · {displaySessionId}
                </div>
                <div className="text-[11.5px] text-[#434655] mt-0.5">
                  Token: <span className="font-mono">{profile.sessionToken}</span> · TTL {remainingMinutes} min
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#dae2fd]">
                <div className="flex items-center gap-1.5 text-xs text-[#004ac6] font-semibold">
                  <Activity className="w-4 h-4" aria-hidden="true" />
                  <span>Estado Cognitivo (DAPI-04)</span>
                </div>
                <div className="font-display text-sm font-bold text-[#131b2e] mt-1.5">
                  {profile.scaffoldingPhase}
                </div>
                <div className="text-[11.5px] text-[#434655] mt-0.5 font-mono">
                  {profile.cognitiveState} · Nivel Pista N{profile.currentHintTier}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#dae2fd]">
                <div className="flex items-center gap-1.5 text-xs text-[#434655] font-semibold">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  <span>Misiones y Evaluación</span>
                </div>
                <div
                  data-testid="teacher-quiz-metric"
                  className="font-mono tabular-nums text-sm font-bold text-[#131b2e] mt-1.5"
                >
                  Misiones: {completedMissionsCount}/4 · Quiz:{' '}
                  {quizResult ? `${quizResult.correctCount}/${quizResult.totalQuestions} (${quizResult.scorePercent}%)` : 'Pendiente'}
                </div>
                <div className="text-[11.5px] text-[#434655] mt-0.5 font-mono tabular-nums">
                  Silencio: {silenceSeconds > 0 ? `${silenceSeconds}s` : 'Listo'} · SVM:{' '}
                  {model.computeLatencyMs.toFixed(1)} ms
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#dae2fd]">
                <div className="flex items-center gap-1.5 text-xs text-[#a73a00] font-semibold">
                  <Bell className="w-4 h-4" aria-hidden="true" />
                  <span>Alertas de Bloqueo</span>
                </div>
                <div
                  data-testid="teacher-alerts-count"
                  className="font-mono tabular-nums text-xl font-bold text-[#131b2e] mt-1"
                >
                  {teacherAlerts.length}
                </div>
                <div className="text-[11.5px] text-[#434655]">
                  Puesto: {profile.stationLabel} · Escalado tras N1–N3
                </div>
              </div>
            </div>

            {/* Silent Teacher Alerts Queue */}
            <section className="bg-white rounded-xl border border-[#dae2fd] p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-display text-base font-bold text-[#131b2e] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#b45309]" aria-hidden="true" />
                  <span>Alertas Silenciosas de Bloqueo Crítico (teacher_alert_event)</span>
                </h3>
                <span className="text-xs text-[#434655]">
                  Disparo determinista al agotar N1 → N2 → N3
                </span>
              </div>

              {teacherAlerts.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#f2f3ff] text-xs text-[#434655] leading-relaxed">
                  Sin bloqueos críticos activos en esta sesión. Las alertas silenciosas se
                  generan automáticamente si un estudiante acumula 3 errores consecutivos en el
                  mismo nodo tras la demostración visual N3 o manifiesta frustración reiterada
                  (DAPI-04 y DAPI-05).
                </div>
              ) : (
                <div className="space-y-3" data-testid="teacher-alerts-list">
                  {teacherAlerts.map((alert) => (
                    <div
                      key={alert.alertId}
                      className="p-3.5 rounded-xl bg-[#fff7ed] border border-[#fed7aa] flex flex-col gap-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#93000a]">
                            {alert.alertCode}
                          </span>
                          <span className="text-xs text-[#434655]">·</span>
                          <span className="font-mono text-xs font-semibold text-[#131b2e]">
                            {alert.stationLabel} ({alert.sessionToken})
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#7f2b00]">
                          Nodo: {alert.stalledNode} · {alert.exhaustedMisconception}
                        </span>
                      </div>
                      <p className="text-xs text-[#131b2e] font-medium">
                        {alert.diagnosticSummary}
                      </p>
                      <p className="text-xs text-[#434655]">
                        <strong>Acción recomendada:</strong> {alert.recommendedTeacherAction}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 4-Node Convergent Evidence Matrix & Misconception Tracker */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 4 Nodes */}
              <section className="bg-white rounded-xl border border-[#dae2fd] p-4">
                <h3 className="font-display text-sm font-bold text-[#131b2e] mb-3">
                  Matriz de Evidencia Convergente (Lienzo + Diálogo)
                </h3>
                <div className="space-y-2.5">
                  {nodeList.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl bg-[#faf8ff] border border-[#e2e7ff] flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-display text-xs font-bold text-[#131b2e]">
                          {n.label}
                        </div>
                        <div className="text-[11px] text-[#434655] mt-0.5 flex items-center gap-2">
                          <span>Lienzo: {n.canvasVerified ? '✓ Verificado' : 'Pendiente'}</span>
                          <span>·</span>
                          <span>Verbal: {n.verbalVerified ? '✓ Verificado' : 'Pendiente'}</span>
                          <span>·</span>
                          <span>Errores: {n.consecutiveErrors}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[11px] font-semibold text-[#004ac6]">
                          {n.status}
                        </div>
                        <div className="font-mono text-[10.5px] text-[#434655]">
                          Nivel: {n.masteryLevel}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4 Misconceptions */}
              <section className="bg-white rounded-xl border border-[#dae2fd] p-4">
                <h3 className="font-display text-sm font-bold text-[#131b2e] mb-3">
                  Diagnóstico de Concepciones Erróneas (DAPI 01–04)
                </h3>
                <div className="space-y-2.5">
                  {misconceptionList.map((m) => (
                    <div
                      key={m.code}
                      className="p-3 rounded-xl bg-[#faf8ff] border border-[#e2e7ff] flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-display text-xs font-bold text-[#131b2e]">
                          {m.name}{' '}
                          <span className="font-mono font-normal text-[#434655]">({m.code})</span>
                        </div>
                        <div className="text-[11px] text-[#434655] mt-0.5">
                          Ocurrencias: <span className="font-mono tabular-nums">{m.occurrences}</span> ·
                          Nivel de pista alcanzado: <span className="font-mono">N{m.hintLevelReached}</span>
                        </div>
                      </div>
                      <span
                        className={`font-mono text-[11px] font-semibold ${
                          m.resolved
                            ? 'text-[#006243]'
                            : m.occurrences > 0
                              ? 'text-[#a73a00]'
                              : 'text-[#737686]'
                        }`}
                      >
                        {m.resolved
                          ? 'Superada'
                          : m.occurrences > 0
                            ? 'En mediación'
                            : 'Sin incidencias'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Dual Memory FIFO Inspector (DAPI-05) */}
            <section className="bg-white rounded-xl border border-[#dae2fd] p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-display text-sm font-bold text-[#131b2e] flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#004ac6]" aria-hidden="true" />
                  <span>
                    Memoria Dual Volátil: {telemetryBuffer.length}/10 Eventos Telemétricos ·{' '}
                    {dialogueBuffer.length}/5 Turnos FIFO
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowRawJson((v) => !v)}
                  className="text-xs font-display font-semibold text-[#004ac6] hover:underline cursor-pointer"
                >
                  {showRawJson ? 'Ocultar JSON del perfil' : 'Ver Vector JSON de sesión'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center mb-3">
                <div className="p-2.5 rounded-lg bg-[#f2f3ff]">
                  <div className="text-[11px] text-[#434655]">Arrastres Interiores</div>
                  <div className="font-mono tabular-nums text-base font-bold text-[#131b2e]">
                    {profile.metrics.interiorDrags}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#f5f3ff]">
                  <div className="text-[11px] text-[#6d28d9]">Arrastres Pilares SV</div>
                  <div className="font-mono tabular-nums text-base font-bold text-[#6d28d9]">
                    {profile.metrics.svDrags}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#ecfdf5]">
                  <div className="text-[11px] text-[#006243]">Ajustes Parámetro C</div>
                  <div className="font-mono tabular-nums text-base font-bold text-[#006243]">
                    {profile.metrics.cSliderChanges}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#fff7ed]">
                  <div className="text-[11px] text-[#a73a00]">Demos Visuales N3</div>
                  <div className="font-mono tabular-nums text-base font-bold text-[#a73a00]">
                    {profile.metrics.visualDemosTriggered.length}
                  </div>
                </div>
              </div>

              {showRawJson && (
                <pre className="p-3.5 rounded-xl bg-[#131b2e] text-[#eef0ff] font-mono text-[11px] overflow-x-auto max-h-64">
                  {JSON.stringify(
                    {
                      session_profile: profile,
                      recent_telemetry_fifo: telemetryBuffer,
                    },
                    null,
                    2
                  )}
                </pre>
              )}
            </section>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#f2f3ff] border-t border-[#dae2fd] flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-[#434655]">
            Marco Curricular MOCAVI · 9/9 documentos DAPI integrados en vivo · Sin retención de datos personales
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#004ac6] hover:bg-[#003ea8] text-white font-display text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar y Volver al Laboratorio
          </button>
        </div>
      </div>
    </div>
  );
};
