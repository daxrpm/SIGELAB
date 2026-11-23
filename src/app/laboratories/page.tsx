import Link from '@/components/navigation-link'
import Form from 'next/form'
import { ChevronRight, Code2, Cpu, FlaskConical, Monitor, Network, Search, Server, Users, Video, Brain, Database } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { LabTabs } from '@/components/lab-tabs'
import { EmptyState } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { filterLabs, locationLabel, needsLaptop, type LabFilter } from '@/lib/domain/laboratories'
import { createClient } from '@/lib/supabase/server'
import { listLabs } from '@/services/labs'

function LabIcon({ name }: { name: string }) {
  const n = name.toLowerCase(); const p = { size: 20 }
  if (n.includes('software')) return <Code2 {...p} />
  if (n.includes('redes')) return <Network {...p} />
  if (n.includes('operativos')) return <Server {...p} />
  if (n.includes('hardware')) return <Cpu {...p} />
  if (n.includes('artificial')) return <Brain {...p} />
  if (n.includes('multimedia')) return <Video {...p} />
  if (n.includes('datos')) return <Database {...p} />
  return <FlaskConical {...p} />
}
const FILTERS: [LabFilter, string][] = [['all', 'Todos'], ['computers', 'Con computadoras'], ['laptop', 'Lleva laptop']]

export default async function LaboratoriesPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; __empty?: string }> }) {
  const user = await requireUser()
  const sp = await searchParams
  const filter = (FILTERS.some(([k]) => k === sp.filter) ? sp.filter : 'all') as LabFilter
  const q = sp.q ?? ''
  // QA hook for the empty-state mockup (screen 6); disabled in production builds
  const all = process.env.NODE_ENV !== 'production' && sp.__empty === '1' ? [] : await listLabs(await createClient())
  const labs = filterLabs(all, q, filter)
  const href = (f: LabFilter) => `/laboratories?${new URLSearchParams({ ...(q ? { q } : {}), filter: f })}`

  return (
    <AppShell user={user} title={user.role === 'student' ? 'Laboratorios' : 'Gestión de espacios'}>
      {user.role !== 'student' && <LabTabs active="labs" />}
      <Form action="/laboratories" className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 focus-within:ring-2 focus-within:ring-brand/30" role="search">
        <Search size={16} className="text-gray-400" />
        <input name="q" defaultValue={q} placeholder="Laboratorio, aula o software" aria-label="Buscar laboratorio" className="w-full py-2.5 text-sm outline-none" />
        <input type="hidden" name="filter" value={filter} />
      </Form>
      <div className="mt-3 filter-strip flex gap-2 overflow-x-auto px-4">
        {FILTERS.map(([k, label]) => (
          <Link key={k} href={href(k)} aria-current={filter === k} className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${filter === k ? 'border-brand bg-brand text-white' : 'border-gray-200 bg-white'}`}>{label}</Link>
        ))}
      </div>
      <div className="mt-4 flex items-baseline justify-between px-4">
        <h2 className="font-semibold">Laboratorios registrados</h2>
        <span data-testid="lab-count" className="text-xs text-gray-500">{labs.length} de {all.length}</span>
      </div>
      {all.length === 0 ? (
        <EmptyState icon={<FlaskConical size={26} />} title="No hay laboratorios registrados">Cuando el personal técnico registre laboratorios en el sistema, aparecerán aquí con sus características.</EmptyState>
      ) : labs.length === 0 ? (
        <EmptyState icon={<Search size={26} />} title="Sin resultados">Ningún laboratorio coincide con tu búsqueda.</EmptyState>
      ) : (
        <ul className="card-grid catalog-grid mt-2 px-4">
          {labs.map((lab) => (
            <li key={lab.id}>
              <Link href={`/laboratories/${lab.id}`} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft/60 text-brand"><LabIcon name={lab.name} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{lab.name}</span>
                  <span className="block truncate text-xs text-gray-500">{locationLabel(lab)}</span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5"><Users size={12} />{lab.capacity} personas</span>
                    {lab.computers_count !== null && lab.computers_count > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-green-800"><Monitor size={12} />{lab.computers_count} PCs</span>}
                    {needsLaptop(lab) && <span className="rounded-full bg-orange-50 px-2 py-0.5 text-orange-700">Lleva laptop</span>}
                  </span>
                </span>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}
