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

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string | null
  deck_id: string | null
  action_url: string | null
  read: boolean
  created_at: string
}

export async function fetchNotifications(deckId: string): Promise<{ notifications: AppNotification[]; unread_count: number }> {
  return request(`/notifications/?deck_id=${encodeURIComponent(deckId)}`)
}

export async function markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
  return request(`/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'PUT' })
}
