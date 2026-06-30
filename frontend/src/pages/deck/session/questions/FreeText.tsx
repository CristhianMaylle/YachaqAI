import { useState } from 'react'
import { Loader2, Brain, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { evaluateAnswer, type EvalReport, type QuestionItem } from '@/lib/session-api'
import type { SrsGrade } from '@/types'

interface Props {
  question: QuestionItem
  onGrade: (grade: SrsGrade, userAnswer: string, evalReport: EvalReport) => void
}

const GRADE_LABELS: Record<SrsGrade, string> = {
  excelente: 'Excelente',
  bien: 'Bien',
  dificil: 'Difícil',
  olvidado: 'Olvidado / No supe',
}

const GRADE_COLORS: Record<SrsGrade, string> = {
  excelente: 'border-srs-dominado bg-srs-dominado/10 text-srs-dominado',
  bien: 'border-cyan bg-cyan/10 text-cyan',
  dificil: 'border-srs-practica bg-srs-practica/10 text-srs-practica',
  olvidado: 'border-srs-critico bg-srs-critico/10 text-srs-critico',
}

export function FreeText({ question, onGrade }: Props) {
  const [answer, setAnswer] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [report, setReport] = useState<EvalReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleEvaluate() {
    if (!answer.trim()) return
    setEvaluating(true)
    setError(null)
    try {
      const r = await evaluateAnswer(question.prompt, question.expected_answer ?? '', answer)
      setReport(r)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setEvaluating(false)
    }
  }

  function handleConfirm(grade: SrsGrade) {
    onGrade(grade, answer, report!)
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-foreground">{question.prompt}</p>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={!!report}
        placeholder="Escribe tu respuesta aqui (3-5 oraciones)..."
        rows={6}
        className="w-full resize-y rounded-xl border border-border bg-background p-4 text-xs text-foreground placeholder:text-muted outline-none focus:border-cyan transition-colors disabled:opacity-70"
      />

      {!report && !evaluating && (
        <button
          onClick={handleEvaluate}
          disabled={!answer.trim()}
          className="rounded-lg bg-cyan px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2"
        >
          <Brain size={16} />
          Enviar para evaluacion de IA
        </button>
      )}

      {evaluating && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" />
          Evaluando tu respuesta...
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-srs-critico rounded-lg bg-srs-critico/10 p-3 border border-srs-critico/30">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {report && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          {report.ideas_cubiertas.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-srs-dominado uppercase tracking-wider mb-1.5">
                <CheckCircle2 size={12} /> Ideas cubiertas
              </div>
              <ul className="space-y-1">
                {report.ideas_cubiertas.map((idea, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                    <span className="text-srs-dominado mt-0.5 flex-shrink-0">✓</span> {idea}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.ideas_omitidas.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-srs-practica uppercase tracking-wider mb-1.5">
                <AlertCircle size={12} /> Ideas omitidas
              </div>
              <ul className="space-y-1">
                {report.ideas_omitidas.map((idea, i) => (
                  <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                    <span className="text-srs-practica mt-0.5 flex-shrink-0">○</span> {idea}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.errores.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-srs-critico uppercase tracking-wider mb-1.5">
                <XCircle size={12} /> Errores
              </div>
              <ul className="space-y-1">
                {report.errores.map((err, i) => (
                  <li key={i} className="text-xs text-srs-critico flex items-start gap-1.5">
                    <span className="mt-0.5 flex-shrink-0">✗</span> {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-border pt-3 space-y-1 text-xs">
            <p className="text-muted"><span className="font-semibold text-foreground">Justificacion: </span>{report.justificacion}</p>
            {report.tip_de_estudio && (
              <p className="text-muted"><span className="font-semibold text-foreground">Tip: </span>{report.tip_de_estudio}</p>
            )}
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
              Calificacion sugerida: <span className="text-foreground normal-case font-semibold">
                {GRADE_LABELS[report.calificacion_sugerida]}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleConfirm(report.calificacion_sugerida)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition hover:opacity-90 ${GRADE_COLORS[report.calificacion_sugerida]}`}
              >
                Confirmar: {GRADE_LABELS[report.calificacion_sugerida]}
              </button>
              {(['excelente', 'bien', 'dificil', 'olvidado'] as SrsGrade[])
                .filter((g) => g !== report.calificacion_sugerida)
                .map((g) => (
                  <button
                    key={g}
                    onClick={() => handleConfirm(g)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted hover:bg-card transition"
                  >
                    {GRADE_LABELS[g]}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
