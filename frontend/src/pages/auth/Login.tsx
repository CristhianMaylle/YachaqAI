import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'

export function Login() {
  return (
    <AuthLayout>
      <h1 className="font-heading text-2xl font-bold text-center">Iniciar Sesión</h1>
      <p className="text-center text-sm text-muted">Próximamente (Sprint 5)</p>
      <Link to="/" className="mt-4 block text-center text-sm text-cyan hover:underline">
        Volver al inicio
      </Link>
    </AuthLayout>
  )
}
