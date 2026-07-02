import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'
import { Loader2 } from 'lucide-react'
import { fetchDashboardStats, type DashboardStats } from '@/lib/dashboard-api'

function heatmapColor(minutes: number): string {
  if (minutes <= 0) return 'bg-background border border-border'
  if (minutes < 15) return 'bg-cyan/25'
  if (minutes < 30) return 'bg-cyan/50'
  if (minutes < 60) return 'bg-cyan/75'
  return 'bg-cyan'
}

export function Stats() {
  const { deckId } = useParams<{ deckId: string }>()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!deckId) return
    fetchDashboardStats(deckId)
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [deckId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted text-sm gap-2 animate-pulse">
        <Loader2 size={16} className="animate-spin" /> Cargando estadisticas...
      </div>
    )
  }

  if (error || !stats) {
    return <div className="p-10 text-srs-critico text-sm">{error ?? 'No se pudieron cargar las estadisticas'}</div>
  }

  const heatmapWeeks = (() => {
    const days = stats.heatmap.slice(-98) // ~14 semanas
    const weeks: { date: string; minutes: number }[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
    return weeks
  })()

  const efficacyData = [
    { name: 'Sesiones', planificadas: stats.schedule_efficacy.planned, completadas: stats.schedule_efficacy.completed },
  ]

  return (
    <div className="mx-auto max-w-5xl p-8 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Estadisticas Detalladas</h1>
        <p className="text-muted text-sm mt-1">Curva de retencion, dificultad por concepto y patrones de estudio.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Curva de retencion: real vs. Ebbinghaus teorica</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={stats.retention_curve} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} unit="d" />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#1A2E45', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Line type="monotone" dataKey="real" name="Mi retencion (FSRS)" stroke="#00C6FB" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="ebbinghaus" name="Curva Ebbinghaus (sin SRS)" stroke="#9E9E9E" strokeWidth={2} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Actividad de estudio</h3>
        {heatmapWeeks.length === 0 ? (
          <p className="text-xs text-muted">Aun no hay sesiones completadas para mostrar actividad.</p>
        ) : (
          <div className="flex gap-1 overflow-x-auto pb-2">
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.minutes} min`}
                    className={`w-3 h-3 rounded-sm ${heatmapColor(d.minutes)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Patrones de estudio</h3>
          {stats.patterns.length === 0 ? (
            <p className="text-xs text-muted">Aun no hay suficientes datos para detectar patrones.</p>
          ) : (
            <ul className="space-y-2 text-xs text-foreground">
              {stats.patterns.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-cyan">•</span> {p}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Eficacia del cronograma</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={efficacyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1A2E45', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="planificadas" fill="#9E9E9E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completadas" fill="#00C6FB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Conceptos por dificultad</h3>
        {stats.concept_table.length === 0 ? (
          <p className="text-xs text-muted">Aun no hay conceptos con historial de repaso.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="py-2 pr-3 font-medium">Concepto</th>
                  <th className="py-2 pr-3 font-medium">Modulo</th>
                  <th className="py-2 pr-3 font-medium">Retentiva</th>
                  <th className="py-2 pr-3 font-medium">Dificultad</th>
                  <th className="py-2 pr-3 font-medium">Proximo repaso</th>
                </tr>
              </thead>
              <tbody>
                {stats.concept_table.map((c) => (
                  <tr key={c.concept} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 text-foreground font-medium">{c.concept}</td>
                    <td className="py-2 pr-3 text-muted">{c.module}</td>
                    <td className="py-2 pr-3 text-muted">{c.retentiva}%</td>
                    <td className="py-2 pr-3 text-muted">{c.dificultad}</td>
                    <td className="py-2 pr-3 text-muted">{c.proximo_repaso ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
