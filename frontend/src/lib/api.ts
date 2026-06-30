import type { IngestJob, LLMProvider, Plan, ReviewItem } from '@/types'

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

export const api = {
  ingest: {
    process: (formData: FormData) =>
      fetch(`${FASTAPI_URL}/ingest/process`, { method: 'POST', body: formData }).then(r => r.json()) as Promise<{ job_id: string; status: string; deck_id: string }>,
    status: (jobId: string) =>
      request<IngestJob>(`/ingest/status/${jobId}`),
    confirmReview: (jobId: string, items: ReviewItem[]) =>
      request<{ status: string; approved_count: number }>(`/ingest/${jobId}/confirm-review`, {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
  },
  llm: {
    providers: () => request<LLMProvider[]>('/llm/providers'),
    active: () => request<{ provider: string | null; model: string | null }>('/llm/active'),
    select: (provider: string, model: string) =>
      request<{ provider: string; model: string }>('/llm/select', {
        method: 'PUT',
        body: JSON.stringify({ provider, model }),
      }),
  },
  wiki: {
    query: (deckId: string, question: string) =>
      request('/wiki/query', { method: 'POST', body: JSON.stringify({ deck_id: deckId, question }) }),
  },
  srs: {
    grade: (data: { deck_id: string; concept_slug: string; grade: string }) =>
      request('/srs/grade', { method: 'POST', body: JSON.stringify(data) }),
  },
  plan: {
    get: (deckId: string) => request<Plan>(`/plan/${deckId}`),
    customize: (deckId: string, instruction: string) =>
      request<Plan>(`/plan/${deckId}/customize`, {
        method: 'POST',
        body: JSON.stringify({ instruction }),
      }),
  },
}
