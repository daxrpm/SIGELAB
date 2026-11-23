import { Lock } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { BackLink, EmptyState } from '@/components/ui'
import { requireUser } from '@/lib/auth'

export default async function RestrictedPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const user = await requireUser()
  const { from } = await searchParams
  return (
    <AppShell contentWidth="narrow" user={user} title="Acceso restringido" hideNav back="/modules">
      <EmptyState icon={<Lock size={26} />} title="No tienes permisos para esta sección">
        {from === 'admin' ? 'Solo los usuarios autorizados como administradores pueden gestionar y cambiar el estado de las solicitudes.' : 'Solo puedes consultar tus propias solicitudes.'}
      </EmptyState>
      <div className="flex justify-center"><BackLink href="/modules">Volver al inicio</BackLink></div>
    </AppShell>
  )
}
