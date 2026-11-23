import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Notice } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { equipmentNotice, locationLabel, NO_INFO } from '@/lib/domain/laboratories'
import { createClient } from '@/lib/supabase/server'
import { getLab } from '@/services/labs'
import Link from '@/components/navigation-link'
import { Code2, MapPin, Monitor, Presentation, Users, Wrench } from 'lucide-react'
import { getAvailability } from '@/services/availability'
import { listTimeSlots } from '@/services/labs'
import { slotLabel, todayLocal } from '@/lib/domain/labels'

function Row({ label, icon, children, missing }: { label: string; icon: React.ReactNode; children: React.ReactNode; missing?: boolean }) {
  return (
    <div className="flex gap-3 border-b border-gray-100 py-3 last:border-0">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div className="min-w-0"><dt className="text-xs text-gray-500">{label}</dt>
      <dd className={`text-sm ${missing ? 'italic text-gray-400' : 'font-medium'}`} data-missing={missing ? 'true' : undefined}>{children}</dd></div>
    </div>
  )
}

export default async function LabDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const lab = await getLab(await createClient(), id)
  if (!lab) notFound()
  const notice = equipmentNotice(lab)
  // "Ocupado ahora" chip: current block in Ecuador time
  const db = await createClient()
  const [slots, cells] = await Promise.all([listTimeSlots(db), getAvailability(db, todayLocal())])
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Guayaquil', hour: '2-digit', hour12: false }).format(new Date()))
  const current = slots.find((s) => hour >= Number(s.start_time.slice(0, 2)) && hour < Number(s.end_time.slice(0, 2)))
  const currentStatus = current ? cells.find((c) => c.lab_id === lab.id && c.slot_id === current.id)?.status : undefined
  const busyNow = currentStatus && currentStatus !== 'free'
  const list = (a: string[] | null) => (a && a.length ? a.join(', ') : null)
  const software = list(lab.software), extra = list(lab.extra_equipment)

  return (
    <AppShell contentWidth="narrow" user={user} title={lab.code} back="/laboratories">
      <section className="m-4 rounded-2xl bg-brand p-4 text-white">
        <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-semibold">{lab.code}</span>
        <h2 className="mt-3 text-xl font-bold">{lab.name}</h2>
        <p className="text-sm opacity-80">{locationLabel(lab)}</p>
        {current && <span data-testid="now-chip" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-900"><span className={`h-2 w-2 rounded-full ${busyNow ? 'bg-red-500' : 'bg-green-500'}`} />{busyNow ? 'Ocupado ahora' : 'Libre ahora'} · {slotLabel(current).replace(/ /g, '')}</span>}
      </section>
      <div className="mx-4"><Notice tone={notice.tone} title={notice.title}>{notice.body}</Notice></div>
      <h3 className="mx-4 mt-5 font-semibold">Características</h3>
      <dl className="detail-properties mx-4 mt-2 rounded-2xl bg-white px-4 shadow-sm">
        <Row label="Ubicación" icon={<MapPin size={16} />}>{locationLabel(lab)}</Row>
        <Row label="Capacidad" icon={<Users size={16} />}>{lab.capacity} personas</Row>
        <Row label="Computadoras" icon={<Monitor size={16} />} missing={lab.computers_count === null}>{lab.computers_count === null ? NO_INFO : lab.computers_count === 0 ? 'Sin computadoras fijas' : `${lab.computers_count} equipos de escritorio`}</Row>
        <Row label="Proyector" icon={<Presentation size={16} />} missing={lab.has_projector === null}>{lab.has_projector === null ? NO_INFO : lab.has_projector ? 'Disponible' : 'No disponible'}</Row>
        <Row label="Software instalado" icon={<Code2 size={16} />} missing={!software}>{software ?? NO_INFO}</Row>
        <Row label="Equipamiento adicional" icon={<Wrench size={16} />} missing={!extra}>{extra ?? NO_INFO}</Row>
      </dl>
      {user.role === 'professor' && (
        <div className="mx-4 mt-4"><Link href={`/reservations/new?lab=${lab.id}`} className="block rounded-xl bg-brand py-3 text-center text-sm font-semibold text-white">Reservar este laboratorio</Link></div>
      )}
    </AppShell>
  )
}
