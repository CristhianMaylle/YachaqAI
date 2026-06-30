import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Lock, Circle, CircleDot, CheckCircle2, Clock, TrendingDown, Wand2, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { PLAN_COLORS, type Plan, type PlanModuleEstado } from '@/types'

const ESTADO_LABEL: Record<PlanModuleEstado, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completado: 'Completado',
  repaso_pendiente: 'Repaso pendiente',
  degradado: 'Necesita repaso',
  bloqueado: 'Bloqueado',
}

function EstadoIcon({ estado, color }: { estado: PlanModuleEstado; color: string }) {
  const props = { size: 20, color, strokeWidth: 2.5 }
  switch (estado) {
    case 'completado':
      return <CheckCircle2 {...props} />
    case 'en_progreso':
      return <CircleDot {...props} />
    case 'repaso_pendiente':
      return <Clock {...props} />
    case 'degradado':
      return <TrendingDown {...props} />
    case 'bloqueado':
      return <Lock {...props} />
    case 'pendiente':
    default:
      return <Circle {...props} />
  }
}

export function Modules() {
  const { deckId } = useParams<{ deckId: string }>()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [instruction, setInstruction] = useState('')
  const [customizing, setCustomizing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!deckId) return
    api.plan.get(deckId).then((data) => {
      setPlan(data)
      setLoading(false)
    })
  }, [deckId])

  async function handleCustomize() {
    if (!deckId || !instruction.trim()) return
    setCustomizing(true)
    setFeedback(null)
    try {
      const result = await api.plan.customize(deckId, instruction.trim())
      setPlan(result)
      setFeedback(
        result.customization_applied
          ? 'Plan reordenado segun tu instruccion.'
          : 'No se pudo aplicar ese orden sin romper prerrequisitos; se mantuvo el orden original.',
      )
    } catch {
      setFeedback('Error al personalizar el plan.')
    } finally {
      setCustomizing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex items-center justify-center min-h-[60vh] text-muted animate-pulse font-medium">
        Cargando plan de estudio...
      </div>
    )
  }

  const modules = plan?.modules ?? []

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-[85vh]">
      <div className="mb-8 border-b border-border pb-4">
        <h1 className="font-heading text-xl font-semibold text-foreground">Plan de Estudio</h1>
        <p className="text-xs text-muted mt-0.5">
          Ruta de modulos ordenada segun prerrequisitos. Completa cada modulo para desbloquear el siguiente.
        </p>
      </div>

      <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-card p-3">
        <Wand2 size={16} className="text-cyan flex-shrink-0" />
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomize()}
          placeholder='Personalizar con prompt, ej: "enfocarme en lo mas dificil primero"'
          className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted"
          disabled={customizing}
        />
        <button
          onClick={handleCustomize}
          disabled={customizing || !instruction.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-cyan px-3 py-1.5 text-[11px] font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {customizing && <Loader2 size={12} className="animate-spin" />}
          Aplicar
        </button>
      </div>
      {feedback && <p className="mb-6 text-xs text-muted">{feedback}</p>}

      {modules.length === 0 ? (
        <div className="mt-6 text-center p-12 border border-border rounded-2xl bg-card">
          <p className="text-xs text-muted italic">
            No hay modulos disponibles en este cuaderno. Agrega una fuente primero.
          </p>
        </div>
      ) : (
        <div className="mt-6 relative flex flex-col items-stretch">
          {modules.map((mod, idx) => {
            const color = PLAN_COLORS[mod.estado]
            const blocked = mod.estado === 'bloqueado'
            const isLast = idx === modules.length - 1
            return (
              <div key={mod.id} className="relative flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 bg-card"
                    style={{ borderColor: color }}
                  >
                    <EstadoIcon estado={mod.estado} color={color} />
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 min-h-[28px]" style={{ backgroundColor: `${color}55` }} />
                  )}
                </div>
                <Link
                  to={blocked ? '#' : `/deck/${deckId}/wiki/5. modulos/${mod.id}.md`}
                  onClick={(e) => {
                    if (blocked) e.preventDefault()
                  }}
                  className={`mb-6 flex-1 rounded-xl border border-border bg-card p-4 transition-shadow ${
                    blocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading text-sm font-semibold text-foreground">{mod.title}</h3>
                    <span
                      className="flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ color, backgroundColor: `${color}1A`, border: `1px solid ${color}33` }}
                    >
                      {ESTADO_LABEL[mod.estado]}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted">{mod.n_conceptos} conceptos</p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(mod.retencion_promedio * 100)}%`, backgroundColor: color }}
                    />
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
