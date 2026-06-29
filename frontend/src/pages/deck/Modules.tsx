import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchNotebook } from '@/lib/notebook-api'

interface ModuleData {
  id: string
  title: string
  description: string
  concepts: { id: string; title: string; file: string; estado_srs: string; maestria: number }[]
  mastery: number
}

export function Modules() {
  const { deckId } = useParams()

  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState<ModuleData[]>([])

  useEffect(() => {
    if (!deckId) return
    fetchNotebook(deckId).then((data) => {
      const pages = data.pages || []
      const modulePages = pages
        .filter((p: any) => p.type === 'modulo')
        .sort((a: any, b: any) => (a.frontmatter?.orden || 0) - (b.frontmatter?.orden || 0))
      const conceptPages = pages.filter((p: any) => p.type === 'concepto')

      const computedModules = modulePages.map((m: any) => {
        const modSlug = m.page_id.replace('modulo-', '')
        const relatedConcepts = conceptPages
          .filter((c: any) => c.frontmatter.modulo === modSlug)
          .map((c: any) => ({
            id: c.page_id,
            title: c.title,
            file: c.file,
            estado_srs: c.estado_srs || 'bloqueado',
            maestria: c.maestria || 0,
          }))

        const avg = relatedConcepts.length
          ? relatedConcepts.reduce((acc: number, c: any) => acc + c.maestria, 0) /
            relatedConcepts.length
          : 0

        return {
          id: m.page_id,
          title: m.title,
          description: m.frontmatter.resumen || 'Modulo de aprendizaje.',
          concepts: relatedConcepts,
          mastery: Math.round(avg * 100),
        }
      })

      setModules(computedModules)
      setLoading(false)
    })
  }, [deckId])

  const getSrsBadgeColor = (estado: string) => {
    switch (estado) {
      case 'dominado':
        return 'bg-srs-dominado'
      case 'en_practica':
        return 'bg-srs-en-practica'
      case 'critico':
        return 'bg-srs-critico'
      case 'en_estudio':
        return 'bg-cyan'
      case 'bloqueado':
      default:
        return 'bg-muted'
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[60vh] text-muted animate-pulse font-medium">
        Cargando estructura de modulos...
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-[85vh]">
      {/* Header */}
      <div className="mb-8 border-b border-border pb-4">
        <h1 className="font-heading text-xl font-semibold text-foreground flex items-center gap-2">
          <span>Modulos de Aprendizaje</span>
          <span className="text-xs font-normal text-muted bg-card px-2 py-0.5 rounded-md">
            Progreso de Maestria
          </span>
        </h1>
        <p className="text-xs text-muted mt-0.5">
          Vista estructurada de los temas clave y tu nivel de dominio por cada concepto.
        </p>
      </div>

      {modules.length === 0 ? (
        <div className="text-center p-12 border border-border rounded-2xl bg-card">
          <p className="text-xs text-muted italic">
            No hay modulos disponibles en este cuaderno. Agrega una fuente primero.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h2 className="font-heading text-sm font-semibold text-foreground">
                    {mod.title}
                  </h2>
                  <span className="text-[10px] font-bold text-cyan bg-cyan/10 px-2 py-0.5 rounded-md border border-cyan/20 uppercase">
                    {mod.concepts.length} Conceptos
                  </span>
                </div>

                <p className="text-xs text-muted leading-relaxed mb-6 line-clamp-2">
                  {mod.description}
                </p>

                {/* Mastery bar */}
                <div className="space-y-1.5 mb-6">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-foreground">Maestria Promedio</span>
                    <span className="text-foreground font-bold">{mod.mastery}%</span>
                  </div>
                  <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan rounded-full transition-all duration-500"
                      style={{ width: `${mod.mastery}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Concepts */}
              <div className="border-t border-border pt-4 mt-auto">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest">
                    Conceptos Clave
                  </h4>
                  <Link
                    to={`/deck/${deckId}/review?module=${mod.id.replace('modulo-', '')}`}
                    className="text-[10px] font-bold text-cyan hover:text-cyan/80 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-cyan/5 hover:bg-cyan/10 border border-cyan/10"
                  >
                    <span>Dar Cuestionario</span>
                    <span className="text-[8px]">▶</span>
                  </Link>
                </div>
                {mod.concepts.length === 0 ? (
                  <span className="text-[10px] text-muted italic">
                    No hay conceptos en este modulo.
                  </span>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mod.concepts.map((concept) => (
                      <Link
                        key={concept.id}
                        to={`/deck/${deckId}/wiki/${concept.file.split('/').map(encodeURIComponent).join('/')}`}
                        className="flex items-center gap-2.5 p-2 rounded-lg border border-border/50 hover:border-border bg-background/50 hover:bg-background transition-all group"
                      >
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${getSrsBadgeColor(concept.estado_srs)}`}
                        />
                        <span className="text-[11px] font-medium text-muted group-hover:text-cyan transition-colors truncate">
                          {concept.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
