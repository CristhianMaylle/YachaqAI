import { useEffect } from 'react'
import { Zap, Star, Lock, Loader2 } from 'lucide-react'
import { useLLMStore } from '@/stores/llm.store'

export function ModelSelector() {
  const { providers, activeProvider, activeModel, loading, fetchProviders, selectModel } =
    useLLMStore()

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  if (loading && providers.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted">
        <Loader2 size={16} className="animate-spin" /> Cargando proveedores...
      </div>
    )
  }

  const noProviders = providers.every((p) => !p.available)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">Modelo de IA</h2>
        <p className="mt-1 text-sm text-muted">
          Selecciona el proveedor y modelo que usará YachaqAI para generar tu wiki.
        </p>
      </div>

      {noProviders && (
        <div className="rounded-lg bg-srs-practica/10 p-4 text-sm text-srs-practica">
          No hay proveedores configurados. Agrega al menos una API key en el archivo{' '}
          <code className="rounded bg-primary px-1.5 py-0.5 text-xs">.env</code> del backend.
        </div>
      )}

      <div className="space-y-3">
        {providers.map((provider) => {
          const isActive = provider.id === activeProvider
          const isAvailable = provider.available

          return (
            <div
              key={provider.id}
              className={`rounded-xl border transition ${
                isActive
                  ? 'border-cyan bg-cyan/5'
                  : isAvailable
                    ? 'border-border bg-card hover:border-border/80'
                    : 'border-border/50 bg-card/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 p-4">
                <input
                  type="radio"
                  name="llm-provider"
                  checked={isActive}
                  disabled={!isAvailable}
                  onChange={() => {
                    if (isAvailable && provider.models.length > 0) {
                      selectModel(provider.id, provider.models[0].id)
                    }
                  }}
                  className="h-4 w-4 accent-cyan"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{provider.label}</span>
                    {!isAvailable && <Lock size={14} className="text-muted" />}
                  </div>
                  {!isAvailable && provider.message && (
                    <p className="mt-0.5 text-xs text-muted">{provider.message}</p>
                  )}
                </div>
              </div>

              {isAvailable && isActive && provider.models.length > 0 && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <select
                    value={activeModel ?? ''}
                    onChange={(e) => selectModel(provider.id, e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {provider.models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.label}{' '}
                        {model.tier === 'fast' ? '⚡' : '★'}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Zap size={10} /> fast = velocidad
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={10} /> quality = calidad
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
