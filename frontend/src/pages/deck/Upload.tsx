import { useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Upload as UploadIcon, FileText, X, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { useDeckStore } from '@/stores/deck.store'
import { IngestProgress } from '@/components/ingest/IngestProgress'
import { IngestReview } from '@/components/ingest/IngestReview'
import type { ReviewItem, IngestJob } from '@/types'

type Phase = 'select' | 'step1' | 'review' | 'step2' | 'completed' | 'error'

const STAGES_STEP1 = [
  'Subiendo archivo',
  'Extrayendo texto',
  'Analizando estructura',
]

const STAGES_STEP2 = [
  'Generando fuente transformada',
  'Generando conceptos',
  'Generando entidades',
  'Generando módulos',
  'Actualizando índice',
]

export function Upload() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const { addIngestJob, updateIngestJob } = useDeckStore()

  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('select')
  const [error, setError] = useState<string | null>(null)
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [jobStatus, setJobStatus] = useState<Partial<IngestJob>>({})
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type === 'application/pdf') {
      setFile(dropped)
      setError(null)
    } else {
      setError('Solo se aceptan archivos PDF')
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setError(null)
    }
  }

  const pollStatus = (id: string, expectedPhase: 'step1' | 'step2') => {
    stopPolling()
    intervalRef.current = setInterval(async () => {
      try {
        const status = await api.ingest.status(id)
        setJobStatus(status)
        updateIngestJob(id, status as never)

        if (status.status === 'analysis_done' && expectedPhase === 'step1') {
          stopPolling()
          setReviewItems((status.review_items as ReviewItem[]) ?? [])
          setPhase('review')
          setUploading(false)
          return
        }

        if (status.status === 'completed') {
          stopPolling()
          setPhase('completed')
          setUploading(false)
          setTimeout(() => navigate(`/deck/${deckId}/documents`), 2000)
          return
        }

        if (status.status === 'error') {
          stopPolling()
          setPhase('error')
          setError(status.error_message ?? 'Error durante el procesamiento')
          setUploading(false)
        }
      } catch {
        stopPolling()
        setPhase('error')
        setError('Error de conexión con el servidor')
        setUploading(false)
      }
    }, 2000)
  }

  const handleUpload = async () => {
    if (!file || !deckId) return
    setUploading(true)
    setError(null)
    setPhase('step1')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('deck_id', deckId)

      const result = await api.ingest.process(formData)
      setJobId(result.job_id)
      addIngestJob({
        id: result.job_id,
        deck_id: deckId,
        source_type: 'pdf',
        source_name: file.name,
        storage_path: null,
        status: 'pending',
        progress: 0,
        stage: STAGES_STEP1[0],
        concepts_found: 0,
        entities_found: 0,
        modules_found: 0,
        error_message: null,
        review_items: null,
        review_status: 'pending',
        created_at: new Date().toISOString(),
        completed_at: null,
      })
      pollStatus(result.job_id, 'step1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo')
      setUploading(false)
      setPhase('error')
    }
  }

  const handleConfirmReview = async (items: ReviewItem[]) => {
    if (!jobId) return
    setConfirmLoading(true)
    try {
      await api.ingest.confirmReview(jobId, items)
      setPhase('step2')
      pollStatus(jobId, 'step2')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar revisión')
      setPhase('error')
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleCancelReview = () => {
    setPhase('select')
    setJobId(null)
    setFile(null)
    setReviewItems([])
    setJobStatus({})
  }

  if (!deckId || deckId === 'new') {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="flex flex-col items-center rounded-xl bg-card p-10 text-center">
          <AlertCircle size={40} className="text-srs-practica" />
          <h2 className="mt-4 font-heading text-xl font-semibold">Primero crea un mazo</h2>
          <p className="mt-2 text-muted">
            Necesitas crear o seleccionar un mazo antes de subir material.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan px-6 py-3 font-semibold text-background transition hover:opacity-90"
          >
            Ir a Mis Mazos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="font-heading text-2xl font-bold">Subir Material</h1>
      <p className="mt-1 text-muted">Sube un PDF y YachaqAI generará tu wiki de estudio.</p>

      {phase === 'select' && (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            className={`mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition ${
              dragOver ? 'border-cyan bg-cyan/5' : 'border-border'
            } ${error ? 'border-srs-critico' : ''}`}
          >
            {file ? (
              <div className="flex items-center gap-3">
                <FileText size={24} className="text-streak" />
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-muted">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                <button onClick={() => setFile(null)} className="text-muted hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <UploadIcon size={40} className="text-muted" />
                <p className="mt-3 text-muted">Arrastra un PDF aquí o</p>
                <label className="mt-2 cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary/80">
                  Seleccionar archivo
                  <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
                </label>
              </>
            )}
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-srs-critico">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-6 w-full rounded-lg bg-cyan px-6 py-3 font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? 'Procesando...' : 'Subir y procesar'}
          </button>
        </>
      )}

      {phase === 'step1' && (
        <IngestProgress
          stages={STAGES_STEP1}
          status={jobStatus.status ?? 'pending'}
          progress={jobStatus.progress ?? 0}
          stage={jobStatus.stage ?? null}
          conceptsFound={jobStatus.concepts_found ?? 0}
          entitiesFound={jobStatus.entities_found ?? 0}
          modulesFound={jobStatus.modules_found ?? 0}
        />
      )}

      {phase === 'review' && (
        <IngestReview
          reviewItems={reviewItems}
          sourceSummary={jobStatus.source_summary}
          onConfirm={handleConfirmReview}
          onCancel={handleCancelReview}
          loading={confirmLoading}
        />
      )}

      {phase === 'step2' && (
        <IngestProgress
          stages={STAGES_STEP2}
          status={jobStatus.status ?? 'generating'}
          progress={jobStatus.progress ?? 55}
          stage={jobStatus.stage ?? null}
          conceptsFound={jobStatus.concepts_found ?? 0}
          entitiesFound={jobStatus.entities_found ?? 0}
          modulesFound={jobStatus.modules_found ?? 0}
        />
      )}

      {phase === 'error' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-srs-critico/10 p-4">
            <AlertCircle size={20} className="text-srs-critico" />
            <div>
              <p className="font-medium text-srs-critico">Error durante el procesamiento</p>
              {error && <p className="mt-1 text-sm text-muted">{error}</p>}
            </div>
          </div>
          <button
            onClick={handleCancelReview}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-card"
          >
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  )
}
