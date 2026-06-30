import { useState } from 'react'
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { QuestionItem } from '@/lib/session-api'

interface Props {
  question: QuestionItem
  onGrade: (scorePercent: number, userAnswer: string) => void
}

function DraggableTerm({ id, disabled }: { id: string; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-2 text-xs font-medium cursor-grab select-none transition
        ${isDragging ? 'opacity-50 shadow-lg z-50' : 'hover:bg-cyan/20'}
        ${disabled ? 'opacity-0 pointer-events-none' : ''}`}
    >
      {id}
    </div>
  )
}

interface DropSlotProps {
  definition: string
  placedTerm: string | null
  isCorrect?: boolean | null
  checked: boolean
}

function DropSlot({ definition, placedTerm, isCorrect, checked }: DropSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: definition })
  const borderClass = checked
    ? isCorrect ? 'border-srs-dominado bg-srs-dominado/10' : 'border-srs-critico bg-srs-critico/10'
    : isOver ? 'border-cyan bg-cyan/10' : 'border-border bg-background'

  return (
    <div className="flex items-center gap-2">
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[36px] rounded-lg border-2 border-dashed px-3 py-1.5 text-xs font-medium transition flex items-center gap-2 ${borderClass}`}
      >
        {placedTerm ? (
          <>
            <span className="text-foreground">{placedTerm}</span>
            {checked && (isCorrect
              ? <CheckCircle2 size={12} className="text-srs-dominado ml-auto" />
              : <XCircle size={12} className="text-srs-critico ml-auto" />)}
          </>
        ) : (
          <span className="text-muted/50 italic">Suelta aqui</span>
        )}
      </div>
      <span className="text-xs text-muted flex-shrink-0 w-40 line-clamp-2">{definition}</span>
    </div>
  )
}

export function Matching({ question, onGrade }: Props) {
  const pairs = question.pairs ?? []
  const allTerms = pairs.map((p) => p.term)

  const [placements, setPlacements] = useState<Record<string, string | null>>(
    () => Object.fromEntries(pairs.map((p) => [p.definition, null])),
  )
  const [checked, setChecked] = useState(false)
  const [results, setResults] = useState<Record<string, boolean>>({})

  const placedTerms = new Set(Object.values(placements).filter(Boolean) as string[])
  const availableTerms = allTerms.filter((t) => !placedTerms.has(t))
  const allPlaced = availableTerms.length === 0

  function handleDragEnd(event: DragEndEvent) {
    if (checked) return
    const { active, over } = event
    if (!over) return
    const term = active.id as string
    const definition = over.id as string
    if (!pairs.some((p) => p.definition === definition)) return

    setPlacements((prev) => {
      const next = { ...prev }
      for (const def in next) {
        if (next[def] === term) next[def] = null
      }
      const displaced = next[definition]
      next[definition] = term
      // displaced goes back to pool automatically (not in placements)
      return next
    })
  }

  function handleCheck() {
    const res: Record<string, boolean> = {}
    pairs.forEach((p) => {
      res[p.definition] = placements[p.definition] === p.term
    })
    setResults(res)
    setChecked(true)
    const correct = Object.values(res).filter(Boolean).length
    const pct = Math.round((correct / pairs.length) * 100)
    const answerStr = pairs.map((p) => `${p.term}→${placements[p.definition] ?? '?'}`).join(', ')
    onGrade(pct, answerStr)
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-5">
        <p className="text-xs text-muted">{question.prompt}</p>

        {availableTerms.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3 min-h-[52px]">
            {availableTerms.map((term) => (
              <DraggableTerm key={term} id={term} disabled={checked} />
            ))}
          </div>
        )}

        <div className="space-y-2">
          {pairs.map((p) => (
            <DropSlot
              key={p.definition}
              definition={p.definition}
              placedTerm={placements[p.definition]}
              isCorrect={checked ? results[p.definition] : null}
              checked={checked}
            />
          ))}
        </div>

        {checked && !Object.values(results).every(Boolean) && (
          <div className="rounded-lg bg-card border border-border p-3 text-xs text-muted space-y-1">
            <span className="font-semibold text-foreground block mb-1">Pares correctos:</span>
            {pairs.map((p) => (
              <div key={p.term}>
                <span className="text-foreground font-medium">{p.term}</span>
                <span className="text-muted"> → {p.definition}</span>
              </div>
            ))}
          </div>
        )}

        {!checked && (
          <button
            onClick={handleCheck}
            disabled={!allPlaced}
            className="rounded-lg bg-cyan px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50 transition"
          >
            Comprobar emparejamiento
          </button>
        )}
      </div>
    </DndContext>
  )
}
