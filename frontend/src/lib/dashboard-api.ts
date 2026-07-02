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

export interface DashboardMetrics {
  mastery_avg: number
  estado_counts: Record<string, number>
  concept_count: number
  tiempo_semana: { day: string; minutes: number }[]
  retencion_30d: number
  due_today_count: number
  due_week_count: number
  proxima_revision: string | null
  streak_days: number
  studied_today: boolean
}

export interface DashboardStats {
  retention_curve: { day: number; real: number; ebbinghaus: number }[]
  concept_table: {
    concept: string
    module: string
    retentiva: number
    estabilidad: number
    dificultad: number
    proximo_repaso: string | null
  }[]
  heatmap: { date: string; minutes: number }[]
  patterns: string[]
  schedule_efficacy: { planned: number; completed: number }
}

export async function fetchDashboardMetrics(deckId: string): Promise<DashboardMetrics> {
  return request<DashboardMetrics>(`/dashboard/${deckId}/metrics`)
}

export async function fetchDashboardStats(deckId: string): Promise<DashboardStats> {
  return request<DashboardStats>(`/dashboard/${deckId}/stats`)
}
