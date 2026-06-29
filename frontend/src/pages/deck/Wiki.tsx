import { useEffect, useState, useMemo, lazy, Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchWikiPage, fetchGraph, fetchNotebook } from '@/lib/notebook-api'
import type { WikiNode, WikiLink } from '@/types'

const ForceGraph = lazy(() =>
  import('@/components/graph/ForceGraph').then((m) => ({ default: m.ForceGraph })),
)

/* ---------- helpers ---------- */

const formatDateValue = (val: string) => {
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return val
  }
}

const formatMetaValue = (key: string, value: any) => {
  if (Array.isArray(value)) {
    if (value.length === 0)
      return <span className="text-muted italic">Ninguno</span>
    if (typeof value[0] === 'object' && value[0] !== null) {
      const label =
        key === 'modulos'
          ? 'modulos'
          : key === 'conceptos'
            ? 'conceptos'
            : key === 'fuentes'
              ? 'fuentes'
              : key === 'preguntas'
                ? 'preguntas'
                : 'elementos'
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan/10 text-cyan border border-cyan/20">
          {value.length} {label}
        </span>
      )
    }
    return <span className="text-foreground">{value.join(', ')}</span>
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <code className="text-[10px] bg-card px-1 py-0.5 rounded font-mono text-muted">
        {JSON.stringify(value)}
      </code>
    )
  }

  if (key === 'estado' || key === 'estado_srs') {
    const stateColors: Record<string, string> = {
      en_estudio: 'bg-blue-900/20 text-blue-400 border-blue-700/40',
      dominado: 'bg-emerald-900/20 text-emerald-400 border-emerald-700/40',
      en_practica: 'bg-amber-900/20 text-amber-400 border-amber-700/40',
      critico: 'bg-red-900/20 text-red-400 border-red-700/40',
      bloqueado: 'bg-card text-muted border-border',
    }
    const colorClass = stateColors[value] || 'bg-card text-muted border-border'
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${colorClass}`}
      >
        {String(value).replace('_', ' ')}
      </span>
    )
  }

  if (key === 'idioma') {
    return (
      <span className="inline-flex items-center gap-1 text-foreground font-semibold">
        <span>🌐</span>{' '}
        {value === 'es' ? 'Espanol' : value === 'en' ? 'Ingles' : String(value).toUpperCase()}
      </span>
    )
  }

  if (key === 'retentiva_srs' || key === 'maestria') {
    const pct = Math.round(Number(value) * 100)
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
        <span className="w-12 h-1.5 bg-card rounded-full overflow-hidden inline-block border border-border">
          <span
            className={`h-full block ${pct >= 80 ? 'bg-srs-dominado' : pct >= 50 ? 'bg-srs-en-practica' : 'bg-srs-critico'}`}
            style={{ width: `${pct}%` }}
          />
        </span>
        <span>{pct}%</span>
      </span>
    )
  }

  if (key === 'estabilidad_srs') {
    return <span className="font-semibold text-foreground">{value} dias</span>
  }

  if (key === 'dificultad_srs') {
    const score = Number(value)
    return (
      <span className="inline-flex items-center gap-1 text-foreground font-semibold">
        {score.toFixed(1)} / 10
      </span>
    )
  }

  if (
    typeof value === 'string' &&
    (key.includes('creado') ||
      key.includes('actualizado') ||
      key.includes('repaso') ||
      /^\d{4}-\d{2}-\d{2}/.test(value))
  ) {
    return (
      <span className="inline-flex items-center gap-1 text-foreground font-semibold">
        {formatDateValue(value)}
      </span>
    )
  }

  return <span className="text-foreground">{String(value)}</span>
}

/* ---------- component ---------- */

export function Wiki() {
  const { deckId } = useParams()
  const splatPath = useParams()['*']
  const relPath = splatPath || 'index.md'

  const [page, setPage] = useState<any>(null)
  const [graph, setGraph] = useState<{ nodes: WikiNode[]; edges: WikiLink[] } | null>(null)
  const [pageList, setPageList] = useState<any[]>([])
  const [showGraphOverlay, setShowGraphOverlay] = useState(true)

  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    root: true,
    fuentes: true,
    conceptos: true,
    entidades: false,
    preguntas: false,
    modulos: true,
  })
  const toggleFolder = (folder: string) =>
    setOpenFolders((prev) => ({ ...prev, [folder]: !prev[folder] }))

  const [openSubfolders, setOpenSubfolders] = useState<Record<string, boolean>>({})
  const toggleSubfolder = (folder: string) =>
    setOpenSubfolders((prev) => ({ ...prev, [folder]: !prev[folder] }))

  useEffect(() => {
    const parts = relPath.split('/')
    if (parts.length > 2 && parts[0] === '5. modulos') {
      setOpenSubfolders((prev) => ({ ...prev, [parts[1]]: true }))
    }
  }, [relPath])

  /* data fetching */
  useEffect(() => {
    if (!deckId) return
    fetchWikiPage(deckId, relPath).then(setPage)
  }, [deckId, relPath])

  useEffect(() => {
    if (!deckId) return
    fetchGraph(deckId).then(setGraph)
  }, [deckId, relPath])

  useEffect(() => {
    if (!deckId) return
    fetchNotebook(deckId).then((data) => {
      if (data?.pages) setPageList(data.pages)
    })
  }, [deckId])

  /* derived data */
  const groupedPages = useMemo(() => {
    const groups = {
      fuentes: [] as any[],
      conceptos: [] as any[],
      entidades: [] as any[],
      preguntas: [] as any[],
      modulos: [] as any[],
    }
    pageList.forEach((p: any) => {
      if (p.file.startsWith('1. fuentes_transformadas/')) groups.fuentes.push(p)
      else if (p.file.startsWith('2. conceptos/')) groups.conceptos.push(p)
      else if (p.file.startsWith('3. entidades/')) groups.entidades.push(p)
      else if (p.file.startsWith('4. preguntas/')) groups.preguntas.push(p)
      else if (p.file.startsWith('5. modulos/')) groups.modulos.push(p)
    })
    Object.values(groups).forEach((arr) => arr.sort((a, b) => a.title.localeCompare(b.title)))
    return groups
  }, [pageList])

  const moduleFolders = useMemo(() => {
    const folders: Record<string, { title: string; pages: any[] }> = {}
    const flatPages: any[] = []
    groupedPages.modulos.forEach((p) => {
      const parts = p.file.split('/')
      if (parts.length > 2) {
        const slug = parts[1]
        const title = slug
          .replace('modulo-', 'Modulo ')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
        if (!folders[slug]) folders[slug] = { title, pages: [] }
        folders[slug].pages.push(p)
      } else {
        flatPages.push(p)
      }
    })
    Object.keys(folders).forEach((slug) => {
      folders[slug].pages.sort((a, b) => {
        if (a.file.endsWith(`${slug}.md`)) return -1
        if (b.file.endsWith(`${slug}.md`)) return 1
        return a.title.localeCompare(b.title)
      })
    })
    return { folders, flatPages }
  }, [groupedPages.modulos])

  const rootPages = useMemo(
    () => [
      { file: 'index.md', title: 'Indice principal' },
      { file: 'overview.md', title: 'Vision General' },
      { file: 'log.md', title: 'Registro de Actividad' },
      { file: 'YACHAQ.md', title: 'Reglas de Ingesta (YACHAQ)' },
    ],
    [],
  )

  const subGraph = useMemo(() => {
    if (!graph || !page) return { nodes: [], edges: [] }
    const currentId = page.page_id
    const neighborIds = new Set<string>([currentId])
    graph.edges.forEach((e) => {
      const s = typeof e.source === 'object' ? (e.source as any).id : e.source
      const t = typeof e.target === 'object' ? (e.target as any).id : e.target
      if (s === currentId) neighborIds.add(t)
      if (t === currentId) neighborIds.add(s)
    })
    const nodes = graph.nodes.filter((n) => neighborIds.has(n.id))
    const edges = graph.edges.filter((e) => {
      const s = typeof e.source === 'object' ? (e.source as any).id : e.source
      const t = typeof e.target === 'object' ? (e.target as any).id : e.target
      return s === currentId || t === currentId
    })
    return { nodes, edges }
  }, [graph, page])

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

  /* loading */
  if (!page) {
    return (
      <div className="p-10 animate-pulse text-muted text-sm font-medium">
        Cargando nota...
      </div>
    )
  }

  const encoded = relPath.split('/').map(encodeURIComponent).join('/')

  const cleanFrontmatter = page.frontmatter
    ? Object.entries(page.frontmatter).filter(
        ([key]) =>
          ![
            'id',
            'tipo',
            'titulo',
            'file',
            'relacionados',
            'prerrequisitos',
            'entidades',
            'mazo_id',
            'yachaq_version',
            'yachaq_schema_version',
          ].includes(key),
      )
    : []

  /* ------- sidebar link helper ------- */
  const sidebarLink = (file: string, label: string, isSelected: boolean, icon?: string) => {
    const enc = file.split('/').map(encodeURIComponent).join('/')
    return (
      <Link
        key={file}
        to={`/deck/${deckId}/wiki/${enc}`}
        className={`block px-2.5 py-1 text-[11px] font-medium rounded-md truncate transition-all ${
          isSelected
            ? 'bg-cyan/10 text-cyan font-semibold'
            : 'text-muted hover:bg-card hover:text-foreground'
        }`}
        title={label}
      >
        {icon ? `${icon} ` : ''}{label}
      </Link>
    )
  }

  return (
    <div className="h-[calc(100vh-1px)] flex bg-background">
      {/* Left Sidebar */}
      <div className="w-[250px] bg-card border-r border-border flex flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-border bg-card">
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest">
            Explorador Wiki
          </h3>
          <p className="text-[10px] text-muted mt-0.5 leading-tight">
            Estructura de archivos y notas
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">
          {/* Root */}
          <div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-foreground hover:bg-primary/50 rounded-lg cursor-pointer select-none transition-colors"
              onClick={() => toggleFolder('root')}
            >
              <span className="text-[9px] text-muted">{openFolders.root ? '▼' : '▶'}</span>
              <span>Cuaderno (Raiz)</span>
            </div>
            {openFolders.root && (
              <div className="ml-3 mt-1.5 flex flex-col gap-1 border-l border-border pl-2">
                {rootPages.map((rp) => sidebarLink(rp.file, rp.title, relPath === rp.file))}
              </div>
            )}
          </div>

          {/* Fuentes */}
          <div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-foreground hover:bg-primary/50 rounded-lg cursor-pointer select-none transition-colors"
              onClick={() => toggleFolder('fuentes')}
            >
              <span className="text-[9px] text-muted">{openFolders.fuentes ? '▼' : '▶'}</span>
              <span className="truncate">1. Fuentes ({groupedPages.fuentes.length})</span>
            </div>
            {openFolders.fuentes && (
              <div className="ml-3 mt-1.5 flex flex-col gap-1 border-l border-border pl-2">
                {groupedPages.fuentes.length > 0
                  ? groupedPages.fuentes.map((p) => sidebarLink(p.file, p.title, relPath === p.file))
                  : <span className="text-[10px] text-muted italic px-2">Vacio</span>}
              </div>
            )}
          </div>

          {/* Conceptos */}
          <div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-foreground hover:bg-primary/50 rounded-lg cursor-pointer select-none transition-colors"
              onClick={() => toggleFolder('conceptos')}
            >
              <span className="text-[9px] text-muted">{openFolders.conceptos ? '▼' : '▶'}</span>
              <span className="truncate">2. Conceptos ({groupedPages.conceptos.length})</span>
            </div>
            {openFolders.conceptos && (
              <div className="ml-3 mt-1.5 flex flex-col gap-1 border-l border-border pl-2">
                {groupedPages.conceptos.length > 0
                  ? groupedPages.conceptos.map((p) => {
                      const isSelected = relPath === p.file
                      const enc = p.file.split('/').map(encodeURIComponent).join('/')
                      const dotColor = getSrsBadgeColor(p.frontmatter?.estado_srs || 'bloqueado')
                      return (
                        <Link
                          key={p.file}
                          to={`/deck/${deckId}/wiki/${enc}`}
                          className={`flex items-center gap-2 px-2.5 py-1 text-[11px] font-medium rounded-md truncate transition-all ${
                            isSelected
                              ? 'bg-cyan/10 text-cyan font-semibold'
                              : 'text-muted hover:bg-card hover:text-foreground'
                          }`}
                          title={p.title}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />
                          <span className="truncate">{p.title}</span>
                        </Link>
                      )
                    })
                  : <span className="text-[10px] text-muted italic px-2">Vacio</span>}
              </div>
            )}
          </div>

          {/* Entidades */}
          <div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-foreground hover:bg-primary/50 rounded-lg cursor-pointer select-none transition-colors"
              onClick={() => toggleFolder('entidades')}
            >
              <span className="text-[9px] text-muted">{openFolders.entidades ? '▼' : '▶'}</span>
              <span className="truncate">3. Entidades ({groupedPages.entidades.length})</span>
            </div>
            {openFolders.entidades && (
              <div className="ml-3 mt-1.5 flex flex-col gap-1 border-l border-border pl-2">
                {groupedPages.entidades.length > 0
                  ? groupedPages.entidades.map((p) => sidebarLink(p.file, p.title, relPath === p.file))
                  : <span className="text-[10px] text-muted italic px-2">Vacio</span>}
              </div>
            )}
          </div>

          {/* Preguntas */}
          <div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-foreground hover:bg-primary/50 rounded-lg cursor-pointer select-none transition-colors"
              onClick={() => toggleFolder('preguntas')}
            >
              <span className="text-[9px] text-muted">{openFolders.preguntas ? '▼' : '▶'}</span>
              <span className="truncate">4. Preguntas ({groupedPages.preguntas.length})</span>
            </div>
            {openFolders.preguntas && (
              <div className="ml-3 mt-1.5 flex flex-col gap-1 border-l border-border pl-2">
                {groupedPages.preguntas.length > 0
                  ? groupedPages.preguntas.map((p) =>
                      sidebarLink(p.file, p.title.replace('Cuestionario: ', ''), relPath === p.file),
                    )
                  : <span className="text-[10px] text-muted italic px-2">Vacio</span>}
              </div>
            )}
          </div>

          {/* Modulos */}
          <div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-foreground hover:bg-primary/50 rounded-lg cursor-pointer select-none transition-colors"
              onClick={() => toggleFolder('modulos')}
            >
              <span className="text-[9px] text-muted">{openFolders.modulos ? '▼' : '▶'}</span>
              <span className="truncate">5. Modulos ({groupedPages.modulos.length})</span>
            </div>
            {openFolders.modulos && (
              <div className="ml-3 mt-1.5 flex flex-col gap-2 border-l border-border pl-2">
                {Object.entries(moduleFolders.folders).map(([slug, data]) => {
                  const isOpen = !!openSubfolders[slug]
                  return (
                    <div key={slug} className="space-y-1">
                      <div
                        className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold text-foreground/80 hover:bg-card rounded cursor-pointer select-none transition-colors"
                        onClick={() => toggleSubfolder(slug)}
                      >
                        <span className="text-[8px] text-muted">{isOpen ? '▼' : '▶'}</span>
                        <span className="truncate">{data.title}</span>
                      </div>
                      {isOpen && (
                        <div className="ml-2.5 flex flex-col gap-0.5 border-l border-border pl-1.5">
                          {data.pages.map((p) => {
                            const isIdx = p.file.endsWith(`${slug}.md`)
                            return sidebarLink(
                              p.file,
                              isIdx ? 'Indice Modulo' : p.title,
                              relPath === p.file,
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
                {moduleFolders.flatPages.map((p) =>
                  sidebarLink(p.file, p.title, relPath === p.file),
                )}
                {groupedPages.modulos.length === 0 && (
                  <span className="text-[10px] text-muted italic px-2">Vacio</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center: Article */}
      <div className="flex-1 overflow-y-auto bg-background p-8 relative">
        <div className="max-w-3xl mx-auto">
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5 text-[10px] text-muted uppercase font-bold tracking-wider">
              <span className={`w-2 h-2 rounded-full ${getSrsBadgeColor(page.estado_srs)}`} />
              <span>
                {page.type} -- Maestria: {Math.round((page.maestria || 0) * 100)}%
              </span>
            </div>
            <Link
              to={`/deck/${deckId}/editor/${encoded}`}
              className="px-3.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-primary/50 transition-colors shadow-sm"
            >
              Editar nota
            </Link>
          </div>

          {/* Frontmatter Card */}
          {cleanFrontmatter.length > 0 && (
            <div className="mb-8 rounded-2xl border border-border bg-card p-5 text-[11px] leading-relaxed shadow-sm flex flex-col gap-3.5">
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
                Detalles de la Nota
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {cleanFrontmatter.map(([key, value]) => {
                  const isLong = key === 'resumen' || key === 'descripcion'
                  return (
                    <div
                      key={key}
                      className={`flex flex-col md:flex-row items-start gap-1 md:gap-4 border-b border-border/30 pb-2.5 md:pb-0 md:border-b-0 last:border-b-0 ${
                        isLong ? 'md:col-span-2' : ''
                      }`}
                    >
                      <span className="text-muted capitalize font-medium w-28 flex-shrink-0">
                        {key.replace('_', ' ')}
                      </span>
                      <span className="text-foreground flex-1 leading-relaxed text-xs">
                        {formatMetaValue(key, value)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Markdown Body */}
          <article
            className="prose prose-invert max-w-none text-xs text-foreground leading-relaxed py-4"
            dangerouslySetInnerHTML={{ __html: page.html }}
          />

          {/* Module Quiz CTA */}
          {page.type === 'modulo' && (
            <div className="mt-8 p-6 rounded-2xl border border-cyan/20 bg-cyan/5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>Listo para evaluar tus conocimientos?</span>
                </h3>
                <p className="text-xs text-muted mt-1 max-w-md">
                  Pon a prueba tu retencion FSRS con las preguntas preparadas para el modulo{' '}
                  <strong className="text-foreground">"{page.title}"</strong>.
                </p>
              </div>
              <Link
                to={`/deck/${deckId}/review?module=${page.page_id.replace('modulo-', '')}`}
                className="px-4 py-2.5 rounded-lg bg-cyan text-background text-xs font-semibold hover:opacity-90 transition-colors shadow-sm flex items-center gap-2 flex-shrink-0"
              >
                Comenzar Cuestionario
              </Link>
            </div>
          )}

          {/* Floating mini-graph */}
          {subGraph.nodes.length > 0 && (
            <div
              className={`fixed bottom-6 right-6 z-10 w-72 h-72 rounded-2xl border border-border bg-card shadow-xl flex flex-col overflow-hidden transition-all duration-300 ${
                showGraphOverlay
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 translate-y-4 pointer-events-none invisible'
              }`}
            >
              <div className="px-3.5 py-2 border-b border-border bg-card flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                  Mapa Local
                </span>
                <button
                  onClick={() => setShowGraphOverlay(false)}
                  className="text-muted hover:text-foreground hover:bg-primary/50 text-[10px] font-bold px-1.5 py-0.5 rounded transition-all"
                  title="Ocultar Mapa"
                >
                  Ocultar
                </button>
              </div>
              <div className="flex-1 relative">
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center text-muted text-[11px]">
                      Cargando grafo...
                    </div>
                  }
                >
                  <ForceGraph
                    deckId={deckId!}
                    nodes={subGraph.nodes}
                    edges={subGraph.edges}
                  />
                </Suspense>
              </div>
              <div className="p-2 border-t border-border bg-card text-[9px] text-muted leading-tight text-center">
                Haz clic en un nodo para navegar.
              </div>
            </div>
          )}

          {/* Toggle graph button */}
          {!showGraphOverlay && subGraph.nodes.length > 0 && (
            <button
              onClick={() => setShowGraphOverlay(true)}
              className="fixed bottom-6 right-6 z-10 px-3.5 py-2 bg-cyan hover:opacity-90 text-background rounded-full text-xs font-semibold shadow-lg transition-all flex items-center gap-1.5 hover:scale-105 duration-200"
            >
              Mostrar Mapa Local
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
