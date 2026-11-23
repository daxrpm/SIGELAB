'use client'
import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from '@/components/navigation-link'
import { Button } from '@heroui/react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { createRequestAction, fetchAvailabilityAction } from '@/actions/requests'
import { equipmentNotice, locationLabel } from '@/lib/domain/laboratories'
import { addDays, dayParts, RESERVATION_TYPES, formatShortDate, SLOT_STATUS_LABEL, slotLabel, TYPE_LABEL } from '@/lib/domain/labels'
import { capacityError } from '@/lib/validation/reservation'
import { SLOT_STYLE, SLOT_TEXT_STYLE } from '@/components/ui'
import type { AvailabilityCell, Lab, TimeSlot } from '@/types'

type Props = { labs: Lab[]; slots: TimeSlot[]; requesterName: string; today: string; initial: { labId: string; date: string; slotId: number | null } }

export function ReservationForm({ labs, slots, requesterName, today, initial }: Props) {
  const [labId, setLabId] = useState(initial.labId)
  const [date, setDate] = useState(initial.date)
  const [slotId, setSlotId] = useState<number | null>(initial.slotId)
  const [type, setType] = useState('')
  const [attendees, setAttendees] = useState('')
  const [reason, setReason] = useState('')
  const [availability, setAvailability] = useState<{ date: string; cells: AvailabilityCell[]; error?: string } | null>(null)
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState<{ code: string; status: string } | null>(null)
  const [pending, start] = useTransition()

  const clear = (k: string) => setErrors((e) => { if (!e[k]) return e; const { [k]: _, ...rest } = e; return rest })
  const lab = labs.find((l) => l.id === labId)
  const slot = slots.find((s) => s.id === slotId)

  useEffect(() => {
    let cancelled = false
    fetchAvailabilityAction(date)
      .then((cells) => { if (!cancelled) setAvailability({ date, cells }) })
      .catch(() => { if (!cancelled) setAvailability({ date, cells: [], error: 'No pudimos consultar la disponibilidad. Comprueba tu conexión.' }) })
    return () => { cancelled = true }
  }, [date, availabilityAttempt])

  const availabilityLoading = availability?.date !== date
  const availabilityError = !availabilityLoading ? availability?.error : undefined
  const cells = !availabilityLoading && !availabilityError ? availability?.cells ?? [] : []
  const cellFor = (id: number) => cells.find((c) => c.lab_id === labId && c.slot_id === id)
  const selected = slotId ? cellFor(slotId) : undefined
  const blocked = selected && (selected.status === 'class' || selected.status === 'unavailable' || selected.status === 'reserved')
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i)), [today])
  const liveCapacityError = lab && attendees ? capacityError(Number(attendees), lab.capacity) : null

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)
    const next: Record<string, string> = {}
    if (!labId) next.labId = 'Selecciona un laboratorio'
    if (!slotId) next.slotId = 'Selecciona un horario'
    if (!type) next.type = 'Selecciona el tipo de reserva'
    if (!attendees || Number(attendees) < 1) next.attendees = 'Indica el número de asistentes'
    else if (liveCapacityError) next.attendees = liveCapacityError
    if (!reason.trim()) next.reason = 'Describe el motivo de la solicitud'
    if (blocked) next.slotId = 'El horario seleccionado no está disponible'
    if (slotId && (availabilityLoading || availabilityError)) next.slotId = 'Espera a que se confirme la disponibilidad'
    setErrors(next)
    if (Object.keys(next).length) return
    start(async () => {
      const res = await createRequestAction({ labId, date, slotId, type, attendees: Number(attendees), reason })
      if (res.ok) setDone({ code: res.data!.code, status: res.data!.status })
      else { setServerError(res.error); setErrors(res.fieldErrors ?? {}); setAvailability(null); setAvailabilityAttempt((n) => n + 1) }
    })
  }

  if (done) {
    return (
      <div className="m-4 space-y-3 rounded-2xl bg-white p-5 text-center shadow-sm" role="status" data-testid="request-success">
        <CheckCircle2 className="mx-auto text-green-600" size={40} />
        <h2 className="text-lg font-bold">Solicitud registrada</h2>
        <p className="font-mono text-xl" data-testid="request-code">{done.code}</p>
        <p className="text-sm">Estado inicial: <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 font-medium text-orange-700" data-testid="request-status">Pendiente</span></p>
        <Link href="/my-requests" className="block rounded-xl bg-brand py-3 text-sm font-semibold text-white">Ver mis solicitudes</Link>
      </div>
    )
  }

  const err = (k: string) => errors[k] && <p role="alert" className="mt-1 text-xs text-red-600">{errors[k]}</p>
  const notice = lab ? equipmentNotice(lab) : null

  return (
    <form onSubmit={submit} noValidate className="space-y-4 p-4">
      <div className="rounded-xl bg-white p-3 text-sm shadow-sm"><span className="block text-xs text-gray-500">Solicitante</span><b>{requesterName} (Docente)</b></div>
      <div className="reservation-details space-y-4 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="reservation-full-row font-semibold">Detalles de la reserva</h2>

        <label className="reservation-full-row block text-xs text-gray-600">Laboratorio *
          <select value={labId} onChange={(e) => { setLabId(e.target.value); setSlotId(null); clear('labId'); clear('slotId') }} aria-label="Laboratorio" className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900">
            <option value="">Selecciona un laboratorio</option>
            {labs.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.capacity} pers.</option>)}
          </select>
          {lab && <span className="mt-1 block text-gray-500">{locationLabel(lab)}{notice && ` · ${notice.tone === 'ok' ? 'No necesitas traer equipo' : notice.tone === 'warning' ? 'Puede requerir laptop' : 'Equipos sin información'}`}</span>}
          {err('labId')}
        </label>

        <div className="reservation-full-row">
          <p className="text-xs text-gray-600">Fecha *</p>
          <div className="reservation-date-strip mt-1 flex gap-2 overflow-x-auto pb-1">
            {days.map((d) => { const p = dayParts(d); const a = d === date
              return <button type="button" key={d} onClick={() => { setDate(d); setSlotId(null) }} aria-pressed={a} data-testid={`pick-date-${d}`}
                className={`flex w-12 shrink-0 flex-col items-center rounded-xl border py-1.5 ${a ? 'border-brand bg-brand text-white' : 'border-gray-200'}`}><span className="text-[10px] opacity-70">{p.weekday}</span><span className="text-lg font-bold leading-tight">{p.day}</span><span className="text-[10px] opacity-70">{d === today ? 'hoy' : p.month}</span></button> })}
          </div>
        </div>

        <div className="reservation-full-row">
          <p className="text-xs text-gray-600">Horario *</p>
          <div className="mt-1 grid grid-cols-2 gap-2 md:grid-cols-4">
            {slots.map((s) => {
              const c = labId ? cellFor(s.id) : undefined
              const status = c?.status ?? 'free'
              const disabled = !labId || availabilityLoading || !!availabilityError || status === 'class' || status === 'unavailable'
              const sel = slotId === s.id
              return (
                <button type="button" key={s.id} disabled={disabled} onClick={() => { setSlotId(s.id); clear('slotId') }} aria-pressed={sel} data-testid={`pick-slot-${s.id}`} data-status={availabilityLoading ? 'loading' : availabilityError ? 'unknown' : status}
                  className={`rounded-lg border px-2 py-2 text-center text-sm font-medium ${SLOT_STYLE[status]} ${sel ? 'ring-2 ring-brand' : ''} ${disabled ? 'cursor-not-allowed' : ''}`}>
                  {slotLabel(s).replace(/ /g, '')}<span className={`block text-[11px] ${availabilityLoading || availabilityError ? 'text-gray-500' : SLOT_TEXT_STYLE[status]}`}>{availabilityLoading ? 'Consultando…' : availabilityError ? 'Sin verificar' : labId ? SLOT_STATUS_LABEL[status] : '—'}</span>
                </button>
              )
            })}
          </div>
          {err('slotId')}
          {availabilityError && <div role="alert" className="mt-2 text-sm text-red-700"><p>{availabilityError}</p><button type="button" className="mt-1 min-h-10 font-semibold underline" onClick={() => { setAvailability(null); setAvailabilityAttempt((n) => n + 1) }}>Reintentar disponibilidad</button></div>}
        </div>

        {lab && slot && selected && !blocked && (
          <div className="flex gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900" data-testid="availability-ok"><CheckCircle2 size={18} className="shrink-0" /><div><b>Laboratorio disponible</b><br />{lab.name} está libre el {formatShortDate(date)} de {slotLabel(slot)}.</div></div>
        )}
        {lab && slot && blocked && (
          <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" data-testid="availability-blocked"><XCircle size={18} className="shrink-0" /><div><b>No disponible</b><br />{selected?.reserved_code ? `Ya existe una reserva confirmada (${selected.reserved_code}) para ese laboratorio y horario.` : 'El laboratorio tiene clase u otra restricción en ese horario.'}</div></div>
        )}

        <div>
          <p className="text-xs text-gray-600">Tipo de reserva *</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {RESERVATION_TYPES.map((t) => <button type="button" key={t} aria-pressed={type === t} onClick={() => { setType(t); clear('type') }} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${type === t ? 'border-brand bg-brand text-white' : 'border-gray-200'}`}>{TYPE_LABEL[t]}</button>)}
          </div>
          {err('type')}
        </div>

        <label className="block text-xs text-gray-600">Número de asistentes *{lab && <span> (máx. {lab.capacity})</span>}
          <input type="number" inputMode="numeric" min={1} value={attendees} onChange={(e) => { setAttendees(e.target.value); clear('attendees') }} aria-label="Número de asistentes" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900" />
          {liveCapacityError ? <p role="alert" className="mt-1 text-xs text-red-600">{liveCapacityError}</p> : err('attendees')}
        </label>

        <label className="reservation-full-row block text-xs text-gray-600">Motivo de la solicitud *
          <textarea value={reason} onChange={(e) => { setReason(e.target.value); clear('reason') }} rows={3} maxLength={500} aria-label="Motivo de la solicitud" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900" />
          {err('reason')}
        </label>
      </div>
      {serverError && <p role="alert" data-testid="server-error" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{serverError}</p>}
      <Button type="submit" variant="primary" fullWidth isPending={pending} isDisabled={!!blocked || !!availabilityError} className="!bg-brand">Enviar solicitud</Button>
    </form>
  )
}
