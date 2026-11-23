import Link from '@/components/navigation-link'
import Form from 'next/form'
import { AlertTriangle, CalendarDays, FileText, History, Search } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { AutoSubmitSelect } from '@/components/auto-submit-select'
import { ConflictChip, EmptyState, StatusChip } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { formatLongDate, formatShortDate, slotShort, STATUS_LABEL, TYPE_LABEL } from '@/lib/domain/labels'
import { filterReservations, groupByDate, statusCounts } from '@/lib/domain/reservations-view'
import { createClient } from '@/lib/supabase/server'
import { listLabs, listTimeSlots } from '@/services/labs'
import { listAdminReservations } from '@/services/requests'
import type { RequestStatus } from '@/types'

const STATUSES: RequestStatus[] = ['pending', 'approved', 'rejected', 'cancelled']

export default async function AdminReservationsPage({ searchParams }: { searchParams: Promise<{ lab?: string; status?: string; conflicts?: string; q?: string; __empty?: string }> }) {
  const user = await requireRole('admin')
  const sp = await searchParams
  const db = await createClient()
  const [allRows, labs, slots] = await Promise.all([listAdminReservations(db), listLabs(db), listTimeSlots(db)])
  // QA hook for the empty-state mockup (screen 16); disabled in production builds
  const all = process.env.NODE_ENV !== 'production' && sp.__empty === '1' ? [] : allRows
  const status = STATUSES.find((s) => s === sp.status) ?? 'all'
  const labId = labs.find((l) => l.id === sp.lab)?.id
  const onlyConflicts = sp.conflicts === '1'
  const q = sp.q ?? ''
  // counters are computed over the selected laboratory, before the status filter
  const scoped = filterReservations(all, { labId, q })
  const counts = statusCounts(scoped)
  const conflictCount = scoped.filter((r) => r.has_conflict).length
  const rows = filterReservations(all, { labId, status, onlyConflicts, q })
  const href = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const merged = { lab: labId, status: status === 'all' ? undefined : status, conflicts: onlyConflicts ? '1' : undefined, q: q || undefined, ...o }
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v))
    return `/admin/reservations?${p}`
  }
  const labName = labs.find((l) => l.id === labId)?.name

  return (
    <AppShell user={user} title="Registro de reservas">
      <Form action="/admin/reservations" className="mx-4 mt-4 grid gap-2 md:grid-cols-2" role="search">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3"><Search size={16} className="text-gray-400" /><input name="q" defaultValue={q} aria-label="Buscar" placeholder="Buscar docente, motivo o código" className="w-full py-2.5 text-sm outline-none" /></div>
        <AutoSubmitSelect name="lab" label="Laboratorio" defaultValue={labId ?? ''} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm">
          <option value="">Todos los laboratorios</option>
          {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </AutoSubmitSelect>
        {status !== 'all' && <input type="hidden" name="status" value={status} />}
        {onlyConflicts && <input type="hidden" name="conflicts" value="1" />}
      </Form>
      <div className="mt-3 filter-strip flex gap-2 overflow-x-auto px-4">
        <Link href={href({ status: undefined })} aria-current={status === 'all'} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${status === 'all' ? 'border-admin bg-admin text-white' : 'border-gray-200 bg-white'}`}>Todas <span data-testid="count-all">{counts.all}</span></Link>
        {STATUSES.map((s) => <Link key={s} href={href({ status: s })} aria-current={status === s} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${status === s ? 'border-admin bg-admin text-white' : 'border-gray-200 bg-white'}`}>{STATUS_LABEL[s]}s <span data-testid={`count-${s}`}>{counts[s]}</span></Link>)}
      </div>
      <Link href={href({ conflicts: onlyConflicts ? undefined : '1' })} role="switch" aria-checked={onlyConflicts} data-testid="only-conflicts" className="mx-4 mt-3 flex items-center justify-between rounded-xl bg-white p-3">
        <span><span className="flex items-center gap-1 text-sm font-semibold"><AlertTriangle size={14} />Solo conflictos de horario</span><span className="block text-xs text-gray-500">{conflictCount} reservas coinciden en laboratorio, fecha y horario</span></span>
        <span className={`flex h-6 w-11 items-center rounded-full p-0.5 ${onlyConflicts ? 'justify-end bg-admin' : 'justify-start bg-gray-300'}`}><span className="h-5 w-5 rounded-full bg-white" /></span>
      </Link>
      <div className="mt-4 flex items-baseline justify-between px-4"><h2 className="font-semibold">{labName ?? 'Todas las reservas'}</h2><span data-testid="row-count" className="text-xs text-gray-500">{rows.length} registros</span></div>
      {rows.length === 0 ? (
        all.length === 0
          ? <EmptyState icon={<History size={26} />} title="No existen reservas registradas">Cuando los docentes registren solicitudes de laboratorio aparecerán en este listado.</EmptyState>
          : <EmptyState icon={<Search size={26} />} title="Sin resultados">Ninguna reserva coincide con los filtros seleccionados.</EmptyState>
      ) : (
        <div className="mt-2 space-y-4 px-4">
          {groupByDate(rows).map(([date, items]) => (
            <section key={date}>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">{formatLongDate(date)}</h3>
              <ul className="card-grid">
                {items.map((r) => (
                  <li key={r.id} data-testid={`row-${r.code}`} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">{r.code}</span><span className="flex gap-1">{r.has_conflict && <ConflictChip />}<StatusChip status={r.status} /></span></div>
                    <p className="mt-1 text-sm font-semibold">{r.lab_name}</p>
                    <p className="truncate text-xs text-gray-500">{r.requester_name} · {r.reason}</p>
                    <p className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-500"><span className="flex items-center gap-1"><FileText size={12} />{TYPE_LABEL[r.reservation_type]}</span><span className="flex items-center gap-1"><CalendarDays size={12} />{formatShortDate(r.date)} · {slotShort(slots.find((s) => s.id === r.slot_id)!)}</span></p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  )
}
