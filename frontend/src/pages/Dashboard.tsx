import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useDeckStore } from '@/stores/deck.store'

export function Dashboard() {
  const { decks, setDecks } = useDeckStore()

  useEffect(() => {
    supabase
      .from('decks')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setDecks(data)
      })
  }, [setDecks])

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Mis Mazos</h1>
        <Link
          to="/deck/new/documents/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
        >
          <PlusCircle size={16} /> Nuevo Mazo
        </Link>
      </div>

      {decks.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <PlusCircle size={48} className="text-muted" />
          <h2 className="mt-4 font-heading text-xl font-semibold">Crea tu primer mazo</h2>
          <p className="mt-2 text-muted">Sube un PDF y YachaqAI generará tu wiki de estudio.</p>
          <Link
            to="/deck/new/documents/upload"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan px-6 py-3 font-semibold text-background"
          >
            <PlusCircle size={18} /> Subir PDF
          </Link>
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
    </div>
  )
}
