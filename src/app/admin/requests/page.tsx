import Link from '@/components/navigation-link'
import { Inbox } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { EmptyState } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { addDays, todayLocal } from '@/lib/domain/labels'
import { groupByDate } from '@/lib/domain/reservations-view'
import { createClient } from '@/lib/supabase/server'
import { listTimeSlots } from '@/services/labs'
import { listAdminReservations } from '@/services/requests'
import { ReviewCard } from './review-card'

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requireRole('admin')
  const { view } = await searchParams
  const db = await createClient()
  const [all, slots] = await Promise.all([listAdminReservations(db), listTimeSlots(db)])
  const pending = all.filter((r) => r.status === 'pending')
  const today = todayLocal(), tomorrow = addDays(today, 1)
  const soon = pending.filter((r) => r.date === today || r.date === tomorrow)
  const conflicts = pending.filter((r) => r.has_conflict)
  const mode = view === 'conflicts' || view === 'soon' ? view : 'all'
  const shown = mode === 'conflicts' ? conflicts : mode === 'soon' ? soon : pending
  const stat = (n: number, label: string, color: string) => <div className="flex-1 rounded-xl bg-white p-3 shadow-sm"><p className={`text-2xl font-bold ${color}`}>{n}</p><p className="text-[11px] leading-tight text-gray-500">{label}</p></div>

  return (
    <AppShell user={user} title="Solicitudes">
      <div className="mx-4 mt-4 flex gap-2" data-testid="summary">
        {stat(pending.length, 'Pendientes de revisión', 'text-orange-600')}
        {stat(conflicts.length, 'Con conflicto de horario', 'text-red-600')}
        {stat(soon.length, 'Para hoy o mañana', 'text-gray-900')}
      </div>
      <div className="mt-3 flex gap-2 px-4">
        {([['all', 'Todas'], ['conflicts', 'Con conflicto'], ['soon', 'Próximas']] as const).map(([k, l]) => (
          <Link key={k} href={`/admin/requests?view=${k}`} aria-current={mode === k} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${mode === k ? 'border-admin bg-admin text-white' : 'border-gray-200 bg-white'}`}>{l}</Link>
        ))}
      </div>
      <div className="mt-4 flex items-baseline justify-between px-4"><h2 className="font-semibold">Por revisar</h2><span className="text-xs text-gray-500">ordenadas por fecha</span></div>
      {shown.length === 0 ? <EmptyState icon={<Inbox size={26} />} title="No hay solicitudes pendientes">Cuando los docentes envíen solicitudes aparecerán aquí.</EmptyState> : (
        <ul className="card-grid mt-2 px-4">
          {groupByDate(shown).flatMap(([, rows]) => rows).map((r) => <li key={r.id}><ReviewCard r={r} slot={slots.find((s) => s.id === r.slot_id)!} /></li>)}
        </ul>
      )}
    </AppShell>
  )
}
