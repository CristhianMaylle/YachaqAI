import { useNavigate, useParams } from 'react-router-dom'
import { BookOpen, GraduationCap, ArrowRight } from 'lucide-react'

const STATIC_RESOURCES = [
  {
    type: 'Articulo',
    title: 'Khan Academy — Material de repaso',
    description: 'Lecturas y ejercicios adicionales para reforzar los conceptos del modulo.',
    icon: BookOpen,
  },
  {
    type: 'Paper',
    title: 'PubMed — Articulos academicos',
    description: 'Explora investigaciones recientes relacionadas con los temas estudiados.',
    icon: GraduationCap,
  },
]

export function RouteRecursos() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-xl p-6 space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-xl font-bold">Recursos adicionales</h1>
        <p className="text-muted text-sm mt-1">Material de estudio complementario para este modulo.</p>
      </div>

      <div className="space-y-3">
        {STATIC_RESOURCES.map((r) => (
          <div key={r.title} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
            <r.icon size={18} className="text-cyan flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{r.type}</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">{r.title}</p>
              <p className="text-xs text-muted mt-1">{r.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate(`/deck/${deckId}/modules`)}
        className="w-full rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-background hover:opacity-90 transition flex items-center justify-center gap-2"
      >
        Continuar con el siguiente modulo <ArrowRight size={14} />
      </button>
    </div>
  )
}
