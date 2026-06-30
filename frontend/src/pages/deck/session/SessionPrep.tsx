import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BookOpen, Clock, AlertCircle, ChevronRight, RotateCcw, Layers } from 'lucide-react'
import { startSession, type SessionStart } from '@/lib/session-api'

export function SessionPrep() {
  const { deckId, moduleSlug } = useParams<{ deckId: string; moduleSlug: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionStart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!deckId || !moduleSlug) return
    setLoading(true)
    startSession(deckId, moduleSlug)
      .then(setSession)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [deckId, moduleSlug])

  async function handleStart(type: 'nuevo' | 'repaso') {
    if (!deckId || !moduleSlug) return
    setStarting(true)
    try {
      const s = type === 'repaso' && session?.pending_reviews.length
        ? await startSession(deckId, moduleSlug, 'repaso')
        : session!
      navigate(`/deck/${deckId}/session/${moduleSlug}/questions/${s.session_id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-10 animate-pulse text-muted text-sm font-medium flex items-center justify-center min-h-[60vh]">
        Preparando sesion de estudio...
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="p-10 text-srs-critico text-sm flex items-center gap-2 justify-center">
        <AlertCircle size={16} /> {error ?? 'Error al iniciar la sesion'}
      </div>
    )
  }

  const hasPending = session.pending_reviews.length > 0

  return (
    <div className="mx-auto max-w-xl p-8">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Layers size={22} className="text-cyan" />
          <h1 className="font-heading text-2xl font-bold">Sesion de Estudio</h1>
        </div>
        <p className="text-muted text-sm">
          {session.module_slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </p>
      </div>

      {hasPending && (
        <div className="mb-6 rounded-xl border border-srs-practica/40 bg-srs-practica/10 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-srs-practica flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">
              Tienes {session.pending_reviews.length} concepto{session.pending_reviews.length > 1 ? 's' : ''} para repasar
            </p>
            <p className="text-muted mt-0.5">Es recomendable repasar antes de estudiar nuevo material.</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 mb-6 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <BookOpen size={20} className="text-cyan mx-auto mb-1" />
            <p className="text-2xl font-bold">{session.n_concepts}</p>
            <p className="text-xs text-muted">conceptos</p>
          </div>
          <div>
            <ChevronRight size={20} className="text-cyan mx-auto mb-1" />
            <p className="text-2xl font-bold">{session.n_questions}</p>
            <p className="text-xs text-muted">preguntas</p>
          </div>
          <div>
            <Clock size={20} className="text-cyan mx-auto mb-1" />
            <p className="text-2xl font-bold">{session.estimated_minutes}</p>
            <p className="text-xs text-muted">minutos est.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {hasPending && (
          <button
            onClick={() => handleStart('repaso')}
            disabled={starting}
            className="w-full rounded-xl border border-srs-practica bg-srs-practica/10 px-5 py-3 text-sm font-semibold text-foreground hover:bg-srs-practica/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RotateCcw size={16} />
            Hacer repaso primero ({session.pending_reviews.length})
          </button>
        )}
        <button
          onClick={() => handleStart('nuevo')}
          disabled={starting}
          className="w-full rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-background hover:opacity-90 transition disabled:opacity-50"
        >
          {starting ? 'Iniciando...' : hasPending ? 'Saltar repaso y comenzar' : 'Comenzar sesion'}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="w-full rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted hover:bg-card transition"
        >
          Recordarme mas tarde
        </button>
      </div>
    </div>
  )
}
