import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { QuestionItem } from '@/lib/session-api'

interface Props {
  question: QuestionItem
  onGrade: (scorePercent: number, userAnswer: string) => void
  promptClass?: string
}

export function FillBlank({ question, onGrade, promptClass = '' }: Props) {
  const blanks = question.blanks ?? []
  const [inputs, setInputs] = useState<string[]>(Array(blanks.length).fill(''))
  const [checked, setChecked] = useState(false)
  const [results, setResults] = useState<boolean[]>([])

  const parts = question.prompt.split('[___]')

  function handleCheck() {
    const res = blanks.map((expected, i) =>
      (inputs[i] ?? '').trim().toLowerCase() === expected.toLowerCase(),
    )
    setResults(res)
    setChecked(true)
    const correct = res.filter(Boolean).length
    const pct = blanks.length > 0 ? Math.round((correct / blanks.length) * 100) : 0
    onGrade(pct, inputs.join(' | '))
  }

  return (
    <div className="space-y-6">
      <div className={`text-sm leading-relaxed text-foreground ${promptClass}`}>
        {parts.map((part, i) => (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: part }} />
            {i < blanks.length && (
              <span className="inline-flex items-center gap-1 mx-1">
                <input
                  type="text"
                  value={inputs[i]}
                  onChange={(e) => {
                    const copy = [...inputs]
                    copy[i] = e.target.value
                    setInputs(copy)
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !checked) handleCheck() }}
                  disabled={checked}
                  placeholder="____"
                  className={`rounded border px-2 py-0.5 text-xs font-medium outline-none w-32 transition-colors ${
                    checked
                      ? results[i]
                        ? 'border-srs-dominado bg-srs-dominado/10 text-srs-dominado'
                        : 'border-srs-critico bg-srs-critico/10 text-srs-critico'
                      : 'border-border bg-background text-foreground focus:border-cyan'
                  }`}
                />
                {checked && (
                  results[i]
                    ? <CheckCircle2 size={14} className="text-srs-dominado flex-shrink-0" />
                    : <XCircle size={14} className="text-srs-critico flex-shrink-0" />
                )}
              </span>
            )}
          </span>
        ))}
      </div>

      {checked && results.some((r) => !r) && (
        <div className="rounded-lg bg-card border border-border p-3 text-xs text-muted">
          <span className="font-semibold text-foreground">Respuestas correctas: </span>
          {blanks.join(', ')}
        </div>
      )}

      {!checked && (
        <button
          onClick={handleCheck}
          disabled={inputs.some((v) => !v.trim())}
          className="rounded-lg bg-cyan px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50 transition"
        >
          Comprobar respuesta
        </button>
      )}
    </div>
  )
}
