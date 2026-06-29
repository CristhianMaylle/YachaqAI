import { ModelSelector } from '@/components/settings/ModelSelector'

export function Settings() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="font-heading text-2xl font-bold">Configuración</h1>
      <div className="mt-6">
        <ModelSelector />
      </div>
    </div>
  )
}
