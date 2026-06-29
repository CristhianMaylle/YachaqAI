import { useEffect, useState, useMemo, lazy, Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { marked } from 'marked'
import { fetchGraph } from '@/lib/notebook-api'
import type { WikiNode, WikiLink } from '@/types'

const ForceGraph = lazy(() =>
  import('@/components/graph/ForceGraph').then((m) => ({ default: m.ForceGraph })),
)

interface Message {
  role: 'user' | 'assistant'
  content: string
  citations?: { id: string; file: string; title: string }[]
  steps?: string[]
  nodesQuery?: string[]
}

export function LlmWiki() {
  const { deckId } = useParams()

  const [graph, setGraph] = useState<{ nodes: WikiNode[]; edges: WikiLink[] } | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hola! Soy tu asistente pedagogico de **YachaqAI**. Puedo responder preguntas complejas basandome en los apuntes de tu cuaderno y visualizar los conceptos relacionados en el panel lateral. De que te gustaria aprender hoy?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeNodeIds, setActiveNodeIds] = useState<string[]>([])

  const suggestions = useMemo(() => {
    if (deckId === 'agentes-de-inteligencia-artificial') {
      return [
        'Que es la IA Agentica y como se diferencia de los chatbots?',
        'Explica los componentes de la Arquitectura de un Agente Moderno.',
        'Que frameworks se utilizan para la Orquestacion de Agentes?',
        'Cuales son los desafios eticos y de Gobernanza de IA?',
      ]
    }
    return [
      'Cual es la diferencia entre TCP y UDP?',
      'Como funciona el proceso de Three-Way Handshake?',
      'Que es subnetting y por que es util?',
      'Que es el DNS y sobre que protocolo de transporte corre?',
    ]
  }, [deckId])

  useEffect(() => {
    if (!deckId) return
    fetchGraph(deckId).then((data) => {
      setGraph(data)
      const overviewNodes = data.nodes
        .filter((n: any) => n.group === 'overview' || n.category === 'Fundamentos')
        .map((n: any) => n.id)
      setActiveNodeIds(overviewNodes)
    })
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

  const handleSend = (text: string) => {
    if (!text.trim() || loading) return
    const newMessages = [...messages, { role: 'user', content: text } as Message]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    setTimeout(() => {
      const query = text.toLowerCase()
      let response = ''
      let citations: { id: string; file: string; title: string }[] = []
      let steps: string[] = []
      let queriedNodes: string[] = []

      if (deckId === 'agentes-de-inteligencia-artificial') {
        if (query.includes('agentica') || query.includes('agentica') || query.includes('chatbot')) {
          response =
            'La **IA Agentica (Agentic AI)** representa el paso de sistemas de Inteligencia Artificial reactivos (como chatbots que responden comandos fijos) a entidades proactivas y autonomas. Estos agentes pueden razonar sobre una meta general, descomponerla en planes, tomar decisiones independientes y ejecutar acciones reales usando herramientas externas sin requerir intervencion constante.\n\nSus componentes principales incluyen:\n* **LLM Core (Cerebro)**: Para razonar y tomar decisiones.\n* **Planificacion Dinamica**: Ajustar la ruta si cambian las condiciones.\n* **Llamada a herramientas (Tool-calling)**: Conectarse a APIs o bases de datos.'
          citations = [
            { id: 'concepto-ia-agentica', file: '2. conceptos/ia-agentica.md', title: 'IA Agentica' },
            { id: 'concepto-agentes-conversacionales-avanzados', file: '2. conceptos/agentes-conversacionales-avanzados.md', title: 'Agentes Conversacionales Avanzados' },
          ]
          steps = [
            'Busqueda vectorial: "IA Agentica vs chatbot" con similitud 0.96.',
            'Expansion de subgrafo: Recuperando relaciones a "Automatizacion Proactiva".',
            'Lectura de apuntes: Cargando archivos de conceptos e ideas clave de Fundamentos.',
            'Sintesis con LLM: Agrupando comparaciones sobre el cambio a sistemas activos.',
          ]
          queriedNodes = ['concepto-ia-agentica', 'concepto-agentes-conversacionales-avanzados', 'concepto-automatizacion-proactiva']
        } else if (query.includes('arquitectura') || query.includes('componentes') || query.includes('estructura')) {
          response =
            'La **Arquitectura de un Agente de IA Moderno** se compone de cinco pilares fundamentales que interactuan de forma continua:\n\n1. **El Cerebro (LLM)**: Procesa informacion y razona.\n2. **Memoria**: Memoria a corto plazo (el contexto del chat) y memoria a largo plazo (almacenamiento vectorial RAG).\n3. **Planificacion y Razonamiento**: Descomposicion de problemas (e.g. Chain of Thought) y auto-reflexion.\n4. **Uso de Herramientas (Tool-calling)**: APIs, scripts o bases de datos externas.\n5. **Percepcion y Accion**: Modulos que captan el entorno (sensores) y actuan sobre el (actuadores).'
          citations = [
            { id: 'concepto-arquitectura-de-agente-de-ia-moderno', file: '2. conceptos/arquitectura-de-agente-de-ia-moderno.md', title: 'Arquitectura de Agente Moderno' },
            { id: 'concepto-uso-de-herramientas-tool-calling', file: '2. conceptos/uso-de-herramientas-tool-calling.md', title: 'Uso de Herramientas' },
          ]
          steps = [
            'Busqueda vectorial: "Arquitectura de Agente" con similitud 0.98.',
            'Expansion de subgrafo: Conexiones a "Tool Calling" e "Interfaz Sintaxis-Semantica".',
            'Lectura de apuntes: Analizando la anatomia del agente del archivo "arquitectura-de-agente-de-ia-moderno.md".',
            'Sintesis con LLM: Estructurando el desglose de los componentes de agentes.',
          ]
          queriedNodes = ['concepto-arquitectura-de-agente-de-ia-moderno', 'concepto-uso-de-herramientas-tool-calling', 'concepto-interfaz-sintaxis-semantica']
        } else if (query.includes('orquestacion') || query.includes('frameworks') || query.includes('langgraph') || query.includes('crewai')) {
          response =
            'La **Orquestacion de Agentes** se refiere a la coordinacion de multiples agentes especializados que colaboran para resolver problemas complejos a gran escala.\n\nLos frameworks mas populares son:\n* **LangGraph**: Construye flujos circulares y ciclicos usando grafos dirigidos.\n* **CrewAI**: Disena dinamicas colaborativas basadas en roles y tareas.\n* **AutoGen**: Permite conversaciones multiagente flexibles.\n\nPara plataformas empresariales, destacan soluciones como Microsoft Copilot Studio, Salesforce Agentforce e IBM watsonx.'
          citations = [
            { id: 'concepto-orquestacion-de-agentes', file: '2. conceptos/orquestacion-de-agentes.md', title: 'Orquestacion de Agentes' },
            { id: 'concepto-planificacion-dinamica', file: '2. conceptos/planificacion-dinamica.md', title: 'Planificacion Dinamica' },
          ]
          steps = [
            'Busqueda vectorial: "Orquestacion de Agentes y frameworks" con similitud 0.95.',
            'Expansion de subgrafo: Trayectos a "Planificacion Dinamica" y "Estabilidad Translinguistica".',
            'Lectura de apuntes: Cargando notas sobre LangGraph y CrewAI del archivo del concepto.',
            'Sintesis con LLM: Estructurando comparaciones entre frameworks multiagente.',
          ]
          queriedNodes = ['concepto-orquestacion-de-agentes', 'concepto-planificacion-dinamica', 'concepto-capacidad-referencial']
        } else if (query.includes('gobernanza') || query.includes('etica') || query.includes('desviacion') || query.includes('riesgos')) {
          response =
            'La **Gobernanza de IA** es el conjunto de reglas y marcos eticos para el desarrollo y despliegue seguro de agentes de IA autonomos. Sus mayores desafios incluyen:\n\n1. **Desviacion de la linea base humana**: Cuanto difiere el criterio del agente respecto al juicio de un experto humano.\n2. **Mapeo conceptual a la realidad**: Asegurar que las suposiciones y modelos logicos del agente coincidan con la fisica y restricciones reales.\n3. **Responsabilidad legal**: Quien asume las consecuencias de decisiones autonomas erroneas.\n4. **Estabilidad translinguistica**: Que las politicas eticas del agente no se degraden al operar en diferentes lenguajes.'
          citations = [
            { id: 'concepto-gobernanza-de-ia', file: '2. conceptos/gobernanza-de-ia.md', title: 'Gobernanza de IA' },
            { id: 'concepto-desviacion-de-la-linea-base-humana', file: '2. conceptos/desviacion-de-la-linea-base-humana.md', title: 'Desviacion de la Linea Base Humana' },
            { id: 'concepto-mapeo-conceptual-a-la-realidad', file: '2. conceptos/mapeo-conceptual-a-la-realidad.md', title: 'Mapeo Conceptual a la Realidad' },
          ]
          steps = [
            'Busqueda vectorial: "Gobernanza y etica en agentes" con similitud 0.93.',
            'Expansion de subgrafo: Caminos a "Desviacion" y "Mapeo conceptual a la realidad".',
            'Lectura de apuntes: Leyendo directrices regulatorias de "gobernanza-de-ia.md".',
            'Sintesis con LLM: Extrayendo puntos clave eticos y tecnicos.',
          ]
          queriedNodes = ['concepto-gobernanza-de-ia', 'concepto-desviacion-de-la-linea-base-humana', 'concepto-mapeo-conceptual-a-la-realidad']
        } else {
          response = 'No tengo notas especificas sobre eso en este cuaderno. Sin embargo, basandome en el contexto de agentes de IA, puedo sugerirte revisar los conceptos de Fundamentos de IA, Arquitecturas, Orquestacion o Evaluacion y Gobernanza.'
          citations = [{ id: 'overview-agentes-ia', file: 'overview.md', title: 'Vision General' }]
          steps = [
            'Busqueda vectorial: Busqueda fallida. Similitud semantica inferior a 0.60.',
            'Expansion de subgrafo: Cargando nodos principales del indice de IA.',
            'Lectura de apuntes: Leyendo overview.md del mazo.',
            'Sintesis con LLM: Proponiendo temas alternativos de IA Agentica.',
          ]
          queriedNodes = ['concepto-ia-agentica', 'concepto-agentes-conversacionales-avanzados', 'concepto-gobernanza-de-ia']
        }
      } else {
        if (query.includes('handshake') || query.includes('saludo')) {
          response =
            'El **Three-Way Handshake** (saludo de tres vias) es el mecanismo de establecimiento de conexion en TCP. Consta de tres pasos:\n\n1. **SYN**: El cliente envia un segmento con el flag SYN activo.\n2. **SYN-ACK**: El servidor responde con SYN activo y un ACK.\n3. **ACK**: El cliente envia un segmento final de confirmacion.\n\nEsto garantiza que ambas partes esten listas para transmitir datos confiables.'
          citations = [
            { id: 'concepto-three-way-handshake', file: '2. conceptos/three-way-handshake.md', title: 'Three-Way Handshake' },
            { id: 'concepto-tcp', file: '2. conceptos/tcp.md', title: 'Protocolo TCP' },
          ]
          steps = [
            'Busqueda vectorial: "Three-way Handshake" matcheado con similitud 0.94.',
            'Expansion de subgrafo: Siguiendo enlaces hacia "TCP" y "Puertos".',
            'Lectura de apuntes: Cargados archivos de conceptos asociados.',
            'Sintesis con LLM: Agrupando respuestas sobre el handshake de tres vias.',
          ]
          queriedNodes = ['concepto-three-way-handshake', 'concepto-tcp', 'concepto-puertos']
        } else if (query.includes('dns') || query.includes('nombre')) {
          response =
            'El **DNS** (Domain Name System) es el protocolo de capa de aplicacion que actua como la libreta de direcciones de Internet, traduciendo nombres de dominio legibles por humanos (ej. `google.com`) a direcciones IP numericas.\n\nEl servicio DNS se ejecuta principalmente sobre UDP en el puerto 53 para reducir la latencia de resolucion.'
          citations = [
            { id: 'concepto-dns', file: '2. conceptos/dns.md', title: 'DNS' },
            { id: 'concepto-tcp-ip', file: '2. conceptos/tcp-ip.md', title: 'Modelo TCP/IP' },
          ]
          steps = [
            'Busqueda vectorial: "DNS" matcheado con similitud 0.97.',
            'Expansion de subgrafo: Navegando arista "usa" -> "capa-aplicacion".',
            'Lectura de apuntes: Cargando "dns.md" para contexto de puertos.',
            'Sintesis con LLM: Generando resumen sobre servicios de resolucion de nombres.',
          ]
          queriedNodes = ['concepto-dns', 'concepto-http', 'concepto-tls']
        } else if (query.includes('tcp') || query.includes('udp') || query.includes('transporte')) {
          response =
            'La diferencia principal entre **TCP** y **UDP** radica en la confiabilidad de la conexion:\n\n* **TCP (Transmission Control Protocol)**: Es orientado a conexion, confiable, garantiza el orden de llegada de los paquetes.\n* **UDP (User Datagram Protocol)**: No esta orientado a conexion, es rapido, tiene muy bajo overhead y no garantiza la entrega de paquetes.'
          citations = [
            { id: 'concepto-tcp', file: '2. conceptos/tcp.md', title: 'TCP' },
            { id: 'concepto-udp', file: '2. conceptos/udp.md', title: 'UDP' },
            { id: 'concepto-control-congestion', file: '2. conceptos/control-congestion.md', title: 'Control de Congestion' },
          ]
          steps = [
            'Busqueda vectorial: "TCP vs UDP" matcheado en Capa de Transporte.',
            'Expansion de subgrafo: Subgrafo de transporte recuperado (5 nodos).',
            'Lectura de apuntes: Analizando diferencias estructurales y control de flujo.',
            'Sintesis con LLM: Comparando caracteristicas de protocolos de transporte.',
          ]
          queriedNodes = ['concepto-tcp', 'concepto-udp', 'concepto-puertos', 'concepto-control-congestion', 'concepto-three-way-handshake']
        } else if (query.includes('subnetting') || query.includes('red') || query.includes('ip')) {
          response =
            'El **Subnetting** es el proceso de dividir una red fisica en varias subredes logicas mas pequenas. Es util por tres razones:\n\n1. **Eficiencia**: Minimiza el desperdicio de direcciones IP.\n2. **Seguridad**: Aisla el trafico entre diferentes subredes.\n3. **Rendimiento**: Reduce el tamano de los dominios de broadcast.'
          citations = [
            { id: 'concepto-subnetting', file: '2. conceptos/subnetting.md', title: 'Subnetting' },
            { id: 'concepto-ipv4', file: '2. conceptos/ipv4.md', title: 'IPv4' },
            { id: 'concepto-mascara-subred', file: '2. conceptos/mascara-subred.md', title: 'Mascara de Subred' },
          ]
          steps = [
            'Busqueda vectorial: "Subnetting" matcheado con similitud 0.92.',
            'Expansion de subgrafo: Nodos conectados "IPv4", "Mascara" y "Routing".',
            'Lectura de apuntes: Cargando archivos conceptuales de Capa de Red.',
            'Sintesis con LLM: Generando explicaciones de subnetting y direccionamiento.',
          ]
          queriedNodes = ['concepto-subnetting', 'concepto-ipv4', 'concepto-mascara-subred', 'concepto-routing', 'concepto-ospf']
        } else {
          response = 'No tengo notas especificas sobre eso en este cuaderno. Sin embargo, basandome en el contexto de redes, puedo sugerirte revisar los conceptos de Capas del Modelo OSI, Stack TCP/IP o Protocolos de Aplicacion.'
          citations = [{ id: 'concepto-modelo-osi', file: '2. conceptos/modelo-osi.md', title: 'Modelo OSI' }]
          steps = [
            'Busqueda vectorial: Busqueda fallida. Umbral de similitud inferior a 0.60.',
            'Expansion de subgrafo: Recuperando nodos centrales del cuaderno.',
            'Lectura de apuntes: Cargado index.md principal.',
            'Sintesis con LLM: Sugiriendo temas alternativos.',
          ]
          queriedNodes = ['concepto-modelo-osi', 'concepto-tcp-ip', 'concepto-topologias-red', 'concepto-medios-transmision']
        }
      }

      setMessages([
        ...newMessages,
        { role: 'assistant', content: response, citations, steps, nodesQuery: queriedNodes },
      ])
      if (queriedNodes.length > 0) setActiveNodeIds(queriedNodes)
      setLoading(false)
    }, 2000)
  }

  const handleSuggestionClick = (suggestion: string) => {
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
              <span>LLM Wiki Chat</span>
              <span className="text-[10px] font-normal text-cyan bg-cyan/10 px-2 py-0.5 rounded border border-cyan/20">
                Agentic RAG
              </span>
            </h1>
            <p className="text-xs text-muted">
              Haz preguntas para consultar las notas del cuaderno usando RAG semantico.
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
                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
                  />
                )}
              </div>

              {/* RAG trace steps */}
              {msg.steps && msg.steps.length > 0 && (
                <details className="w-full text-[10px] text-muted bg-card border border-border rounded-lg p-2.5 cursor-pointer outline-none hover:bg-primary/30 transition-colors">
                  <summary className="font-semibold select-none text-foreground">
                    Ver traza del Agente RAG ({msg.steps.length} pasos)
                  </summary>
                  <ul className="mt-2 space-y-1.5 pl-1.5 border-l border-border">
                    {msg.steps.map((step, sIdx) => (
                      <li key={sIdx} className="font-mono leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {msg.citations.map((cite, cIdx) => (
                    <Link
                      key={cIdx}
                      to={`/deck/${deckId}/wiki/${cite.file.split('/').map(encodeURIComponent).join('/')}`}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border rounded-lg text-[10px] text-muted font-medium hover:bg-primary/50 hover:text-cyan transition-colors shadow-sm"
                    >
                      <span>{cite.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl w-fit animate-pulse">
              <span className="w-2.5 h-2.5 bg-cyan rounded-full animate-bounce" />
              <span className="w-2.5 h-2.5 bg-cyan rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2.5 h-2.5 bg-cyan rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-muted font-medium ml-1">
                IA procesando y consultando subgrafo...
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
              placeholder="Pregunta algo sobre tu cuaderno..."
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
            Nodos del conocimiento consultados en tiempo real.
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
          Los nodos mostrados se extraen dinamicamente utilizando el analisis RAG sobre tu base de
          conocimiento.
        </div>
      </div>
    </div>
  )
}
