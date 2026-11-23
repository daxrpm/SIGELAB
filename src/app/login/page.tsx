import { FlaskConical } from 'lucide-react'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <main className="login-page"><div className="login-layout">
      <div className="login-intro mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand"><FlaskConical /></div>
        <p className="text-xs tracking-widest text-gray-500">LABFIS · SIGELAB</p>
        <h1 className="text-2xl font-bold">Gestión de espacios</h1>
        <p className="text-sm text-gray-500">Reserva y disponibilidad de laboratorios</p>
      </div>
      <div className="login-form-panel"><LoginForm /></div>
      <p className="login-footer text-xs text-gray-400">Facultad de Ingeniería de Sistemas · LABFIS · Grupo 7</p>
    </div></main>
  )
}
