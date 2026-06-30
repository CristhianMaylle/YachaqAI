import { useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { CheckCircle2, TrendingDown, Brain, RotateCcw, Network } from 'lucide-react'
import type { SrsGrade } from '@/types'

interface SessionResult {
  conceptSlug: string
  conceptTitle: string
  grade: SrsGrade
  nextReviewDate: string
  propagated: string[]
}

const GRADE_COLORS: Record<SrsGrade, string> = {
  excelente: '#4CAF50',
  bien: '#00C6FB',
  dificil: '#FFC107',
  olvidado: '#F44336',
}

const GRADE_LABELS: Record<SrsGrade, string> = {
  excelente: 'Excelente',
  bien: 'Bien',
  dificil: 'Difícil',
  olvidado: 'Olvidado',
}

export function SessionSummary() {
  const { deckId, moduleSlug, sessionId } = useParams<{
    deckId: string
    moduleSlug: string
    sessionId: string
  }>()
  const navigate = useNavigate()
  const { state } = useLocation()
  const results: SessionResult[] = state?.results ?? []
  const totalQuestions: number = state?.totalQuestions ?? results.length
  const confettiRef = useRef(false)

  const gradeCounts = results.reduce(
    (acc, r) => {
      acc[r.grade] = (acc[r.grade] ?? 0) + 1
      return acc
    },
    {} as Record<SrsGrade, number>,
  )

  const masteredCount = (gradeCounts.excelente ?? 0) + (gradeCounts.bien ?? 0)
  const masteryPct = totalQuestions > 0 ? Math.round((masteredCount / totalQuestions) * 100) : 0
  const isGood = masteryPct >= 70

  const chartData = (['excelente', 'bien', 'dificil', 'olvidado'] as SrsGrade[]).map((g) => ({
    name: GRADE_LABELS[g],
    count: gradeCounts[g] ?? 0,
    color: GRADE_COLORS[g],
  }))

  const nextReviews = results
    .filter((r) => r.nextReviewDate)
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate))
    .slice(0, 5)

  useEffect(() => {
    if (!isGood || confettiRef.current) return
    confettiRef.current = true
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } })
      setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.4 } }), 400)
    })
  }, [isGood])

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="text-center rounded-2xl border border-border bg-card p-8">
        {isGood ? (
          <CheckCircle2 size={44} className="text-srs-dominado mx-auto mb-3" />
        ) : (
          <TrendingDown size={44} className="text-srs-practica mx-auto mb-3" />
        )}
        <h1 className="font-heading text-2xl font-bold mb-1">
          {isGood ? '¡Buen trabajo!' : 'Sesion completada'}
        </h1>
        <p className="text-muted text-sm">{masteryPct}% de respuestas correctas o buenas</p>
      </div>

      {results.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Distribucion de calificaciones</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1A2E45', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {nextReviews.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <RotateCcw size={14} className="text-cyan" /> Proximos repasos
          </h3>
          <ul className="space-y-2">
            {nextReviews.map((r) => (
              <li key={r.conceptSlug} className="flex items-center justify-between text-xs">
                <span className="text-foreground font-medium truncate">{r.conceptTitle}</span>
                <span className="text-muted flex-shrink-0 ml-2">{r.nextReviewDate}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={() => navigate(isGood ? `/deck/${deckId}/session/${moduleSlug}/recursos/${sessionId}` : `/deck/${deckId}/session/${moduleSlug}/refuerzo/${sessionId}`, { state })}
          className={`w-full rounded-xl px-5 py-3 text-sm font-semibold transition ${
            isGood
              ? 'bg-srs-dominado text-white hover:opacity-90'
              : 'bg-srs-practica text-background hover:opacity-90'
          }`}
        >
          {isGood ? 'Ver recursos adicionales →' : 'Ver repaso detallado →'}
        </button>
        <button
          onClick={() => navigate(`/deck/${deckId}/graph`)}
          className="w-full rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted hover:bg-card transition flex items-center justify-center gap-2"
        >
          <Network size={14} /> Ver grafo completo
        </button>
        <button
          onClick={() => navigate(`/deck/${deckId}/modules`)}
          className="w-full rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted hover:bg-card transition flex items-center justify-center gap-2"
        >
          <Brain size={14} /> Volver al plan
        </button>
      </div>
    </div>
  )
}
