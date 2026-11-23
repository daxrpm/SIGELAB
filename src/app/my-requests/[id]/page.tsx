import { redirect } from 'next/navigation'
import { CalendarDays, ClipboardList, Clock, FlaskConical, Sparkles, Users } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { StatusChip } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { formatDateTime, formatLongDate, slotLabel, STATUS_LABEL, TYPE_LABEL } from '@/lib/domain/labels'
import { createClient } from '@/lib/supabase/server'
import { listTimeSlots } from '@/services/labs'
import { getRequestDetail } from '@/services/requests'
import { CancelButton } from './cancel-button'

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('professor')
  const { id } = await params
  const db = await createClient()
  const detail = await getRequestDetail(db, id)
  // RLS returns nothing for other professors' requests: indistinguishable from "not found" on purpose
  if (!detail || detail.request.requester_id !== user.id) redirect('/restricted?from=own')
  const { request: r, history } = detail
  const slots = await listTimeSlots(db)
  const slot = slots.find((s) => s.id === r.slot_id)!
  const Row = ({ k, v, icon }: { k: string; v: string; icon: React.ReactNode }) => <div className="flex gap-3 border-b border-gray-100 py-3 last:border-0"><span className="mt-0.5 text-gray-400">{icon}</span><div><dt className="text-xs text-gray-500">{k}</dt><dd className="text-sm font-medium">{v}</dd></div></div>

  return (
    <AppShell contentWidth="narrow" user={user} title={r.code} back="/my-requests">
      <div className="m-4 flex items-start justify-between rounded-2xl bg-white p-4 shadow-sm">
        <div><p className="text-xs text-gray-500">Estado actual</p><StatusChip status={r.status} /></div>
        <div className="text-right"><p className="text-xs text-gray-500">Registrada</p><p className="text-sm font-medium">{formatDateTime(r.created_at)}</p></div>
      </div>
      {r.status === 'rejected' && r.rejection_reason && (
        <div className="mx-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" data-testid="rejection-reason"><p className="font-semibold">Motivo del rechazo</p><p>{r.rejection_reason}</p></div>
      )}
      <h2 className="mx-4 mt-5 font-semibold">Datos de la solicitud</h2>
      <dl className="mx-4 mt-2 rounded-2xl bg-white px-4 shadow-sm">
        <Row icon={<FlaskConical size={16} />} k="Laboratorio" v={`${r.lab.name} · ${r.lab.code}`} />
        <Row icon={<CalendarDays size={16} />} k="Fecha" v={formatLongDate(r.date)} />
        <Row icon={<Clock size={16} />} k="Horario" v={slotLabel(slot)} />
        <Row icon={<Sparkles size={16} />} k="Tipo de reserva" v={TYPE_LABEL[r.reservation_type]} />
        <Row icon={<Users size={16} />} k="Asistentes" v={`${r.attendees} de ${r.lab.capacity} personas`} />
        <Row icon={<ClipboardList size={16} />} k="Motivo" v={r.reason} />
      </dl>
      <h2 className="mx-4 mt-5 font-semibold">Seguimiento</h2>
      <ol className="mx-4 mt-2 space-y-2" data-testid="history">
        {history.map((h) => (
          <li key={h.id} className="rounded-xl bg-white p-3 text-sm shadow-sm">
            <span className="font-medium">{STATUS_LABEL[h.to_status]}</span>
            <span className="ml-2 text-xs text-gray-500">{formatDateTime(h.changed_at)}</span>
            {h.reason && <p className="text-xs text-gray-600">{h.reason}</p>}
          </li>
        ))}
      </ol>
      {(r.status === 'pending' || r.status === 'approved') && <div className="mx-4 mt-4"><CancelButton id={r.id} /></div>}
    </AppShell>
  )
}
