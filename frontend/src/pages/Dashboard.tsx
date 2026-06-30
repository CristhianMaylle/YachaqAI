import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusCircle, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createNotebook } from '@/lib/notebook-api'
import { useDeckStore } from '@/stores/deck.store'

export function Dashboard() {
  const { decks, setDecks } = useDeckStore()
  const navigate = useNavigate()

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('decks')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) setDecks(data)
      })
  }, [setDecks])

  const closeModal = () => {
    setShowCreate(false)
    setName('')
    setCreateError(null)
  }

  const handleCreate = async () => {
    if (name.trim().length < 3) {
      setCreateError('El nombre debe tener al menos 3 caracteres')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      const meta = await createNotebook(name.trim())
      navigate(`/deck/${meta.id}/documents/upload`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error al crear el mazo')
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Mis Mazos</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
        >
          <PlusCircle size={16} /> Nuevo Mazo
        </button>
      </div>

      {decks.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <PlusCircle size={48} className="text-muted" />
          <h2 className="mt-4 font-heading text-xl font-semibold">Crea tu primer mazo</h2>
          <p className="mt-2 text-muted">Nombra tu mazo, luego sube un PDF y YachaqAI generará tu wiki de estudio.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan px-6 py-3 font-semibold text-background"
          >
            <PlusCircle size={18} /> Crear Mazo
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Link
              key={deck.id}
              to={`/deck/${deck.id}/documents`}
              className="rounded-xl bg-card p-5 transition hover:ring-1 hover:ring-cyan"
            >
              <h3 className="font-heading font-semibold">{deck.name}</h3>
              {deck.description && <p className="mt-1 text-sm text-muted">{deck.description}</p>}
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Crear nuevo mazo</h2>
              <button onClick={closeModal} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">¿Sobre qué tema vas a estudiar?</p>

            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="ej. Redes de Computadoras"
              maxLength={60}
              className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-cyan"
            />

            {createError && (
              <p className="mt-2 text-sm text-srs-critico">{createError}</p>
            )}

            <button
              onClick={handleCreate}
              disabled={creating || name.trim().length < 3}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Creando...
                </>
              ) : (
                'Crear y continuar →'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
