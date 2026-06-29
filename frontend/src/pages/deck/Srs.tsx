import { useEffect, useState, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { fetchNotebook, gradeSrs } from '@/lib/notebook-api'

interface QA {
  q: string
  a: string
}

interface SRSCard {
  pageId: string
  title: string
  file: string
  conceptoAsociado: string
  subtipo: string
  qas: QA[]
}

export function Review() {
  const { deckId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const moduleFilter = searchParams.get('module')

  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<SRSCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)

  const [evaluating, setEvaluating] = useState(false)
  const [evalReport, setEvalReport] = useState<any>(null)
  const [savingGrade, setSavingGrade] = useState(false)

  useEffect(() => {
    if (!deckId) return
    fetchNotebook(deckId).then((data) => {
      const questionPages = data.pages.filter((p: any) => p.type === 'pregunta')
      const conceptPages = data.pages.filter((p: any) => p.type === 'concepto')

      let parsedCards = questionPages.map((p: any) => {
        let conceptoAsociado = ''
        if (p.frontmatter.concepto_asociado) {
          const parts = p.frontmatter.concepto_asociado.split('/')
          conceptoAsociado = parts[parts.length - 1].replace('.md', '')
        }

        const qaParts = p.content.split(/##\s+Pregunta\s+\d+/i)
        const qas: QA[] = []
        for (let i = 1; i < qaParts.length; i++) {
          const part = qaParts[i]
          const match = part.match(/>\s*Respuesta:\s*(.*)/i)
          if (match) {
            const qText = part.split(/>\s*Respuesta:/i)[0].trim()
            const aText = match[1].trim()
            qas.push({ q: qText, a: aText })
          }
        }
        return {
          pageId: p.page_id,
          title: p.title,
          file: p.file,
          conceptoAsociado,
          subtipo: p.frontmatter.subtipo_cuestionario || 'conceptual',
          qas,
        }
      })

      if (moduleFilter) {
        parsedCards = parsedCards.filter((card: any) => {
          const assoc = conceptPages.find(
            (c: any) =>
              c.page_id === `concepto-${card.conceptoAsociado}` ||
              c.page_id === card.conceptoAsociado,
          )
          return assoc?.frontmatter?.modulo === moduleFilter
        })
      }

      setCards(parsedCards)
      setLoading(false)
    })
  }, [deckId, moduleFilter])

  const currentCard = useMemo(() => {
    if (cards.length === 0 || currentIndex >= cards.length) return null
    return cards[currentIndex]
  }, [cards, currentIndex])

  /* Mock AI evaluator */
  const handleEvaluate = () => {
    if (!userAnswer.trim()) return
    setEvaluating(true)
    setEvalReport(null)

    setTimeout(() => {
      const ans = userAnswer.toLowerCase()
      let coverage = ['Menciono el concepto base', 'Respuesta escrita con coherencia']
      let missed: string[] = []
      let suggestion = 'bien'
      let tip = 'Revisa los detalles estructurales del concepto.'
      let just = 'Respuesta correcta y concisa. Abarca el nucleo del concepto.'

      if (currentCard?.conceptoAsociado === 'three-way-handshake') {
        const hasSyn = ans.includes('syn')
        const hasAck = ans.includes('ack')
        if (hasSyn && hasAck) {
          coverage.push('Identifico correctamente el envio de SYN y ACK')
          coverage.push('Explico el orden de establecimiento')
          suggestion = 'excelente'
          tip = 'Excelente comprension. Puedes revisar tiempos RTT en el material de lectura.'
          just = 'Menciono todas las fases del handshake (SYN, SYN-ACK, ACK) de forma clara.'
        } else {
          missed.push('No detallo el orden de las senales SYN y ACK')
          suggestion = 'dificil'
          tip = 'Intenta memorizar las 3 senales: SYN, SYN-ACK y luego ACK.'
          just = 'Falta precision sobre los nombres especificos de los flags de control.'
        }
      } else if (currentCard?.conceptoAsociado === 'dns') {
        const hasIp = ans.includes('ip') || ans.includes('numer')
        const hasName = ans.includes('nombre') || ans.includes('domin')
        if (hasIp && hasName) {
          coverage.push('Explico la traduccion de nombres a IPs')
          coverage.push('Menciono la utilidad del servicio')
          suggestion = 'bien'
          tip = 'Prueba a profundizar en el modelo jerarquico (nodos raiz, TLD, autoritativos).'
        } else {
          missed.push('No aclaro que mapea nombres de dominio a direcciones IP')
          suggestion = 'olvidado'
          tip = "El DNS actua como las 'paginas amarillas' de internet. Traduce google.com a su IP."
        }
      } else {
        if (ans.length > 30) {
          coverage.push('Aporto explicaciones secundarias interesantes')
          suggestion = 'bien'
        } else {
          missed.push('Respuesta muy breve, expande mas tu explicacion')
          suggestion = 'dificil'
        }
      }

      setEvalReport({
        ideas_cubiertas: coverage,
        ideas_omitidas: missed,
        calificacion_sugerida: suggestion,
        justificacion: just,
        tip_de_estudio: tip,
      })
      setEvaluating(false)
      setShowAnswer(true)
    }, 1500)
  }

  /* Submit SRS grade */
  const handleGrade = async (grade: 'excelente' | 'bien' | 'dificil' | 'olvidado') => {
    if (!currentCard || !deckId) return
    setSavingGrade(true)
    try {
      const res = await gradeSrs(deckId, currentCard.conceptoAsociado, grade)
      if (res.ok) {
        setUserAnswer('')
        setShowAnswer(false)
        setEvalReport(null)
        setCurrentIndex((prev) => prev + 1)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSavingGrade(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[60vh] text-muted animate-pulse font-medium">
        Cargando cola de repeticion...
      </div>
    )
  }

  /* Session complete */
  if (cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 bg-srs-dominado/10 text-srs-dominado rounded-full flex items-center justify-center text-3xl mb-6 shadow-sm border border-srs-dominado/20">
          ✓
        </div>
        <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
          Sesion de repaso completada!
        </h1>
        <p className="text-muted text-sm max-w-md mb-8">
          Has repasado todas las flashcards activas en este cuaderno. Tu curva de olvido FSRS se ha
          actualizado.
        </p>
        <div className="flex gap-4">
          <Link
            to={`/deck/${deckId}/dashboard`}
            className="px-5 py-2.5 rounded-lg bg-cyan text-background text-xs font-semibold hover:opacity-90 transition-colors shadow-sm"
          >
            Ir al Dashboard
          </Link>
          <Link
            to={`/deck/${deckId}/graph`}
            className="px-5 py-2.5 rounded-lg border border-border bg-card text-foreground text-xs font-semibold hover:bg-primary/50 transition-colors shadow-sm"
          >
            Ver Grafo Semaforo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground flex items-center gap-2">
            <span>
              {moduleFilter
                ? `Cuestionario Modulo: ${moduleFilter.replace(/-/g, ' ').toUpperCase()}`
                : 'Repaso Espaciado'}
            </span>
            <span className="text-xs font-normal text-muted bg-card px-2 py-0.5 rounded-md">
              FSRS v5
            </span>
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Evaluacion inteligente mediante Agente de IA Evaluador.
          </p>
        </div>
        <span className="text-xs font-mono font-semibold text-cyan bg-cyan/10 px-2.5 py-1 rounded-full border border-cyan/20">
          Tarjeta {currentIndex + 1} de {cards.length}
        </span>
      </div>

      {/* Card Body */}
      {currentCard && (
        <div className="flex-1 flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
            {/* Category Header */}
            <div className="px-6 py-4 bg-card border-b border-border flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                Concepto: {currentCard.conceptoAsociado.replace(/-/g, ' ')}
              </span>
              <span className="text-[10px] font-semibold text-cyan bg-cyan/10 px-2 py-0.5 rounded-md border border-cyan/20 uppercase">
                {currentCard.subtipo}
              </span>
            </div>

            {/* QA Content */}
            <div className="p-6 flex-1 flex flex-col gap-6">
              <div className="space-y-4">
                {currentCard.qas.map((qa, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {index + 1}. {qa.q}
                    </h3>
                    {!showAnswer ? (
                      <textarea
                        placeholder="Escribe tu respuesta aqui para que el tutor de IA la evalue..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={evaluating}
                        className="w-full min-h-[80px] p-3 text-xs border border-border rounded-xl bg-background text-foreground outline-none focus:border-cyan transition-colors resize-none disabled:opacity-50"
                      />
                    ) : (
                      <div className="p-3 bg-card rounded-xl border border-border text-xs">
                        <span className="font-semibold text-srs-dominado block mb-1">
                          Respuesta Esperada:
                        </span>
                        <p className="text-foreground font-medium">{qa.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* AI Evaluator loading */}
              {evaluating && (
                <div className="p-5 border border-cyan/20 bg-cyan/5 rounded-xl flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-cyan font-semibold animate-pulse">
                    Tutor Evaluador IA analizando cobertura y precision...
                  </span>
                </div>
              )}

              {/* Eval Report */}
              {evalReport && (
                <div className="p-5 border border-border bg-card rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      Reporte del Tutor IA
                    </span>
                    <span className="text-[10px] font-bold text-muted uppercase">
                      Sugerencia:{' '}
                      <span className="text-cyan capitalize font-extrabold">
                        {evalReport.calificacion_sugerida}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <span className="font-semibold text-foreground block">Ideas cubiertas:</span>
                      <ul className="space-y-1">
                        {evalReport.ideas_cubiertas.map((idea: string, i: number) => (
                          <li key={i} className="text-muted flex items-start gap-1.5">
                            <span className="text-srs-dominado font-bold">✓</span>
                            {idea}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {evalReport.ideas_omitidas.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-semibold text-foreground block">
                          Puntos omitidos:
                        </span>
                        <ul className="space-y-1">
                          {evalReport.ideas_omitidas.map((idea: string, i: number) => (
                            <li key={i} className="text-muted flex items-start gap-1.5">
                              <span className="text-srs-en-practica font-bold">!</span>
                              {idea}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-border" />

                  <div className="text-xs">
                    <span className="font-semibold text-foreground block mb-1">
                      Justificacion del Tutor:
                    </span>
                    <p className="text-muted italic">{evalReport.justificacion}</p>
                  </div>

                  <div className="text-xs bg-background p-2.5 rounded-lg border border-border">
                    <span className="font-semibold text-foreground block mb-0.5">
                      Tip de Estudio:
                    </span>
                    <p className="text-muted">{evalReport.tip_de_estudio}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions / SRS Buttons */}
          <div className="flex justify-end gap-3 pb-8">
            {!showAnswer && !evalReport && (
              <button
                onClick={handleEvaluate}
                disabled={!userAnswer.trim() || evaluating}
                className="px-6 py-3 bg-cyan text-background rounded-xl text-xs font-semibold hover:opacity-90 transition-colors shadow-sm disabled:opacity-50"
              >
                Enviar para Evaluacion IA
              </button>
            )}

            {showAnswer && (
              <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    id: 'olvidado',
                    label: 'Olvidado',
                    desc: 'repaso urgente',
                    color: 'bg-srs-critico/10 text-srs-critico border-srs-critico/20 hover:bg-srs-critico/20',
                  },
                  {
                    id: 'dificil',
                    label: 'Dificil',
                    desc: 'repasar en 3d',
                    color:
                      'bg-srs-en-practica/10 text-srs-en-practica border-srs-en-practica/20 hover:bg-srs-en-practica/20',
                  },
                  {
                    id: 'bien',
                    label: 'Bien',
                    desc: 'repasar en 7d',
                    color: 'bg-cyan/10 text-cyan border-cyan/20 hover:bg-cyan/20',
                  },
                  {
                    id: 'excelente',
                    label: 'Excelente',
                    desc: 'repasar en 21d',
                    color:
                      'bg-srs-dominado/10 text-srs-dominado border-srs-dominado/20 hover:bg-srs-dominado/20',
                  },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => handleGrade(btn.id as any)}
                    disabled={savingGrade}
                    className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all shadow-sm ${btn.color}`}
                  >
                    <span className="font-bold text-xs">{btn.label}</span>
                    <span className="text-[9px] opacity-80 mt-0.5">{btn.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
