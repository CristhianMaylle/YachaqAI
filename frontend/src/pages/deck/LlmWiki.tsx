import { useEffect, useState, useMemo, lazy, Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Archive, Loader2, Sparkles } from 'lucide-react'
import { fetchGraph } from '@/lib/notebook-api'
import { queryWiki, archiveWikiResponse, type WikiCitation } from '@/lib/wiki-chat-api'
import type { WikiNode, WikiLink } from '@/types'

const ForceGraph = lazy(() =>
  import('@/components/graph/ForceGraph').then((m) => ({ default: m.ForceGraph })),
)

interface Message {
  role: 'user' | 'assistant'
  content: string
  citations?: WikiCitation[]
  canArchive?: boolean
  archived?: boolean
}

export function LlmWiki() {
  const { deckId } = useParams()

  const [graph, setGraph] = useState<{ nodes: WikiNode[]; edges: WikiLink[] } | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hola! Soy el LLM Wiki de **YachaqAI**. Puedo responder preguntas basandome en los conceptos de este mazo, citando las paginas que uso. ¿Que quieres consultar?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [archiving, setArchiving] = useState<number | null>(null)
  const [activeNodeIds, setActiveNodeIds] = useState<string[]>([])

  const suggestions = useMemo(
    () => [
      '¿Cuáles son los conceptos más importantes de este mazo?',
      '¿Qué conceptos tengo con menor retención ahora mismo?',
      'Resume lo que he aprendido hasta ahora',
      '¿Qué debería repasar antes de mi próxima sesión?',
    ],
    [],
  )

  useEffect(() => {
    if (!deckId) return
    fetchGraph(deckId).then((data) => setGraph(data))
  }, [deckId])

  const subGraphData = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] }
    if (activeNodeIds.length === 0) return graph
    const filteredNodes = graph.nodes.filter((n) => activeNodeIds.includes(n.id))
    const nodeIds = new Set(filteredNodes.map((n) => n.id))
    const filteredEdges = graph.edges.filter((e) => {
      const s = typeof e.source === 'object' ? (e.source as any).id : e.source
      const t = typeof e.target === 'object' ? (e.target as any).id : e.target
      return nodeIds.has(s) && nodeIds.has(t)
    })
    return { nodes: filteredNodes, edges: filteredEdges }
  }, [graph, activeNodeIds])

  async function handleSend(text: string) {
    if (!text.trim() || loading || !deckId) return
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const history = newMessages.slice(-8).map((m) => ({ role: m.role, content: m.content }))
      const result = await queryWiki(deckId, text, history)
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: result.answer,
          citations: result.citations,
          canArchive: result.can_archive,
        },
      ])
      if (result.nodes_consulted.length > 0) setActiveNodeIds(result.nodes_consulted)
    } catch (e: any) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `No pude consultar tu wiki: ${e.message}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleArchive(index: number) {
    const msg = messages[index]
    const question = messages[index - 1]?.content ?? ''
    if (!deckId || !msg.citations) return
    setArchiving(index)
    try {
      await archiveWikiResponse({
        deckId,
        question,
        content: msg.content,
        title: question.slice(0, 60),
        sourceFiles: msg.citations.map((c) => c.file),
      })
      setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, archived: true } : m)))
    } catch (e: any) {
      console.error('archive error:', e.message)
    } finally {
      setArchiving(null)
    }
  }

  function handleSuggestionClick(suggestion: string) {
    setInput(suggestion)
    handleSend(suggestion)
  }

  return (
    <div className="h-[calc(100vh-1px)] flex bg-background">
      {/* Left: Chat */}
      <div className="flex-1 flex flex-col border-r border-border bg-background">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
              <span>LLM Wiki</span>
              <span className="text-[10px] font-normal text-cyan bg-cyan/10 px-2 py-0.5 rounded border border-cyan/20">
                Navegacion de grafo
              </span>
            </h1>
            <p className="text-xs text-muted">
              Consulta tu mazo en lenguaje natural — el agente navega el grafo y cita sus fuentes.
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col gap-2 max-w-2xl ${
                msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan text-background shadow-sm'
                    : 'bg-card text-foreground border border-border'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-line">{msg.content}</p>
                ) : (
                  <div
                    className="prose prose-invert prose-xs max-w-none prose-p:my-1 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-strong:text-foreground prose-strong:font-bold prose-headings:text-foreground"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(msg.content) as string) }}
                  />
                )}
              </div>

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {msg.citations.map((cite) => (
                    <Link
                      key={cite.id}
                      to={`/deck/${deckId}/wiki/${cite.file.split('/').map(encodeURIComponent).join('/')}`}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border rounded-lg text-[10px] text-muted font-medium hover:bg-primary/50 hover:text-cyan transition-colors shadow-sm"
                    >
                      <span>{cite.title}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Archive offer */}
              {msg.role === 'assistant' && msg.canArchive && (
                <button
                  onClick={() => handleArchive(index)}
                  disabled={archiving === index || msg.archived}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium border transition-colors disabled:opacity-60 border-cyan/30 text-cyan hover:bg-cyan/10"
                >
                  {archiving === index ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Archive size={11} />
                  )}
                  {msg.archived ? 'Guardado como concepto' : 'Guardar como concepto nuevo'}
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl w-fit animate-pulse">
              <Sparkles size={13} className="text-cyan" />
              <span className="text-[11px] text-muted font-medium ml-1">
                El agente esta navegando tu grafo de conocimiento...
              </span>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-6 py-3 border-t border-border bg-card">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2.5">
              Consultas Sugeridas
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  onClick={() => handleSuggestionClick(sug)}
                  className="px-3 py-1.5 bg-background border border-border hover:border-cyan/40 rounded-full text-[10px] text-muted font-medium hover:text-foreground hover:bg-card transition-colors shadow-sm"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend(input)
            }}
            className="flex gap-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Pregunta algo sobre tu mazo..."
              className="flex-1 px-4 py-3 border border-border bg-card text-foreground rounded-xl text-xs outline-none focus:border-cyan transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-cyan hover:opacity-90 text-background rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>

      {/* Right: Graph Panel */}
      <div className="w-[340px] border-l border-border bg-card flex flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest">
            Subgrafo de Consulta
          </h3>
          <p className="text-[10px] text-muted mt-0.5">
            Nodos consultados por el agente en la ultima respuesta.
          </p>
        </div>
        <div className="flex-1 relative bg-background/50">
          {graph ? (
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center text-muted text-[11px] font-medium">
                  Cargando subgrafo...
                </div>
              }
            >
              <ForceGraph
                deckId={deckId!}
                nodes={subGraphData.nodes}
                edges={subGraphData.edges}
                readOnly={true}
              />
            </Suspense>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted text-[11px] font-medium">
              Cargando subgrafo de contexto...
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border bg-card text-[9px] text-muted leading-relaxed">
          Los nodos mostrados se extraen dinamicamente segun la relevancia calculada por el agente
          (wikilinks, fuentes compartidas y vecinos comunes).
        </div>
      </div>
    </div>
  )
}
