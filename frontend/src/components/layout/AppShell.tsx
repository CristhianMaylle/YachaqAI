import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useParams } from 'react-router-dom'
import {
  LayoutDashboard,
  Network,
  Brain,
  Layers,
  RotateCcw,
  Calendar,
  MessageSquare,
  ShieldCheck,
  BarChart2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchNotebook } from '@/lib/notebook-api'
import { useLLMStore } from '@/stores/llm.store'

const NAV_ITEMS = [
  { suffix: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { suffix: '/graph', icon: Network, label: 'Grafo' },
  { suffix: '/wiki/index.md', icon: Brain, label: 'Wiki' },
  { suffix: '/modules', icon: Layers, label: 'Módulos' },
  { suffix: '/review', icon: RotateCcw, label: 'Repaso' },
  { suffix: '/schedule', icon: Calendar, label: 'Calendario' },
  { suffix: '/wiki-chat', icon: MessageSquare, label: 'Chat' },
  { suffix: '/stats', icon: BarChart2, label: 'Estadísticas' },
  { suffix: '/health', icon: ShieldCheck, label: 'Lint' },
]

export function AppShell() {
  const { deckId } = useParams<{ deckId: string }>()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [name, setName] = useState('')
  const { activeProvider, activeModel, fetchProviders } = useLLMStore()

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  useEffect(() => {
    if (!deckId) return
    fetchNotebook(deckId).then((data) => setName(data.meta?.name || deckId))
  }, [deckId])

  const handleToggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar_collapsed', String(next))
  }

  return (
    <div className="flex h-screen">
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-card transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="p-4 border-b border-border flex flex-col gap-2 relative">
          <div className="flex items-center justify-between">
            {!collapsed ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft size={14} /> Volver a mazos
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="w-8 h-8 rounded-lg hover:bg-primary flex items-center justify-center text-muted hover:text-foreground transition-colors"
                title="Volver a mazos"
              >
                <ArrowLeft size={14} />
              </Link>
            )}
            <button
              onClick={handleToggle}
              className="w-8 h-8 rounded-lg hover:bg-primary flex items-center justify-center text-muted hover:text-foreground transition-colors ml-auto"
              title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          {!collapsed && (
            <h2 className="font-heading font-semibold text-base mt-2 truncate text-foreground" title={name}>
              {name || deckId}
            </h2>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const href = `/deck/${deckId}${item.suffix}`
            const active =
              location.pathname === href ||
              location.pathname.startsWith(href.replace(/\.md$/, ''))
            return (
              <Link
                key={item.suffix}
                to={href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center rounded-lg text-sm transition-all',
                  collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                  active
                    ? 'bg-primary text-cyan font-medium'
                    : 'text-muted hover:bg-primary/50 hover:text-foreground'
                )}
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {activeProvider && activeModel && (
          <div className="px-3 py-2 border-t border-border">
            {collapsed ? (
              <div className="flex justify-center" title={`${activeProvider} — ${activeModel}`}>
                <Zap size={14} className="text-cyan" />
              </div>
            ) : (
              <Link
                to="/settings"
                className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted hover:text-foreground hover:bg-primary/30 transition"
              >
                <Zap size={12} className="text-cyan" />
                <span className="truncate">{activeModel}</span>
              </Link>
            )}
          </div>
        )}

        <div className="p-3 border-t border-border flex justify-center">
          {collapsed ? (
            <Link
              to={`/deck/${deckId}/documents/upload`}
              title="Agregar fuentes"
              className="w-10 h-10 rounded-full bg-cyan text-background flex items-center justify-center hover:opacity-90 transition-colors"
            >
              <Plus size={18} />
            </Link>
          ) : (
            <Link
              to={`/deck/${deckId}/documents/upload`}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-cyan text-background text-sm font-medium hover:opacity-90 transition-colors"
            >
              <Plus size={16} /> Agregar fuentes
            </Link>
          )}
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
