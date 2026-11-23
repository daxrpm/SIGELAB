'use client'
import Link from '@/components/navigation-link'
import { usePathname } from 'next/navigation'
import { CalendarDays, ClipboardList, FlaskConical, History, Inbox, ScanLine } from 'lucide-react'
import type { Role } from '@/types'

type Item = { href: string; label: string; icon: React.ReactNode; match: string[] }

function itemsFor(role: Role): [Item, Item] {
  if (role === 'admin') return [
    { href: '/admin/requests', label: 'Solicitudes', icon: <Inbox size={20} />, match: ['/admin/requests'] },
    { href: '/admin/reservations', label: 'Reservas', icon: <History size={20} />, match: ['/admin/reservations'] },
  ]
  if (role === 'professor') return [
    { href: '/laboratories', label: 'Laboratorios', icon: <FlaskConical size={20} />, match: ['/laboratories', '/availability', '/reservations'] },
    { href: '/my-requests', label: 'Solicitudes', icon: <ClipboardList size={20} />, match: ['/my-requests'] },
  ]
  return [
    { href: '/laboratories', label: 'Laboratorios', icon: <FlaskConical size={20} />, match: ['/laboratories'] },
    { href: '/availability', label: 'Horarios', icon: <CalendarDays size={20} />, match: ['/availability'] },
  ]
}

export function BottomNav({ role, pending = 0, hideOnMobile = false }: { role: Role; pending?: number; hideOnMobile?: boolean }) {
  const path = usePathname()
  const [left, right] = itemsFor(role)
  const cell = (i: Item) => {
    const active = i.match.some((m) => path.startsWith(m))
    return (
      <Link key={i.href} href={i.href} aria-current={active ? 'page' : undefined}
        className={`app-nav-item flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? (role === 'admin' ? 'text-admin' : 'text-brand') : 'text-gray-400'}`}>
        <span className="relative">{i.icon}{i.href === '/admin/requests' && pending > 0 && <span data-testid="pending-badge" className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{pending}</span>}</span>{i.label}
      </Link>
    )
  }
  return (
    <nav className={`app-navigation${hideOnMobile ? ' app-navigation--desktop-only' : ''}`} aria-label="Navegación principal" data-role={role}>
      <Link href="/modules" className="app-nav-brand" aria-current={path === '/modules' ? 'page' : undefined}>
        <FlaskConical size={24} aria-hidden="true" /><span><b>SIGELAB</b><span className="block text-xs font-normal text-gray-500">Gestión de espacios</span></span>
      </Link>
      {cell(left)}
      <div className="app-nav-scanner flex flex-1 flex-col items-center">
        <Link href="/scan" aria-label="Escanear QR" aria-current={path.startsWith('/scan') ? 'page' : undefined} className={`app-nav-scan-link -mt-6 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ${role === 'admin' ? 'bg-admin' : 'bg-brand'}`}><ScanLine size={22} /><span className="app-nav-scan-label">Escanear QR</span></Link>
        <span className="app-nav-mobile-label pb-2 pt-0.5 text-[11px] font-medium text-gray-700" aria-hidden="true">Escanear QR</span>
      </div>
      {cell(right)}
    </nav>
  )
}
