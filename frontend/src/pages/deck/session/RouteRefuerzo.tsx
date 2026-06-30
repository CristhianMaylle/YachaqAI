import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowRight } from 'lucide-react'
import type { SrsGrade } from '@/types'

interface SessionResult {
  conceptSlug: string
  conceptTitle: string
  grade: SrsGrade
  nextReviewDate: string
  propagated: string[]
}

export function RouteRefuerzo() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const { state } = useLocation()
  const results: SessionResult[] = state?.results ?? []

  const deficientes = results.filter((r) => r.grade === 'dificil' || r.grade === 'olvidado')

  return (
    <div className="mx-auto max-w-xl p-6 space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold">Repaso detallado</h1>
        <p className="text-muted text-sm mt-1">
          Conceptos que necesitan refuerzo ({deficientes.length} de {results.length}).
        </p>
      </div>

      {deficientes.length === 0 ? (
        <p className="text-muted text-sm text-center py-8">No hay conceptos deficientes. ¡Buen trabajo!</p>
      ) : (
        <div className="space-y-3">
          {deficientes.map((r) => (
            <div
              key={r.conceptSlug}
              className="rounded-xl border border-srs-critico/30 bg-srs-critico/5 p-4 flex items-start gap-3"
            >
              <AlertCircle size={16} className="text-srs-critico flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">{r.conceptTitle}</p>
                <p className="text-xs text-muted mt-0.5">
                  {r.grade === 'olvidado' ? 'No recordado' : 'Dificultad alta'} · Repaso: {r.nextReviewDate}
                </p>
                {r.propagated.length > 0 && (
                  <p className="text-xs text-srs-practica mt-1">
                    {r.propagated.length} concepto{r.propagated.length > 1 ? 's' : ''} dependiente{r.propagated.length > 1 ? 's' : ''} marcado{r.propagated.length > 1 ? 's' : ''} en riesgo.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => navigate(`/deck/${deckId}/modules`)}
        className="w-full rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-background hover:opacity-90 transition flex items-center justify-center gap-2"
      >
        Continuar con el siguiente modulo <ArrowRight size={14} />
      </button>
    </div>
  )
}
