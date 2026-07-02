import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { runLintAnalysis, fetchLatestLint, type LintReport, type LintIssueType } from '@/lib/lint-api'

const TYPE_LABELS: Record<LintIssueType, string> = {
  orphan: 'Nodo huerfano',
  contradiction: 'Contradiccion',
  missing_page: 'Sin pagina propia',
  broken_ref: 'Referencia rota',
  missing_quiz: 'Sin cuestionario',
}

const TYPE_BADGE: Record<LintIssueType, string> = {
  orphan: 'bg-srs-en-practica/10 text-srs-en-practica border-srs-en-practica/20',
  contradiction: 'bg-srs-critico/10 text-srs-critico border-srs-critico/20',
  missing_page: 'bg-cyan/10 text-cyan border-cyan/20',
  broken_ref: 'bg-srs-critico/10 text-srs-critico border-srs-critico/20',
  missing_quiz: 'bg-srs-en-practica/10 text-srs-en-practica border-srs-en-practica/20',
}

export function Health() {
  const { deckId } = useParams()

  const [report, setReport] = useState<LintReport | null>(null)
  const [running, setRunning] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!deckId) return
    fetchLatestLint(deckId)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingInitial(false))
  }, [deckId])

  const handleRunLint = useCallback(() => {
    if (!deckId) return
    setRunning(true)
    setError(null)
    runLintAnalysis(deckId)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setRunning(false))
  }, [deckId])

  const score = report?.score ?? null
  const hasReport = report !== null && report.status !== 'unknown'

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="mb-8 border-b border-border pb-4">
        <h1 className="font-heading text-xl font-semibold text-foreground flex items-center gap-2">
          <span>Salud del Mazo</span>
          <span className="text-xs font-normal text-muted bg-card px-2 py-0.5 rounded-md">
            Verificador de Integridad (LINT)
          </span>
        </h1>
        <p className="text-xs text-muted mt-0.5">
          Analiza wikilinks rotos, notas huerfanas, contradicciones semanticas y cuestionarios
          faltantes en tu base de conocimiento.
          {report?.created_at && (
            <span className="ml-1">
              Ultimo analisis: {new Date(report.created_at).toLocaleString()}
            </span>
          )}
        </p>
      </div>

      {loadingInitial ? (
        <div className="flex-1 flex items-center justify-center text-muted text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> Cargando ultimo reporte...
        </div>
      ) : (
        <>
          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Health Score */}
            <div className="md:col-span-1 rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col items-center justify-center text-center">
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">
                Puntaje de Salud
              </h3>
              <div className="relative flex items-center justify-center mb-2">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="var(--color-border, #334155)" strokeWidth="8" fill="transparent" />
                  {score !== null && (
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke={
                        report?.status === 'healthy'
                          ? 'var(--color-srs-dominado, #22c55e)'
                          : report?.status === 'warning'
                            ? 'var(--color-srs-practica, #FFC107)'
                            : 'var(--color-srs-critico, #F44336)'
                      }
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - score / 100)}
                      className="transition-all duration-1000 ease-out"
                    />
                  )}
                </svg>
                <span className="absolute text-xl font-bold text-foreground">
                  {score !== null ? `${score}%` : '—'}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-muted">
                {!hasReport
                  ? 'Aun no se ha ejecutado un analisis'
                  : score === 100
                    ? 'Integridad del Wiki: Optima'
                    : 'Se requieren correcciones'}
              </span>
            </div>

            {/* Lint Info */}
            <div className="md:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Agente de Integridad LINT
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  El motor LINT escanea todos los archivos .md del mazo: detecta conceptos sin
                  enlaces entrantes, wikilinks que no resuelven a ninguna pagina, modulos sin
                  cuestionario generado, y usa el LLM activo para detectar posibles
                  contradicciones entre conceptos.
                </p>
              </div>
              {error && (
                <p className="mt-3 text-xs text-srs-critico flex items-center gap-1.5">
                  <AlertCircle size={12} /> {error}
                </p>
              )}
              <button
                onClick={handleRunLint}
                disabled={running}
                className="mt-6 w-full py-2.5 bg-cyan hover:opacity-90 text-background rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {running && <Loader2 size={13} className="animate-spin" />}
                {running ? 'Analizando wiki...' : 'Ejecutar analisis ahora'}
              </button>
            </div>
          </div>

          {/* Issues list */}
          {hasReport && (
            <div className="flex-1 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest">
                Incidencias Detectadas ({report!.issues.length})
              </h3>

              {report!.issues.length === 0 ? (
                <div className="rounded-xl border border-srs-dominado/20 bg-srs-dominado/5 p-6 text-center text-sm text-srs-dominado font-semibold">
                  No se detectaron problemas en tu wiki. ✓
                </div>
              ) : (
                report!.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border p-4 bg-card shadow-sm flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold border rounded px-1.5 py-0.5 uppercase tracking-wide ${TYPE_BADGE[issue.type]}`}
                      >
                        {TYPE_LABELS[issue.type]}
                      </span>
                      {issue.file && (
                        <span className="text-[10px] text-muted font-mono truncate">{issue.file}</span>
                      )}
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{issue.title}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {!hasReport && !running && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-2xl text-center">
              <p className="text-sm text-muted">
                Ejecuta el primer analisis para ver el estado de salud de tu wiki.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
