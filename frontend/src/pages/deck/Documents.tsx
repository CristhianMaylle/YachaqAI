import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FileText, Link as LinkIcon, Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { IngestJob } from '@/types'

export function Documents() {
  const { deckId } = useParams<{ deckId: string }>()
  const [jobs, setJobs] = useState<IngestJob[]>([])

  useEffect(() => {
    if (!deckId) return
    supabase
      .from('ingest_jobs')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setJobs(data as IngestJob[])
      })
  }, [deckId])

  const statusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Loader2 size={16} className="animate-spin text-cyan" />
      case 'completed': return <CheckCircle2 size={16} className="text-srs-dominado" />
      case 'error': return <AlertCircle size={16} className="text-srs-critico" />
      default: return <Loader2 size={16} className="text-muted" />
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Documentos</h1>
        <Link
          to={`/deck/${deckId}/documents/upload`}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
        >
          <Plus size={16} /> Agregar material
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="mt-8 text-center text-muted">No hay documentos aún. Sube tu primer PDF.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center gap-4 rounded-lg bg-card p-4">
              {job.source_type === 'pdf' ? (
                <FileText size={20} className="text-streak" />
              ) : (
                <LinkIcon size={20} className="text-cyan" />
              )}
              <div className="flex-1">
                <p className="font-medium">{job.source_name}</p>
                <p className="text-xs text-muted">
                  {job.concepts_found} conceptos · {job.entities_found} entidades · {job.modules_found} módulos
                </p>
              </div>
              {statusIcon(job.status)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
