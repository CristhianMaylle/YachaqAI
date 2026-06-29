import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

interface Props {
  stages: string[]
  status: string
  progress: number
  stage: string | null
  conceptsFound: number
  entitiesFound: number
  modulesFound: number
}

export function IngestProgress({
  stages,
  status,
  progress,
  stage,
  conceptsFound,
  entitiesFound,
  modulesFound,
}: Props) {
  const currentStageIndex = stage ? stages.findIndex((s) => stage.toLowerCase().includes(s.toLowerCase().slice(0, 10))) : -1
  const effectiveIndex = currentStageIndex >= 0 ? currentStageIndex : Math.floor((progress / 100) * stages.length)

  return (
    <div className="mt-6 space-y-6 animate-fade-in">
      <div className="rounded-xl bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted">Progreso</span>
          <span className="text-sm font-bold text-cyan">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-cyan transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {stage && (
          <p className="mt-3 text-sm text-muted">{stage}</p>
        )}
      </div>

      <div className="space-y-2">
        {stages.map((s, i) => {
          const done = i < effectiveIndex || status === 'completed'
          const active = i === effectiveIndex && status !== 'completed' && status !== 'error'

          return (
            <div key={s} className="flex items-center gap-3 rounded-lg px-3 py-2">
              {done ? (
                <CheckCircle2 size={16} className="text-srs-dominado" />
              ) : active ? (
                <Loader2 size={16} className="animate-spin text-cyan" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-border" />
              )}
              <span className={done ? 'text-foreground' : active ? 'text-cyan' : 'text-muted'}>
                {s}
              </span>
            </div>
          )
        })}
      </div>

      {status === 'completed' && (
        <div className="flex items-center gap-3 rounded-lg bg-srs-dominado/10 p-4">
          <CheckCircle2 size={20} className="text-srs-dominado" />
          <div>
            <p className="font-medium text-srs-dominado">Wiki generada exitosamente</p>
            <p className="text-sm text-muted">
              {conceptsFound} conceptos · {entitiesFound} entidades · {modulesFound} módulos
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-3 rounded-lg bg-srs-critico/10 p-4">
          <AlertCircle size={20} className="text-srs-critico" />
          <p className="font-medium text-srs-critico">Error durante el procesamiento</p>
        </div>
      )}
    </div>
  )
}
