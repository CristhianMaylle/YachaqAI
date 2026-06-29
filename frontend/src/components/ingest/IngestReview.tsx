import { useState } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Brain,
  Building2,
  Layers,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import type { ReviewItem } from '@/types'

interface Props {
  reviewItems: ReviewItem[]
  onConfirm: (items: ReviewItem[]) => void
  onCancel: () => void
  loading?: boolean
}

export function IngestReview({ reviewItems, onConfirm, onCancel, loading }: Props) {
  const [items, setItems] = useState<ReviewItem[]>(() =>
    reviewItems.map((item) => ({ ...item })),
  )
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    concepto: true,
    entidad: true,
    modulo: true,
  })

  const toggle = (slug: string) => {
    setItems((prev) =>
      prev.map((i) => (i.slug === slug ? { ...i, accepted: !i.accepted } : i)),
    )
  }

  const toggleSection = (type: string) => {
    setExpandedSections((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  const concepts = items.filter((i) => i.type === 'concepto')
  const entities = items.filter((i) => i.type === 'entidad')
  const modules = items.filter((i) => i.type === 'modulo')
  const acceptedCount = items.filter((i) => i.accepted).length

  const sections = [
    { type: 'concepto', label: 'Conceptos', icon: Brain, items: concepts },
    { type: 'entidad', label: 'Entidades', icon: Building2, items: entities },
    { type: 'modulo', label: 'Módulos', icon: Layers, items: modules },
  ].filter((s) => s.items.length > 0)

  const actionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return (
          <span className="rounded bg-srs-dominado/20 px-1.5 py-0.5 text-xs text-srs-dominado">
            crear
          </span>
        )
      case 'update':
        return (
          <span className="rounded bg-srs-practica/20 px-1.5 py-0.5 text-xs text-srs-practica">
            actualizar
          </span>
        )
      case 'conflict':
        return (
          <span className="rounded bg-srs-critico/20 px-1.5 py-0.5 text-xs text-srs-critico">
            conflicto
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="mt-6 space-y-4 animate-fade-in">
      <div className="rounded-xl bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Plan de Ingesta</h2>
        <p className="mt-1 text-sm text-muted">
          Se detectaron {concepts.length} conceptos, {entities.length} entidades y{' '}
          {modules.length} módulos. Revisa y confirma antes de generar la wiki.
        </p>
      </div>

      {sections.map((section) => (
        <div key={section.type} className="rounded-xl bg-card overflow-hidden">
          <button
            onClick={() => toggleSection(section.type)}
            className="flex w-full items-center gap-3 p-4 text-left hover:bg-primary/30 transition"
          >
            {expandedSections[section.type] ? (
              <ChevronDown size={16} className="text-muted" />
            ) : (
              <ChevronRight size={16} className="text-muted" />
            )}
            <section.icon size={18} className="text-cyan" />
            <span className="font-medium">
              {section.label} ({section.items.length})
            </span>
          </button>

          {expandedSections[section.type] && (
            <div className="border-t border-border">
              {section.items.map((item) => (
                <label
                  key={item.slug}
                  className={`flex items-start gap-3 border-b border-border/50 p-4 last:border-0 cursor-pointer transition hover:bg-primary/20 ${
                    item.action === 'conflict' ? 'bg-srs-practica/5' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.accepted}
                    onChange={() => toggle(item.slug)}
                    className="mt-1 h-4 w-4 rounded accent-cyan"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{item.title}</span>
                      {actionBadge(item.action)}
                    </div>
                    {item.summary && (
                      <p className="mt-0.5 text-sm text-muted">{item.summary}</p>
                    )}
                    {item.action === 'conflict' && item.conflict_detail && (
                      <div className="mt-2 flex items-start gap-2 rounded bg-srs-practica/10 p-2.5 text-sm">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-srs-practica" />
                        <span className="text-srs-practica">{item.conflict_detail}</span>
                      </div>
                    )}
                    {item.prerequisites.length > 0 && (
                      <p className="mt-1 text-xs text-muted">
                        Prerrequisitos: {item.prerequisites.join(', ')}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-sm text-muted">
          {acceptedCount} de {items.length} elementos seleccionados
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-card disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(items)}
            disabled={loading || acceptedCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Generando...
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> Confirmar y generar wiki
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
