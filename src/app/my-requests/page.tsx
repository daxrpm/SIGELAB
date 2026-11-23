import Link from '@/components/navigation-link'
import { ChevronRight, ClipboardList, Plus } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { EmptyState, StatusChip } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { formatShortDate, STATUS_LABEL, slotShort, TYPE_LABEL } from '@/lib/domain/labels'
import { createClient } from '@/lib/supabase/server'
import { listTimeSlots } from '@/services/labs'
import { listMyRequests } from '@/services/requests'
import type { RequestStatus } from '@/types'

const STATUSES: RequestStatus[] = ['pending', 'approved', 'rejected', 'cancelled']

export default async function MyRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireRole('professor')
  const sp = await searchParams
  const status = STATUSES.find((s) => s === sp.status)
  const db = await createClient()
  const [all, slots] = await Promise.all([listMyRequests(db, user.id), listTimeSlots(db)])
  const items = status ? all.filter((r) => r.status === status) : all
  const count = (s: RequestStatus) => all.filter((r) => r.status === s).length

  return (
    <AppShell user={user} title="Mis solicitudes">
      <div className="mt-4 filter-strip flex gap-2 overflow-x-auto px-4">
        <Link href="/my-requests" aria-current={!status} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${!status ? 'border-brand bg-brand text-white' : 'border-gray-200 bg-white'}`}>Todas {all.length}</Link>
        {STATUSES.map((s) => <Link key={s} href={`/my-requests?status=${s}`} aria-current={status === s} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${status === s ? 'border-brand bg-brand text-white' : 'border-gray-200 bg-white'}`}>{STATUS_LABEL[s]}s {count(s)}</Link>)}
      </div>
      <div className="mt-4 flex items-baseline justify-between px-4"><h2 className="font-semibold">Solicitudes registradas</h2><span className="text-xs text-gray-500">{items.length} registros</span></div>
      {items.length === 0 ? (
        <EmptyState icon={<ClipboardList size={26} />} title="No hay solicitudes">{status ? 'No tienes solicitudes con este estado.' : 'Aún no has registrado solicitudes de reserva.'}</EmptyState>
      ) : (
        <ul className="card-grid mt-2 px-4">
          {items.map((r) => (
            <li key={r.id}>
              <Link href={`/my-requests/${r.id}`} className="block rounded-2xl border border-gray-100 bg-white p-3 shadow-sm" data-testid={`request-${r.code}`}>
                <div className="flex items-center justify-between"><span className="text-xs font-semibold">{r.code}</span><StatusChip status={r.status} /></div>
                <p className="mt-1 text-sm font-semibold">{r.lab.name}</p>
                <p className="truncate text-xs text-gray-500">{r.reason}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500"><span>{TYPE_LABEL[r.reservation_type]}</span><span className="flex items-center gap-1">{formatShortDate(r.date)} · {slotShort(slots.find((s) => s.id === r.slot_id)!)}<ChevronRight size={14} /></span></div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="page-action"><Link href="/reservations/new" className="inline-flex items-center gap-1 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg"><Plus size={16} />Nueva</Link></div>
    </AppShell>
  )
}
