import { AppShell } from '@/components/app-shell'
import { requireRole } from '@/lib/auth'
import { addDays, isValidIsoDate, todayLocal } from '@/lib/domain/labels'
import { createClient } from '@/lib/supabase/server'
import { listLabs, listTimeSlots } from '@/services/labs'
import { ReservationForm } from './reservation-form'

export default async function NewReservationPage({ searchParams }: { searchParams: Promise<{ lab?: string; date?: string; slot?: string }> }) {
  const user = await requireRole('professor')
  const sp = await searchParams
  const db = await createClient()
  const [labs, slots] = await Promise.all([listLabs(db), listTimeSlots(db)])
  const today = todayLocal()
  const date = isValidIsoDate(sp.date) && sp.date >= today && sp.date <= addDays(today, 13) ? sp.date : today
  return (
    <AppShell contentWidth="narrow" user={user} title="Nueva reserva" back="/availability" hideNav>
      <ReservationForm labs={labs} slots={slots} requesterName={user.fullName} initial={{ labId: sp.lab ?? '', date, slotId: sp.slot ? Number(sp.slot) : null }} today={today} />
    </AppShell>
  )
}
