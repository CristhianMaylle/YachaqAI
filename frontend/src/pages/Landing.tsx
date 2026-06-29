import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Brain, BarChart3 } from 'lucide-react'

const FEATURES = [
  {
    icon: BookOpen,
    title: 'PDF a Wiki',
    description: 'Sube un PDF y obtén una wiki estructurada con conceptos interconectados.',
  },
  {
    icon: Brain,
    title: 'Estudio inteligente',
    description: 'Repetición espaciada con FSRS que se adapta a tu ritmo de aprendizaje.',
  },
  {
    icon: BarChart3,
    title: 'Métricas reales',
    description: 'Visualiza tu progreso con grafos de conocimiento y curvas de retención.',
  },
]

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-heading text-5xl font-bold tracking-tight text-foreground">
          Transforma tus PDFs en conocimiento
          <span className="text-cyan"> que nunca olvidas</span>
        </h1>
        <p className="mt-4 text-lg text-muted">
          YachaqAI convierte documentos en wikis estructuradas y usa repetición
          espaciada para que domines cada concepto.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            to="/auth/register"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan px-6 py-3 font-semibold text-background transition hover:opacity-90"
          >
            Empezar Gratis <ArrowRight size={18} />
          </Link>
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-foreground transition hover:bg-card"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl bg-card p-6">
            <f.icon size={32} className="text-cyan" />
            <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">{f.title}</h3>
            <p className="mt-2 text-sm text-muted">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
