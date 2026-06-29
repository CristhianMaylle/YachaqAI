import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'

export function Register() {
  return (
    <AuthLayout>
      <h1 className="font-heading text-2xl font-bold text-center">Crear Cuenta</h1>
      <p className="text-center text-sm text-muted">Próximamente (Sprint 5)</p>
      <Link to="/auth/login" className="mt-4 block text-center text-sm text-cyan hover:underline">
        Ya tengo cuenta
      </Link>
    </AuthLayout>
  )
}
