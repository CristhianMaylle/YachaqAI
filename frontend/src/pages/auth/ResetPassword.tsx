import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'

export function ResetPassword() {
  return (
    <AuthLayout>
      <h1 className="font-heading text-2xl font-bold text-center">Recuperar Contraseña</h1>
      <p className="text-center text-sm text-muted">Próximamente (Sprint 5)</p>
      <Link to="/auth/login" className="mt-4 block text-center text-sm text-cyan hover:underline">
        Volver al login
      </Link>
    </AuthLayout>
  )
}
