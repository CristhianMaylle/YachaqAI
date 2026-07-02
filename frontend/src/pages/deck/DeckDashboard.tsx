import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Bell, Flame, RotateCcw, Network, MessageSquare, BarChart2 } from "lucide-react";
import { fetchNotebook } from "@/lib/notebook-api";
import { fetchDashboardMetrics, type DashboardMetrics } from "@/lib/dashboard-api";
import { fetchNotifications, markNotificationRead, type AppNotification } from "@/lib/notifications-api";

export function DeckDashboard() {
  const { deckId } = useParams<{ deckId: string }>();
  const [data, setData] = useState<any>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!deckId) return;
    fetchNotebook(deckId).then(setData);
    fetchDashboardMetrics(deckId).then(setMetrics).catch(() => setMetrics(null));
    fetchNotifications(deckId).then((r) => setNotifications(r.notifications)).catch(() => {});
  }, [deckId]);

  if (!data) {
    return <div className="p-10 animate-pulse text-muted">Cargando dashboard...</div>;
  }

  const { meta, stats } = data;
  const estado = stats?.estadoCounts || {};
  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleMarkRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      /* no-op: la notificacion vuelve a aparecer sin leer en el proximo fetch */
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight mb-2">{meta.name}</h1>
          <p className="text-muted">{meta.description || "Cuaderno de estudio generado con YachaqAI."}</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {metrics && metrics.streak_days > 0 && (
            <div
              className={`flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold ${
                !metrics.studied_today ? "text-orange-400 animate-pulse" : "text-foreground"
              }`}
              title={!metrics.studied_today ? "Estudia hoy para no perder tu racha" : "Racha activa"}
            >
              <Flame size={16} className="text-orange-400" /> {metrics.streak_days}
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-primary/30 transition-colors"
            >
              <Bell size={16} className="text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-srs-critico text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg z-20 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-border text-xs font-semibold text-muted uppercase tracking-wide">
                  Notificaciones
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-muted text-center">Todo al dia ✓</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleMarkRead(n.id)}
                      className={`w-full text-left p-3 border-b border-border last:border-0 hover:bg-primary/20 transition-colors ${
                        n.read ? "opacity-50" : ""
                      }`}
                    >
                      <p className="text-xs font-semibold text-foreground">{n.title}</p>
                      {n.body && <p className="text-xs text-muted mt-0.5">{n.body}</p>}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {metrics && metrics.due_today_count > 0 && (
        <Link
          to={`/deck/${deckId}/srs/due`}
          className="mb-6 flex items-center justify-between rounded-xl border border-srs-critico/30 bg-srs-critico/10 px-5 py-3 text-sm hover:bg-srs-critico/15 transition-colors"
        >
          <span className="flex items-center gap-2 text-srs-critico font-medium">
            <RotateCcw size={14} /> {metrics.due_today_count} concepto(s) requieren repaso hoy
          </span>
          <span className="text-srs-critico text-xs font-semibold">Repasar ahora →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Maestria" value={`${metrics?.mastery_avg ?? stats?.masteryAvg ?? 0}%`} />
        <StatCard label="Conceptos" value={stats?.conceptCount || 0} />
        <StatCard label="Retencion (actual)" value={`${metrics?.retencion_30d ?? 0}%`} />
        <StatCard label="Racha" value={`${metrics?.streak_days ?? 0} dias`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4">Distribucion de maestria</h3>
          <div className="space-y-3">
            <MasteryBar label="Dominado" count={estado.dominado || 0} total={stats?.conceptCount || 1} color="bg-srs-dominado" />
            <MasteryBar label="En practica" count={estado.en_practica || 0} total={stats?.conceptCount || 1} color="bg-srs-practica" />
            <MasteryBar label="Critico" count={estado.critico || 0} total={stats?.conceptCount || 1} color="bg-srs-critico" />
            <MasteryBar label="Bloqueado" count={estado.bloqueado || 0} total={stats?.conceptCount || 1} color="bg-srs-bloqueado" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4">Accesos rapidos</h3>
          <div className="space-y-2">
            <Link to={`/deck/${deckId}/documents/upload`} className="block w-full px-4 py-2 rounded-lg bg-cyan text-background text-sm font-medium text-center hover:opacity-90 transition-colors">
              Agregar fuentes
            </Link>
            <Link to={`/deck/${deckId}/graph`} className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium text-center hover:bg-card transition-colors">
              <Network size={14} /> Ver grafo
            </Link>
            <Link to={`/deck/${deckId}/wiki-chat`} className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium text-center hover:bg-card transition-colors">
              <MessageSquare size={14} /> Consultar LLM Wiki
            </Link>
            <Link to={`/deck/${deckId}/stats`} className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium text-center hover:bg-card transition-colors">
              <BarChart2 size={14} /> Ver estadisticas
            </Link>
          </div>
        </div>
      </div>

      {metrics && (
        <div className="rounded-xl border border-border bg-card p-5 mb-8">
          <h3 className="font-semibold mb-4">Tiempo estudiado esta semana</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={metrics.tiempo_semana} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} unit="m" />
              <Tooltip contentStyle={{ background: "#1A2E45", border: "none", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="minutes" fill="#00C6FB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}

function MasteryBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted">{count} ({pct}%)</span>
      </div>
      <div className="h-2 w-full rounded-full bg-background overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
