import Link from '@/components/navigation-link'
import { Bell } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { EmptyState } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { formatDateTime } from '@/lib/domain/labels'
import { createClient } from '@/lib/supabase/server'
import { listNotifications } from '@/services/requests'
import { MarkRead } from './mark-read'

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser()
  const { page: rawPage } = await searchParams
  const parsedPage = Number(rawPage)
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 && parsedPage <= 10000 ? parsedPage : 1
  const batch = await listNotifications(await createClient(), page)
  const items = batch.slice(0, 30)
  const link = (id: string | null) => (id && user.role === 'professor' ? `/my-requests/${id}` : null)
  return (
    <AppShell contentWidth="narrow" user={user} title="Notificaciones" back="/">
      {items.length === 0 ? <EmptyState icon={<Bell size={26} />} title="Sin notificaciones" /> : (
        <ul className="m-4 space-y-2" data-testid="notifications">
          {items.map((n) => {
            const href = link(n.request_id)
            const body = <><p className={`text-sm ${n.read ? '' : 'font-semibold'}`}>{n.message}</p><p className="text-xs text-gray-500">{formatDateTime(n.created_at)}</p></>
            return <li key={n.id} className="rounded-xl bg-white p-3 shadow-sm">{href ? <Link href={href}>{body}</Link> : body}</li>
          })}
        </ul>
      )}
      <div className="mx-4 flex items-center justify-between gap-3 text-sm">
        {page > 1 ? <Link href={`/notifications?page=${page - 1}`} className="min-h-10 rounded-lg border border-gray-200 bg-white px-4 py-2">Más recientes</Link> : <span />}
        {batch.length > 30 && <Link href={`/notifications?page=${page + 1}`} className="min-h-10 rounded-lg border border-gray-200 bg-white px-4 py-2">Más antiguas</Link>}
      </div>
      {items.some((n) => !n.read) && <MarkRead ids={items.filter((n) => !n.read).map((n) => n.id)} />}
    </AppShell>
  )
}
