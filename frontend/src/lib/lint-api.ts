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

export type LintIssueType = 'orphan' | 'contradiction' | 'missing_page' | 'broken_ref' | 'missing_quiz'

export interface LintIssue {
  type: LintIssueType
  title: string
  file: string
  detail: Record<string, unknown>
}

export interface LintReport {
  score: number | null
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  issues: LintIssue[]
  orphan_count: number
  contradiction_count: number
  missing_page_count: number
  broken_ref_count: number
  missing_quiz_count: number
  created_at?: string | null
}

export async function runLintAnalysis(deckId: string): Promise<LintReport> {
  return request<LintReport>(`/lint/${deckId}/analyze`, { method: 'POST' })
}

export async function fetchLatestLint(deckId: string): Promise<LintReport> {
  return request<LintReport>(`/lint/${deckId}/latest`)
}
