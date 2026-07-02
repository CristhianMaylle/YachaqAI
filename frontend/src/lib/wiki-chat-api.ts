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

export interface WikiCitation {
  id: string
  file: string
  title: string
}

export interface WikiQueryResult {
  answer: string
  citations: WikiCitation[]
  nodes_consulted: string[]
  can_archive: boolean
}

export interface WikiArchiveResult {
  success: boolean
  file: string
  page_id: string
}

export async function queryWiki(
  deckId: string,
  question: string,
  history: { role: string; content: string }[] = [],
): Promise<WikiQueryResult> {
  return request<WikiQueryResult>('/wiki/query', {
    method: 'POST',
    body: JSON.stringify({ deck_id: deckId, question, history }),
  })
}

export async function archiveWikiResponse(params: {
  deckId: string
  question: string
  content: string
  title: string
  sourceFiles: string[]
}): Promise<WikiArchiveResult> {
  return request<WikiArchiveResult>('/wiki/archive', {
    method: 'POST',
    body: JSON.stringify({
      deck_id: params.deckId,
      question: params.question,
      content: params.content,
      title: params.title,
      source_files: params.sourceFiles,
    }),
  })
}
