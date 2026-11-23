import Link from '@/components/navigation-link'
import { Plus } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { DateStrip } from '@/components/date-strip'
import { AvailabilityMatrix, Legend } from '@/components/availability-matrix'
import { LabTabs } from '@/components/lab-tabs'
import { EmptyState, Notice, SLOT_STYLE, SLOT_TEXT_STYLE } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { filterAvailable, freeSlots, groupAvailability } from '@/lib/domain/availability'
import { addDays, formatLongDate, isValidIsoDate, SLOT_STATUS_LABEL, slotLabel, todayLocal } from '@/lib/domain/labels'
import { createClient } from '@/lib/supabase/server'
import { getAvailability } from '@/services/availability'
import { listLabs, listTimeSlots } from '@/services/labs'

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ date?: string; slot?: string; only?: string; __empty?: string }> }) {
  const user = await requireUser()
  const sp = await searchParams
  const today = todayLocal()
  const date = isValidIsoDate(sp.date) && sp.date >= today && sp.date <= addDays(today, 13) ? sp.date : today
  const slotId = sp.slot && /^[1-7]$/.test(sp.slot) ? Number(sp.slot) : null
  const only = sp.only === '1'
  const matrix = !only && slotId === null

  const db = await createClient()
  const [labs, slots, cells] = await Promise.all([listLabs(db), listTimeSlots(db), getAvailability(db, date)])
  // QA hook for the "no labs available" mockup (screen 9); disabled in production builds
  const forced = process.env.NODE_ENV !== 'production' && sp.__empty === '1'
  const all = groupAvailability(labs, forced ? cells.map((c) => ({ ...c, status: 'reserved' as const })) : cells)
  const visible = only ? filterAvailable(all, slotId) : all
  const availableCount = filterAvailable(all, slotId).length
  const q = (o: { slot?: number | null; only?: boolean; date?: string }) => {
    const p = new URLSearchParams({ date: o.date ?? date })
    const s = o.slot === undefined ? slotId : o.slot
    if (s) p.set('slot', String(s))
    if ((o.only ?? only)) p.set('only', '1')
    return `/availability?${p}`
  }
  const slotHeading = slotId ? slotLabel(slots.find((s) => s.id === slotId)!) : 'Todo el día'

  return (
    <AppShell user={user} title={user.role === 'student' ? 'Horarios' : 'Gestión de espacios'}>
      {user.role !== 'student' && <LabTabs active="availability" date={date} />}
      <p className="mx-4 mt-4 mb-1 text-xs text-gray-500">Fecha</p>
      <DateStrip selected={date} hrefFor={(d) => q({ date: d })} />
      <p className="mx-4 mt-3 mb-1 text-xs text-gray-500">Horario</p>
      <div className="filter-strip flex gap-2 overflow-x-auto px-4">
        {[{ id: null as number | null, label: 'Todo el día' }, ...slots.map((s) => ({ id: s.id as number | null, label: slotLabel(s) }))].map((s) => (
          <Link key={s.label} href={q({ slot: s.id })} aria-current={slotId === s.id} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${slotId === s.id ? 'border-brand bg-brand text-white' : 'border-gray-200 bg-white'}`}>{s.label}</Link>
        ))}
      </div>
      <Link href={q({ only: !only })} role="switch" aria-checked={only} data-testid="only-available"
        className="mx-4 mt-4 flex items-center justify-between rounded-xl bg-white p-3">
        <span><span className="block text-sm font-semibold">Solo laboratorios disponibles</span><span className="block text-xs text-gray-500">Oculta los que no tienen bloques libres</span></span>
        <span className={`flex h-6 w-11 items-center rounded-full p-0.5 ${only ? 'justify-end bg-brand' : 'justify-start bg-gray-300'}`}><span className="h-5 w-5 rounded-full bg-white" /></span>
      </Link>

      <h2 className="mx-4 mt-4 font-semibold">{formatLongDate(date)}</h2>
      <div className="mx-4 mt-1 flex items-center justify-between text-sm"><span className="font-medium">{slotHeading}</span><span data-testid="available-count" className="text-xs text-gray-500">{availableCount} disponibles</span></div>

      {only && visible.length === 0 && (
        <div className="mx-4 mt-3"><Notice tone="warning" title="No hay laboratorios disponibles">Ningún laboratorio está libre en este horario. Prueba otro bloque.</Notice></div>
      )}
      {matrix && all.length > 0 && <AvailabilityMatrix items={all} slots={slots} />}
      <Legend />
      {all.length === 0 ? <EmptyState title="No hay laboratorios registrados" /> : matrix ? null : (
        <ul className="card-grid mx-4 mt-3">
          {visible.map((item) => {
            const slotCells = slotId ? item.cells.filter((c) => c.slot_id === slotId) : item.cells
            const free = freeSlots(item, slotId)
            return (
              <li key={item.lab.id} className="rounded-xl bg-white p-3 shadow-sm" data-testid={`avail-${item.lab.code}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{item.lab.name}</p><p className="text-xs text-gray-500">{item.lab.code} · {item.lab.capacity} personas</p></div>
                  {user.role === 'professor' && free.length > 0 && (
                    <Link href={`/reservations/new?lab=${item.lab.id}&date=${date}&slot=${free[0]}`} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white">Reservar</Link>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {slotCells.map((c) => {
                    const s = slots.find((x) => x.id === c.slot_id)!
                    return (
                      <span key={c.slot_id} data-status={c.status} data-testid={`cell-${item.lab.code}-${c.slot_id}`}
                        className={`rounded-lg border px-2 py-1 text-center text-[11px] ${SLOT_STYLE[c.status]}`}>
                        <span className="block font-semibold">{slotLabel(s).replace(/ /g, '')}</span>
                        <span className={`block ${SLOT_TEXT_STYLE[c.status]}`}>{SLOT_STATUS_LABEL[c.status]}</span>
                      </span>
                    )
                  })}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {user.role === 'professor' && (
        <div className="page-action"><Link href={`/reservations/new?date=${date}`} className="inline-flex items-center gap-1 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg"><Plus size={16} />Reservar</Link></div>
      )}
    </AppShell>
  )
}
