const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL ?? 'http://localhost:8000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${FASTAPI_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail ?? 'Error en la API')
  }
  return res.json()
}

export interface SessionStart {
  session_id: string
  deck_id: string
  module_slug: string
  session_type: string
  n_concepts: number
  estimated_minutes: number
  n_questions: number
  pending_reviews: { concept_slug: string; proximo_repaso: string; estado: string }[]
}

export interface QuestionItem {
  type: 'completar' | 'relacionar' | 'diagrama' | 'desarrollo'
  prompt: string
  blanks?: string[]
  pairs?: { term: string; definition: string }[]
  expected_answer?: string
  concept_slug: string
  concept_title: string
  file: string
}

export interface ConceptQuestions {
  concept_slug: string
  concept_title: string
  questions: QuestionItem[]
}

export interface SessionQuestions {
  session_id: string
  deck_id: string
  module_slug: string
  data: ConceptQuestions[]
}

export interface EvalReport {
  ideas_cubiertas: string[]
  ideas_omitidas: string[]
  errores: string[]
  calificacion_sugerida: 'excelente' | 'bien' | 'dificil' | 'olvidado'
  justificacion: string
  tip_de_estudio: string
}

export interface SrsResponseResult {
  success: boolean
  concept_slug: string
  grade: string
  new_estado: string
  new_maestria: number
  new_retentiva: number
  next_review_date: string
  propagated_concepts: string[]
}

export async function startSession(deckId: string, moduleSlug: string, sessionType = 'nuevo'): Promise<SessionStart> {
  return request<SessionStart>('/sessions/start', {
    method: 'POST',
    body: JSON.stringify({ deck_id: deckId, module_slug: moduleSlug, session_type: sessionType }),
  })
}

export async function fetchSessionQuestions(sessionId: string): Promise<SessionQuestions> {
  return request<SessionQuestions>(`/sessions/${sessionId}/questions`)
}

export async function evaluateAnswer(question: string, expectedAnswer: string, userAnswer: string): Promise<EvalReport> {
  return request<EvalReport>('/evaluate/', {
    method: 'POST',
    body: JSON.stringify({ question, expected_answer: expectedAnswer, user_answer: userAnswer }),
  })
}

export async function submitSrsResponse(params: {
  sessionId: string
  deckId: string
  conceptSlug: string
  questionFile: string
  questionType: string
  userAnswer: string
  grade: 'excelente' | 'bien' | 'dificil' | 'olvidado'
  aiEvaluation?: EvalReport | null
}): Promise<SrsResponseResult> {
  return request<SrsResponseResult>('/srs/response', {
    method: 'POST',
    body: JSON.stringify({
      session_id: params.sessionId,
      deck_id: params.deckId,
      concept_slug: params.conceptSlug,
      question_file: params.questionFile,
      question_type: params.questionType,
      user_answer: params.userAnswer,
      grade: params.grade,
      ai_evaluation: params.aiEvaluation ?? null,
    }),
  })
}

export async function fetchDueReviews(deckId: string) {
  return request<{ due_count: number; rehabilitation_session: boolean; concepts: object[] }>(
    `/srs/due?deck_id=${encodeURIComponent(deckId)}`,
  )
}
