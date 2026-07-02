import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import {
  completeSession,
  fetchSessionQuestions,
  submitSrsResponse,
  type QuestionItem,
  type EvalReport,
  type SessionQuestions,
} from '@/lib/session-api'
import type { SrsGrade } from '@/types'
import { FillBlank } from './questions/FillBlank'
import { DiagramBlank } from './questions/DiagramBlank'
import { Matching } from './questions/Matching'
import { FreeText } from './questions/FreeText'

interface SessionResult {
  conceptSlug: string
  conceptTitle: string
  grade: SrsGrade
  nextReviewDate: string
  propagated: string[]
}

export function QuestionRunner() {
  const { deckId, moduleSlug, sessionId } = useParams<{
    deckId: string
    moduleSlug: string
    sessionId: string
  }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<SessionQuestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [flatQuestions, setFlatQuestions] = useState<QuestionItem[]>([])
  const [current, setCurrent] = useState(0)
  const [pendingGrade, setPendingGrade] = useState<{
    scorePercent?: number
    grade?: SrsGrade
    userAnswer: string
    evalReport?: EvalReport
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<SessionResult[]>([])
  const startedAtRef = useRef(Date.now())

  useEffect(() => {
    if (!sessionId) return
    fetchSessionQuestions(sessionId)
      .then((s) => {
        setSession(s)
        setFlatQuestions(s.data.flatMap((c) => c.questions))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [sessionId])

  function scoreToGrade(pct: number): SrsGrade {
    if (pct === 100) return 'excelente'
    if (pct >= 70) return 'bien'
    if (pct > 0) return 'dificil'
    return 'olvidado'
  }

  function handleAutoGrade(scorePercent: number, userAnswer: string) {
    setPendingGrade({ scorePercent, grade: scoreToGrade(scorePercent), userAnswer })
  }

  function handleFreeTextGrade(grade: SrsGrade, userAnswer: string, evalReport: EvalReport) {
    setPendingGrade({ grade, userAnswer, evalReport })
  }

  async function handleNext() {
    if (!pendingGrade?.grade || !deckId || !session) return
    const q = flatQuestions[current]
    setSubmitting(true)
    let allResults = results
    try {
      const res = await submitSrsResponse({
        sessionId: sessionId!,
        deckId,
        conceptSlug: q.concept_slug,
        questionFile: q.file,
        questionType: q.type,
        userAnswer: pendingGrade.userAnswer,
        grade: pendingGrade.grade,
        aiEvaluation: pendingGrade.evalReport ?? null,
      })
      allResults = [
        ...results,
        {
          conceptSlug: q.concept_slug,
          conceptTitle: q.concept_title,
          grade: pendingGrade.grade!,
          nextReviewDate: res.next_review_date,
          propagated: res.propagated_concepts,
        },
      ]
      setResults(allResults)
    } catch (e: any) {
      // Non-fatal: still advance so one failed submission doesn't block the session
      console.error('submit error:', e.message)
    } finally {
      setSubmitting(false)
    }

    setPendingGrade(null)
    const nextIdx = current + 1
    if (nextIdx >= flatQuestions.length) {
      const durationSeconds = Math.round((Date.now() - startedAtRef.current) / 1000)
      completeSession(sessionId!, durationSeconds, allResults.map((r) => r.grade)).catch((e) =>
        console.error('complete session error:', e.message),
      )
      navigate(`/deck/${deckId}/session/${moduleSlug}/summary/${sessionId}`, {
        state: { results: allResults, totalQuestions: flatQuestions.length },
      })
    } else {
      setCurrent(nextIdx)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted text-sm gap-2 animate-pulse">
        <Loader2 size={16} className="animate-spin" /> Cargando preguntas...
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="p-10 text-srs-critico text-sm flex items-center gap-2 justify-center">
        <AlertCircle size={16} /> {error ?? 'Error al cargar la sesion'}
      </div>
    )
  }

  if (flatQuestions.length === 0) {
    return (
      <div className="p-10 text-muted text-sm text-center">
        No se encontraron preguntas para este modulo.
      </div>
    )
  }

  const q = flatQuestions[current]
  const total = flatQuestions.length

  function renderQuestion() {
    switch (q.type) {
      case 'completar':
        return <FillBlank key={current} question={q} onGrade={handleAutoGrade} />
      case 'diagrama':
        return <DiagramBlank key={current} question={q} onGrade={handleAutoGrade} />
      case 'relacionar':
        return <Matching key={current} question={q} onGrade={handleAutoGrade} />
      case 'desarrollo':
        return <FreeText key={current} question={q} onGrade={handleFreeTextGrade} />
      default:
        return <p className="text-muted text-sm">Tipo de pregunta desconocido.</p>
    }
  }

  const typeLabel: Record<string, string> = {
    completar: 'Completar Oracion',
    diagrama: 'Diagrama Incompleto',
    relacionar: 'Relacionar Terminos',
    desarrollo: 'Desarrollo Conceptual',
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 text-xs text-muted">
          <span className="font-semibold text-foreground">{q.concept_title}</span>
          <span>Pregunta {current + 1} de {total}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-background overflow-hidden">
          <div
            className="h-full bg-cyan rounded-full transition-all duration-300"
            style={{ width: `${((current + (pendingGrade ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
            {typeLabel[q.type] ?? q.type}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6">
        {renderQuestion()}
      </div>

      {pendingGrade?.grade && (
        <button
          onClick={handleNext}
          disabled={submitting}
          className="mt-5 w-full rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {current + 1 < total ? 'Siguiente pregunta →' : 'Ver resumen de sesion →'}
        </button>
      )}
    </div>
  )
}
