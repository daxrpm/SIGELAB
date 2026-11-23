import Link from '@/components/navigation-link'
import { ArrowLeft, Bell, LogOut } from 'lucide-react'
import { Suspense, type ReactNode } from 'react'
import { signOutAction } from '@/actions/auth'
import { ROLE_LABEL } from '@/lib/domain/labels'
import { createClient } from '@/lib/supabase/server'
import { unreadCount } from '@/services/requests'
import type { SessionUser } from '@/types'
import { BottomNav } from './bottom-nav'

async function NotificationLink() {
  const unread = await unreadCount(await createClient())
  return <Link href="/notifications" aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ''}`} className="relative inline-flex h-11 w-11 items-center justify-center">
    <Bell size={20} />
    {unread > 0 && <span data-testid="unread-badge" className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
  </Link>
}

async function AdminNav({ hideOnMobile }: { hideOnMobile?: boolean }) {
  const db = await createClient()
  const { count } = await db.from('reservation_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  return <BottomNav role="admin" pending={count ?? 0} hideOnMobile={hideOnMobile} />
}

export function AppShell({ user, title, back, children, hideNav, contentWidth = 'wide' }: {
  user: SessionUser; title: string; back?: string | false; children: ReactNode; hideNav?: boolean; contentWidth?: 'wide' | 'narrow'
}) {
  const bg = user.role === 'admin' ? 'bg-admin' : 'bg-brand'
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      <header className={`app-header ${bg} sticky top-0 z-30 flex items-center gap-3 px-4 py-3 text-white`}>
        {back !== false && <Link href={back ?? '/modules'} aria-label="Volver" className="inline-flex h-11 w-11 shrink-0 items-center justify-center"><ArrowLeft size={20} /></Link>}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight">{title}</h1>
          <p className="truncate text-xs opacity-80">{user.fullName} • {ROLE_LABEL[user.role]}</p>
        </div>
        <Suspense fallback={<Link href="/notifications" aria-label="Notificaciones" className="inline-flex h-11 w-11 items-center justify-center"><Bell size={20} /></Link>}><NotificationLink /></Suspense>
        <form action={signOutAction}><button aria-label="Cerrar sesión" title="Cerrar sesión" className="inline-flex h-11 w-11 items-center justify-center"><LogOut size={20} /></button></form>
      </header>
      <main id="main-content" tabIndex={-1} className="app-main"><div className={`page-content page-content--${contentWidth}`}>{children}</div></main>
      {user.role === 'admin'
        ? <Suspense fallback={<BottomNav role="admin" hideOnMobile={hideNav} />}><AdminNav hideOnMobile={hideNav} /></Suspense>
        : <BottomNav role={user.role} hideOnMobile={hideNav} />}
    </div>
  )
}
