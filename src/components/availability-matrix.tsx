import { BookOpen, Check, Clock, Lock } from 'lucide-react'
import type { LabAvailability } from '@/lib/domain/availability'
import type { SlotStatus, TimeSlot } from '@/types'
import { SLOT_STATUS_LABEL } from '@/lib/domain/labels'

const CELL: Record<SlotStatus, { cls: string; icon: React.ReactNode }> = {
  free: { cls: 'bg-green-50 text-green-600 border-green-200', icon: <Check size={13} /> },
  requested: { cls: 'bg-orange-50 text-orange-500 border-orange-200', icon: <Clock size={13} /> },
  reserved: { cls: 'bg-blue-50 text-blue-600 border-blue-200', icon: <Lock size={13} /> },
  class: { cls: 'bg-gray-100 text-gray-500 border-gray-200', icon: <BookOpen size={13} /> },
  unavailable: { cls: 'bg-gray-100 text-gray-400 border-gray-200', icon: <BookOpen size={13} /> },
}

export function Legend() {
  return (
    <ul className="mx-4 mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600" aria-label="Leyenda de estados" data-testid="legend">
      {(Object.keys(CELL) as SlotStatus[]).map((s) => (
        <li key={s} className="flex items-center gap-1"><span className={`flex h-4 w-4 items-center justify-center rounded border ${CELL[s].cls}`}>{CELL[s].icon}</span>{SLOT_STATUS_LABEL[s]}</li>
      ))}
    </ul>
  )
}

/** Prototype screen 7: lab × time-block grid. */
export function AvailabilityMatrix({ items, slots }: { items: LabAvailability[]; slots: TimeSlot[] }) {
  return (
    <div className="availability-scroll mx-4 mt-3 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm" role="region" aria-label="Disponibilidad por laboratorio y horario" tabIndex={0}>
      <table className="availability-table w-full border-separate border-spacing-1 text-center">
        <caption className="sr-only">Disponibilidad de laboratorios por bloque horario</caption>
        <thead>
          <tr><th scope="col" className="w-24"><span className="sr-only">Laboratorio</span></th>{slots.map((s) => <th scope="col" key={s.id} className="text-[10px] font-medium text-gray-500">{s.start_time.slice(0, 2)}h</th>)}</tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.lab.id} data-testid={`avail-${i.lab.code}`}>
              <th scope="row" className="pr-1 text-left text-[11px] font-semibold leading-tight">{i.lab.name.replace(/^Lab\. /, '')}</th>
              {slots.map((s) => {
                const c = i.cells.find((x) => x.slot_id === s.id)
                const st: SlotStatus = c?.status ?? 'free'
                return <td key={s.id}><span title={SLOT_STATUS_LABEL[st]} data-status={st} data-testid={`cell-${i.lab.code}-${s.id}`} className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md border ${CELL[st].cls}`}>{CELL[st].icon}</span></td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
