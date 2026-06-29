import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface StudySlot {
  day: string
  time: string
  duration: number
  label: string
  type: 'repaso' | 'nuevo' | 'mixto'
  details: string[]
}

export function Schedule() {
  const { deckId } = useParams()
  const navigate = useNavigate()

  const [availability, setAvailability] = useState(
    'Tengo libres los martes y jueves de 8:00 PM a 9:00 PM y los sabados de 9:00 AM a 12:00 PM.',
  )
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState<StudySlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<StudySlot | null>(null)

  const [editingSlot, setEditingSlot] = useState<(StudySlot & { originalIndex: number }) | null>(
    null,
  )
  const [addingToDay, setAddingToDay] = useState<string | null>(null)
  const [newSlot, setNewSlot] = useState<StudySlot | null>(null)

  useEffect(() => {
    if (deckId === 'agentes-de-inteligencia-artificial') {
      setPlan([
        {
          day: 'Martes',
          time: '20:00 - 21:00',
          duration: 60,
          label: 'Fundamentos de Agentes de IA (Modulo 1)',
          type: 'mixto',
          details: [
            'Repaso FSRS: Activacion inicial de conceptos (5 min)',
            'Lectura activa: IA Agentica & Agentes Conversacionales (35 min)',
            'Cuestionario rapido de comprension (20 min)',
          ],
        },
        {
          day: 'Jueves',
          time: '20:00 - 21:00',
          duration: 60,
          label: 'Arquitecturas y Protocolos (Modulo 2)',
          type: 'nuevo',
          details: [
            'Repaso FSRS: 1 concepto en consolidacion (5 min)',
            'Lectura activa: Arquitectura de Agente de IA Moderno (40 min)',
            'Practica de Tool Calling & Sintaxis (15 min)',
          ],
        },
        {
          day: 'Sabado',
          time: '09:00 - 12:00',
          duration: 180,
          label: 'Orquestacion Multiagente & Practica',
          type: 'mixto',
          details: [
            'Repaso FSRS: Tarjetas vencidas (15 min)',
            'Lectura profunda: Orquestacion de Agentes con LangGraph (60 min)',
            'Caso practico: Planificacion Dinamica (45 min)',
            'Cuestionario interactivo del modulo (30 min)',
            'Sesion de retroalimentacion con tutor IA (30 min)',
          ],
        },
      ])
    } else {
      setPlan([
        {
          day: 'Martes',
          time: '20:00 - 21:00',
          duration: 60,
          label: 'Capa Fisica & Enlace (Modulo 2)',
          type: 'mixto',
          details: [
            'Repaso FSRS: 5 conceptos vencidos (5-10 min)',
            'Lectura activa: Ethernet (20 min)',
            'Lectura activa: Direccion MAC (20 min)',
            'Quiz rapido de comprension (10 min)',
          ],
        },
        {
          day: 'Jueves',
          time: '20:00 - 21:00',
          duration: 60,
          label: 'Capa de Red: Routing (Modulo 3)',
          type: 'nuevo',
          details: [
            'Repaso FSRS: 2 conceptos vencidos (5 min)',
            'Lectura activa: Routing e IPv4 (30 min)',
            'Lectura activa: Subnetting y Mascara (15 min)',
            'Simulacion de laboratorio (10 min)',
          ],
        },
        {
          day: 'Sabado',
          time: '09:00 - 12:00',
          duration: 180,
          label: 'Capa de Transporte & Sesion Extendida',
          type: 'mixto',
          details: [
            'Repaso FSRS: Todo al dia (15 min)',
            'Lectura profunda: Protocolo TCP & UDP (45 min)',
            'Practica: Three-Way Handshake (30 min)',
            'Anotaciones personales en editor dual (30 min)',
            'Cuestionario general del modulo (30 min)',
            'Sesion de retroalimentacion con tutor IA (30 min)',
          ],
        },
      ])
    }
  }, [deckId])

  const handleGeneratePlan = () => {
    setGenerating(true)
    setTimeout(() => {
      // Re-set the same plan (mock regeneration)
      if (deckId === 'agentes-de-inteligencia-artificial') {
        setPlan([
          {
            day: 'Martes',
            time: '20:00 - 21:00',
            duration: 60,
            label: 'Fundamentos de Agentes de IA (Modulo 1)',
            type: 'mixto',
            details: [
              'Repaso FSRS: Activacion inicial de conceptos (5 min)',
              'Lectura activa: IA Agentica & Agentes Conversacionales (35 min)',
              'Cuestionario rapido de comprension (20 min)',
            ],
          },
          {
            day: 'Jueves',
            time: '20:00 - 21:00',
            duration: 60,
            label: 'Arquitecturas y Protocolos (Modulo 2)',
            type: 'nuevo',
            details: [
              'Repaso FSRS: 1 concepto en consolidacion (5 min)',
              'Lectura activa: Arquitectura de Agente de IA Moderno (40 min)',
              'Practica de Tool Calling & Sintaxis (15 min)',
            ],
          },
          {
            day: 'Sabado',
            time: '09:00 - 12:00',
            duration: 180,
            label: 'Orquestacion Multiagente & Practica',
            type: 'mixto',
            details: [
              'Repaso FSRS: Tarjetas vencidas (15 min)',
              'Lectura profunda: Orquestacion de Agentes con LangGraph (60 min)',
              'Caso practico: Planificacion Dinamica (45 min)',
              'Cuestionario interactivo del modulo (30 min)',
              'Sesion de retroalimentacion con tutor IA (30 min)',
            ],
          },
        ])
      } else {
        setPlan([
          {
            day: 'Martes',
            time: '20:00 - 21:00',
            duration: 60,
            label: 'Capa Fisica & Enlace (Modulo 2)',
            type: 'mixto',
            details: [
              'Repaso FSRS: 5 conceptos vencidos (5-10 min)',
              'Lectura activa: Ethernet (20 min)',
              'Lectura activa: Direccion MAC (20 min)',
              'Quiz rapido de comprension (10 min)',
            ],
          },
          {
            day: 'Jueves',
            time: '20:00 - 21:00',
            duration: 60,
            label: 'Capa de Red: Routing (Modulo 3)',
            type: 'nuevo',
            details: [
              'Repaso FSRS: 2 conceptos vencidos (5 min)',
              'Lectura activa: Routing e IPv4 (30 min)',
              'Lectura activa: Subnetting y Mascara (15 min)',
              'Simulacion de laboratorio (10 min)',
            ],
          },
          {
            day: 'Sabado',
            time: '09:00 - 12:00',
            duration: 180,
            label: 'Capa de Transporte & Sesion Extendida',
            type: 'mixto',
            details: [
              'Repaso FSRS: Todo al dia (15 min)',
              'Lectura profunda: Protocolo TCP & UDP (45 min)',
              'Practica: Three-Way Handshake (30 min)',
              'Anotaciones personales en editor dual (30 min)',
              'Cuestionario general del modulo (30 min)',
              'Sesion de retroalimentacion con tutor IA (30 min)',
            ],
          },
        ])
      }
      setGenerating(false)
    }, 1500)
  }

  const handleSaveEdit = () => {
    if (!editingSlot) return
    const updatedPlan = [...plan]
    updatedPlan[editingSlot.originalIndex] = {
      day: editingSlot.day,
      time: editingSlot.time,
      duration: Number(editingSlot.duration),
      label: editingSlot.label,
      type: editingSlot.type,
      details: editingSlot.details.map((d) => d.trim()).filter(Boolean),
    }
    setPlan(updatedPlan)
    setEditingSlot(null)
    setSelectedSlot(null)
  }

  const handleDeleteSlot = (index: number) => {
    setPlan(plan.filter((_, idx) => idx !== index))
    setEditingSlot(null)
    setSelectedSlot(null)
  }

  const handleSaveNew = () => {
    if (!newSlot) return
    setPlan([
      ...plan,
      { ...newSlot, details: newSlot.details.map((d) => d.trim()).filter(Boolean) },
    ])
    setNewSlot(null)
    setAddingToDay(null)
  }

  const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="mb-8 border-b border-border pb-4 flex justify-between items-end">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground flex items-center gap-2">
            <span>Planificador de Estudio</span>
            <span className="text-xs font-normal text-muted bg-card px-2 py-0.5 rounded-md">
              Agente Programador
            </span>
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Visualiza, edita y personaliza tu cronograma adaptativo semanal de aprendizaje.
          </p>
        </div>
      </div>

      {/* NLP Input */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm mb-8">
        <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">
          Recalcular disponibilidad semanal
        </h2>
        <div className="flex flex-col gap-4">
          <textarea
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="Ejemplo: Puedo estudiar los lunes y miercoles de 7 a 9 de la tarde y los domingos por la manana..."
            className="w-full min-h-[60px] p-3 text-xs border border-border bg-background text-foreground rounded-xl outline-none focus:border-cyan transition-colors resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted flex items-center gap-1.5">
              El agente dividira tu tiempo optimizando prerrequisitos logicos.
            </span>
            <button
              onClick={handleGeneratePlan}
              disabled={generating || !availability.trim()}
              className="px-5 py-2.5 bg-cyan hover:opacity-90 text-background rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {generating ? 'Recalculando...' : 'Calcular Sesiones con IA'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {generating && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 border border-border rounded-2xl bg-card">
          <span className="w-8 h-8 border-3 border-cyan border-t-transparent rounded-full animate-spin mb-4" />
          <h3 className="text-sm font-semibold text-foreground animate-pulse">
            Calculando cronograma de estudio
          </h3>
          <p className="text-xs text-muted mt-1 max-w-xs text-center">
            El Agente Scheduler esta analizando el tamano de los modulos, dependencias y tiempos
            estimados...
          </p>
        </div>
      )}

      {/* Calendar Grid */}
      {!generating && (
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-1">
                Cronograma de Sesiones Activo
              </h2>
              <p className="text-[11px] text-muted">
                Haz clic en cualquier bloque para ver, editar o eliminar la sesion.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {DAYS.map((dayName) => {
              const daySlots = plan.filter((s) => s.day === dayName)
              return (
                <div
                  key={dayName}
                  className="rounded-xl border border-border p-3 flex flex-col bg-card hover:border-cyan/30 transition-all min-h-[220px]"
                >
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2 border-b border-border pb-1 text-center block">
                    {dayName}
                  </span>

                  <div className="flex-1 flex flex-col gap-2 mb-3">
                    {daySlots.map((slot, sIdx) => {
                      const originalIndex = plan.indexOf(slot)
                      const typeColors: Record<string, string> = {
                        nuevo: 'bg-cyan/10 text-cyan border-cyan/20',
                        repaso: 'bg-srs-dominado/10 text-srs-dominado border-srs-dominado/20',
                        mixto: 'bg-srs-en-practica/10 text-srs-en-practica border-srs-en-practica/20',
                      }
                      const typeColor = typeColors[slot.type] || 'bg-card text-muted'
                      return (
                        <div
                          key={sIdx}
                          onClick={() => {
                            setSelectedSlot(slot)
                            setEditingSlot({ ...slot, originalIndex })
                          }}
                          className="rounded-lg border border-border bg-background hover:bg-cyan/5 p-2 cursor-pointer transition-all flex flex-col justify-between min-h-[72px]"
                        >
                          <div className="flex justify-between items-center gap-1">
                            <span
                              className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${typeColor}`}
                            >
                              {slot.type}
                            </span>
                            <span className="text-[9px] text-muted font-medium whitespace-nowrap">
                              {slot.time}
                            </span>
                          </div>
                          <h4 className="text-[10.5px] font-bold text-foreground leading-tight mt-1.5 line-clamp-2">
                            {slot.label}
                          </h4>
                        </div>
                      )
                    })}
                    {daySlots.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-muted text-[10px] font-medium italic py-8">
                        Descanso
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setAddingToDay(dayName)
                      setNewSlot({
                        day: dayName,
                        time: '19:00 - 20:00',
                        duration: 60,
                        label: 'Nueva Sesion de Estudio',
                        type: 'mixto',
                        details: ['Repaso de conceptos clave', 'Lectura del tema actual'],
                      })
                    }}
                    className="w-full py-1 text-muted hover:text-cyan hover:border-cyan/30 hover:bg-cyan/5 border border-dashed border-border rounded-lg text-[9px] font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    + Anadir
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Edit Slot Dialog */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-md flex flex-col gap-4 mx-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Personalizar Sesion de Estudio
              </h3>
              <button
                onClick={() => setEditingSlot(null)}
                className="text-muted hover:text-foreground text-lg font-bold p-1"
              >
                x
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[9px]">
                  Tema / Titulo de la Sesion
                </label>
                <input
                  type="text"
                  value={editingSlot.label}
                  onChange={(e) => setEditingSlot({ ...editingSlot, label: e.target.value })}
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-xl outline-none focus:border-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[9px]">
                    Dia
                  </label>
                  <select
                    value={editingSlot.day}
                    onChange={(e) => setEditingSlot({ ...editingSlot, day: e.target.value })}
                    className="w-full p-2.5 border border-border bg-background text-foreground rounded-xl outline-none focus:border-cyan"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[9px]">
                    Tipo de Sesion
                  </label>
                  <select
                    value={editingSlot.type}
                    onChange={(e) =>
                      setEditingSlot({ ...editingSlot, type: e.target.value as any })
                    }
                    className="w-full p-2.5 border border-border bg-background text-foreground rounded-xl outline-none focus:border-cyan"
                  >
                    <option value="nuevo">Nuevo contenido</option>
                    <option value="repaso">Repaso puro</option>
                    <option value="mixto">Mixto (Contenido + SRS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[9px]">
                    Horario
                  </label>
                  <input
                    type="text"
                    value={editingSlot.time}
                    onChange={(e) => setEditingSlot({ ...editingSlot, time: e.target.value })}
                    placeholder="e.g. 20:00 - 21:00"
                    className="w-full p-2.5 border border-border bg-background text-foreground rounded-xl outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[9px]">
                    Duracion (minutos)
                  </label>
                  <input
                    type="number"
                    value={editingSlot.duration}
                    onChange={(e) =>
                      setEditingSlot({ ...editingSlot, duration: Number(e.target.value) })
                    }
                    className="w-full p-2.5 border border-border bg-background text-foreground rounded-xl outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[9px]">
                  Distribucion de Actividades (una por linea)
                </label>
                <textarea
                  value={editingSlot.details.join('\n')}
                  onChange={(e) =>
                    setEditingSlot({ ...editingSlot, details: e.target.value.split('\n') })
                  }
                  rows={4}
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-xl outline-none focus:border-cyan resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-border">
              <button
                onClick={() => handleDeleteSlot(editingSlot.originalIndex)}
                className="mr-auto px-3.5 py-2 bg-srs-critico/10 hover:bg-srs-critico/20 text-srs-critico text-xs font-semibold rounded-xl transition-colors border border-srs-critico/20 shadow-sm"
              >
                Eliminar
              </button>
              <button
                onClick={() => setEditingSlot(null)}
                className="px-4 py-2 border border-border hover:bg-primary/50 text-foreground text-xs font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-cyan hover:opacity-90 text-background text-xs font-semibold rounded-xl shadow-sm transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Slot Dialog */}
      {addingToDay && newSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-md flex flex-col gap-4 mx-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Anadir Nueva Sesion para el {addingToDay}
              </h3>
              <button
                onClick={() => {
                  setAddingToDay(null)
                  setNewSlot(null)
                }}
                className="text-muted hover:text-foreground text-lg font-bold p-1"
              >
                x
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[9px]">
                  Tema / Titulo de la Sesion
                </label>
                <input
                  type="text"
                  value={newSlot.label}
                  onChange={(e) => setNewSlot({ ...newSlot, label: e.target.value })}
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-xl outline-none focus:border-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[9px]">
                    Dia
                  </label>
                  <select
                    value={newSlot.day}
                    onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                    className="w-full p-2.5 border border-border bg-background text-foreground rounded-xl outline-none focus:border-cyan"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[9px]">
                    Tipo de Sesion
                  </label>
                  <select
                    value={newSlot.type}
                    onChange={(e) => setNewSlot({ ...newSlot, type: e.target.value as any })}
                    className="w-full p-2.5 border border-border bg-background text-foreground rounded-xl outline-none focus:border-cyan"
                  >
                    <option value="nuevo">Nuevo contenido</option>
                    <option value="repaso">Repaso puro</option>
                    <option value="mixto">Mixto (Contenido + SRS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[9px]">
                    Horario
                  </label>
                  <input
                    type="text"
                    value={newSlot.time}
                    onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                    placeholder="e.g. 19:00 - 20:00"
                    className="w-full p-2.5 border border-border bg-background text-foreground rounded-xl outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[9px]">
                    Duracion (minutos)
                  </label>
                  <input
                    type="number"
                    value={newSlot.duration}
                    onChange={(e) => setNewSlot({ ...newSlot, duration: Number(e.target.value) })}
                    className="w-full p-2.5 border border-border bg-background text-foreground rounded-xl outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted font-bold mb-1 uppercase tracking-wider text-[9px]">
                  Distribucion de Actividades (una por linea)
                </label>
                <textarea
                  value={newSlot.details.join('\n')}
                  onChange={(e) => setNewSlot({ ...newSlot, details: e.target.value.split('\n') })}
                  rows={4}
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-xl outline-none focus:border-cyan resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-border">
              <button
                onClick={() => {
                  setAddingToDay(null)
                  setNewSlot(null)
                }}
                className="px-4 py-2 border border-border hover:bg-primary/50 text-foreground text-xs font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNew}
                className="px-4 py-2 bg-cyan hover:opacity-90 text-background text-xs font-semibold rounded-xl shadow-sm transition-colors"
              >
                Anadir Sesion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
