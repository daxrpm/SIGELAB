import Link from '@/components/navigation-link'
import { ChevronRight, Headset, ImageIcon, LayoutGrid, Laptop, Archive, FileWarning, Network } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { homePathFor, requireUser } from '@/lib/auth'

const OTHER_MODULES = [
  { name: 'Objetos Perdidos', icon: <Archive size={20} />, tint: 'bg-orange-50 text-orange-500' },
  { name: 'Préstamo de Equipos', icon: <Laptop size={20} />, tint: 'bg-blue-50 text-blue-500' },
  { name: 'Reportes de daños', icon: <ImageIcon size={20} />, tint: 'bg-teal-50 text-teal-500' },
  { name: 'Gestión de incidencias', icon: <FileWarning size={20} />, tint: 'bg-red-50 text-red-400' },
]

/** Screen 2 of the prototype: Lab-fis module menu. Only "Gestión de espacios" belongs to this group. */
export default async function ModulesPage() {
  const user = await requireUser()
  const row = (name: string, icon: React.ReactNode, tint: string) => (
    <div key={name} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 opacity-90">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>{icon}</span>
      <span className="flex-1 text-sm font-semibold">{name}</span><ChevronRight size={16} className="text-gray-300" />
    </div>
  )
  return (
    <AppShell user={user} title="Módulos" back={false} hideNav>
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand/60 text-brand"><Network size={26} /></span>
          <div><p className="text-2xl font-bold text-brand">Lab-fis</p><p className="text-xs text-gray-500">Laboratorio de la Facultad de Sistemas</p></div>
        </div>
        <div className="module-grid space-y-3 md:space-y-0">
        {OTHER_MODULES.slice(0, 3).map((m) => row(m.name, m.icon, m.tint))}
        {OTHER_MODULES.slice(3).map((m) => row(m.name, m.icon, m.tint))}
        <Link href={homePathFor(user.role)} data-testid="module-spaces" className="flex items-center gap-3 rounded-xl border-2 border-brand bg-white p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500"><LayoutGrid size={20} /></span>
          <span className="flex flex-1 items-center gap-2 text-sm font-semibold">Gestión de espacios <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">GRUPO 7</span></span>
          <ChevronRight size={16} className="text-gray-400" />
        </Link>
        {row('Solicitudes de soporte', <Headset size={20} />, 'bg-pink-50 text-pink-500')}
        </div>
        <p className="rounded-lg bg-white p-3 text-xs text-gray-500">Toca <b>Gestión de espacios</b> para abrir el módulo de laboratorios. Los demás módulos pertenecen a los otros grupos.</p>
      </div>
    </AppShell>
  )
}
