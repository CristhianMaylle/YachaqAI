import type { QuestionItem } from '@/lib/session-api'
import { FillBlank } from './FillBlank'

interface Props {
  question: QuestionItem
  onGrade: (scorePercent: number, userAnswer: string) => void
}

export function DiagramBlank({ question, onGrade }: Props) {
  return (
    <FillBlank
      question={question}
      onGrade={onGrade}
      promptClass="font-mono whitespace-pre-wrap rounded-xl bg-card border border-border p-4 text-[12px] leading-relaxed"
    />
  )
}
