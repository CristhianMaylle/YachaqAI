import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

interface LintIssue {
  id: string
  type: 'orphan' | 'contradiction' | 'missing_page'
  title: string
  description: string
  file: string
  status: 'pending' | 'fixed'
}

export function Health() {
  const { deckId } = useParams()

  const [score, setScore] = useState(87)
  const [running, setRunning] = useState(false)
  const [issues, setIssues] = useState<LintIssue[]>([])

  useEffect(() => {
    if (deckId === 'agentes-de-inteligencia-artificial') {
      setIssues([
        {
          id: 'i1',
          type: 'orphan',
          title: 'Concepto huerfano detectado',
          description:
            "El archivo '3. entidades/langchain.md' no tiene enlaces entrantes en ninguna otra nota del wiki.",
          file: '3. entidades/langchain.md',
          status: 'pending',
        },
        {
          id: 'i2',
          type: 'contradiction',
          title: 'Contradiccion semantica en gobernanza',
          description:
            "Tus notas en '2. conceptos/arquitectura-sbc.md' afirman que las entidades SBC operan de manera autonoma sin supervision, lo cual contradice las directrices de alineacion definidas en '1. introduccion/gobernanza-ia.md'.",
          file: '2. conceptos/arquitectura-sbc.md',
          status: 'pending',
        },
        {
          id: 'i3',
          type: 'missing_page',
          title: 'Pregunta sin concepto asociado',
          description:
            "La pregunta 'Cuestionario: Memoria a Largo Plazo' apunta al concepto '2. conceptos/vector-stores.md', pero este archivo no ha sido creado en el wiki.",
          file: '4. preguntas/q-memoria.md',
          status: 'pending',
        },
      ])
      setScore(78)
    } else {
      setIssues([
        {
          id: 'i1',
          type: 'orphan',
          title: 'Concepto huerfano detectado',
          description:
            "El archivo '3. entidades/ietf.md' no tiene enlaces entrantes en ninguna otra nota del wiki.",
          file: '3. entidades/ietf.md',
          status: 'pending',
        },
        {
          id: 'i2',
          type: 'contradiction',
          title: 'Contradiccion semantica en notas personales',
          description:
            "Tus notas en '2. conceptos/tcp.md' afirman que TCP no asegura el orden de los bytes, lo cual contradice la definicion formal en la especificacion RFC 793 de la IETF.",
          file: '2. conceptos/tcp.md',
          status: 'pending',
        },
        {
          id: 'i3',
          type: 'missing_page',
          title: 'Pregunta sin concepto asociado',
          description:
            "La pregunta 'Cuestionario: Subnetting' apunta al concepto '2. conceptos/subnetting.md', pero este archivo no ha sido creado en el wiki.",
          file: '4. preguntas/q-subnetting.md',
          status: 'pending',
        },
      ])
      setScore(82)
    }
  }, [deckId])

  const handleRunLint = () => {
    setRunning(true)
    setTimeout(() => {
      setIssues((prev) => prev.map((issue) => ({ ...issue, status: 'fixed' as const })))
      setScore(100)
      setRunning(false)
    }, 2000)
  }

  const getIssueBadge = (type: string) => {
    switch (type) {
      case 'orphan':
        return 'bg-srs-en-practica/10 text-srs-en-practica border-srs-en-practica/20'
      case 'contradiction':
        return 'bg-srs-critico/10 text-srs-critico border-srs-critico/20'
      case 'missing_page':
      default:
        return 'bg-cyan/10 text-cyan border-cyan/20'
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="mb-8 border-b border-border pb-4">
        <h1 className="font-heading text-xl font-semibold text-foreground flex items-center gap-2">
          <span>Health Check & Linter</span>
          <span className="text-xs font-normal text-muted bg-card px-2 py-0.5 rounded-md">
            Verificador de Integridad
          </span>
        </h1>
        <p className="text-xs text-muted mt-0.5">
          Analiza wikilinks rotos, notas huerfanas y contradicciones semanticas en tu base de
          conocimiento.
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Health Score */}
        <div className="md:col-span-1 rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">
            Puntaje de Salud
          </h3>
          <div className="relative flex items-center justify-center mb-2">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="var(--color-border, #334155)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke={score === 100 ? 'var(--color-srs-dominado, #22c55e)' : 'var(--color-cyan, #06b6d4)'}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - score / 100)}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-xl font-bold text-foreground">{score}%</span>
          </div>
          <span className="text-[10px] font-semibold text-muted">
            {score === 100 ? 'Integridad del Wiki: Optima' : 'Se requieren correcciones'}
          </span>
        </div>

        {/* Lint Info */}
        <div className="md:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
              Agente de Integridad LINT
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              El motor LINT realiza escaneos de consistencia logica cruzada y analisis de
              referencias. Corrige wikilinks rotos enlazando al concepto correcto y detecta
              afirmaciones contradictorias contra fuentes formales usando IA.
            </p>
          </div>
          <button
            onClick={handleRunLint}
            disabled={running || score === 100}
            className="mt-6 w-full py-2.5 bg-cyan hover:opacity-90 text-background rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {running
              ? 'Corrigiendo problemas semanticos...'
              : score === 100
                ? 'Wiki 100% Saludable'
                : 'Corregir todos los problemas con IA'}
          </button>
        </div>
      </div>

      {/* Loading spinner */}
      {running && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 border border-border rounded-2xl bg-card mb-8">
          <span className="w-8 h-8 border-3 border-cyan border-t-transparent rounded-full animate-spin mb-4" />
          <h3 className="text-sm font-semibold text-foreground animate-pulse">
            Corriendo verificacion semantica profunda
          </h3>
          <p className="text-xs text-muted mt-1 max-w-xs text-center">
            El linter de YachaqAI esta reparando metadatos frontmatter, resolviendo referencias
            rotas y reconciliando tus notas.
          </p>
        </div>
      )}

      {/* Issues list */}
      {!running && (
        <div className="flex-1 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest">
            Incidencias Detectadas ({issues.filter((i) => i.status === 'pending').length})
          </h3>

          {issues.map((issue) => (
            <div
              key={issue.id}
              className={`rounded-xl border p-4 bg-card shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all duration-300 ${
                issue.status === 'fixed'
                  ? 'border-srs-dominado/20 bg-srs-dominado/5 opacity-75'
                  : 'border-border'
              }`}
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold border rounded px-1.5 py-0.5 uppercase tracking-wide ${getIssueBadge(issue.type)}`}
                  >
                    {issue.type.replace('_', ' ')}
                  </span>
                  <h4 className="text-xs font-bold text-foreground">{issue.title}</h4>
                </div>
                <p className="text-xs text-muted leading-relaxed">{issue.description}</p>
                <span className="text-[10px] text-muted block font-mono">Ruta: {issue.file}</span>
              </div>

              <div className="flex-shrink-0">
                {issue.status === 'fixed' ? (
                  <span className="px-3 py-1 bg-srs-dominado/10 text-srs-dominado font-bold border border-srs-dominado/20 rounded-full text-[10px] flex items-center gap-1.5 shadow-sm">
                    <span>✓</span> Corregido
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-srs-en-practica/10 text-srs-en-practica font-bold border border-srs-en-practica/20 rounded-full text-[10px] flex items-center gap-1.5 shadow-sm animate-pulse">
                    Pendiente
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
