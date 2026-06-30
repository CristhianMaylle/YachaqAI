import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RotateCcw, AlertCircle, Loader2 } from 'lucide-react'
import { fetchDueReviews } from '@/lib/session-api'

interface DueConcept {
  concept_slug: string
  estado: string
  proximo_repaso: string
  current_retrievability: number
  veces_olvidado: number
}

export function SrsDue() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<{
    due_count: number
    rehabilitation_session: boolean
    concepts: DueConcept[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!deckId) return
    fetchDueReviews(deckId)
      .then((d) => setData(d as any))
      .finally(() => setLoading(false))
  }, [deckId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted text-sm gap-2 animate-pulse">
        <Loader2 size={16} className="animate-spin" /> Revisando repasos pendientes...
      </div>
    )
  }

  if (!data || data.due_count === 0) {
    return (
      <div className="mx-auto max-w-md p-10 text-center space-y-3">
        <RotateCcw size={36} className="text-srs-dominado mx-auto" />
        <h1 className="font-heading text-xl font-bold">Todo al dia</h1>
        <p className="text-muted text-sm">No tienes repasos pendientes. Vuelve manana.</p>
        <button onClick={() => navigate(`/deck/${deckId}/modules`)} className="rounded-lg bg-cyan px-5 py-2 text-sm font-semibold text-background hover:opacity-90 transition">
          Ver plan de estudio
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <RotateCcw size={20} className="text-cyan" />
          <h1 className="font-heading text-xl font-bold">Repaso SRS</h1>
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-cyan/10 text-cyan border border-cyan/20">
            {data.due_count} pendientes
          </span>
        </div>
        {data.rehabilitation_session && (
          <div className="mt-3 rounded-xl border border-srs-practica/40 bg-srs-practica/10 p-3 flex items-center gap-2 text-sm text-srs-practica">
            <AlertCircle size={14} className="flex-shrink-0" />
            Sesion de rehabilitacion: llevas mas de 30 dias sin repasar algunos conceptos.
          </div>
        )}
      </div>

      <div className="space-y-2">
        {data.concepts.map((c) => (
          <div key={c.concept_slug} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{c.concept_slug.replace(/-/g, ' ')}</p>
              <p className="text-xs text-muted mt-0.5">
                Retentiva actual: {Math.round(c.current_retrievability * 100)}% · Vencido: {c.proximo_repaso}
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
              c.estado === 'critico' ? 'bg-srs-critico/10 text-srs-critico border-srs-critico/30' : 'bg-srs-practica/10 text-srs-practica border-srs-practica/30'
            }`}>
              {c.estado}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted text-center">
        El cuestionario de repaso usa los mismos tipos de pregunta que las sesiones de estudio.
        Proxima version: repaso directo desde aqui.
      </p>
    </div>
  )
}
