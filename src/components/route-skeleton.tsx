type Variant = 'catalog' | 'availability' | 'requests' | 'form'

export function RouteSkeleton({ variant = 'catalog', admin = false }: { variant?: Variant; admin?: boolean }) {
  const bar = (className: string) => <div className={`skeleton-block rounded bg-gray-100 ${className}`} />
  return <div className="app-shell" role="status" aria-label="Cargando página" data-testid="route-skeleton">
    <div className={`app-header flex h-[4.25rem] items-center gap-3 px-4 ${admin ? 'bg-admin' : 'bg-brand'}`} aria-hidden="true"><div className="h-5 w-5 rounded bg-white/20" /><div className="h-4 w-40 rounded bg-white/20" /></div>
    <div className="app-main" aria-hidden="true"><div className={`page-content${variant === 'form' ? ' page-content--narrow' : ''}`}><div className="space-y-4 p-4">
      <div className="h-11 rounded-xl bg-white" />
      {variant === 'availability' && <div className="flex gap-2">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-16 flex-1 rounded-xl bg-white" />)}</div>}
      {variant === 'form' ? <div className="space-y-6 rounded-2xl bg-white p-4">{[1, 2, 3, 4].map((i) => <div key={i} className="space-y-2">{bar('h-3 w-28')}{bar('h-11 w-full')}</div>)}</div>
        : <div className={variant === 'availability' ? 'space-y-4' : `card-grid${variant === 'catalog' ? ' catalog-grid' : ''}`}>{[1, 2, 3].map((i) => <div key={i} className="space-y-3 rounded-2xl bg-white p-4">
          {bar('h-4 w-2/3')}{bar('h-3 w-5/6')}{bar('h-3 w-1/2')}
          {variant === 'requests' && <div className="flex gap-2 pt-2">{bar('h-10 flex-1')}{bar('h-10 flex-1')}</div>}
          {variant === 'availability' && <div className="grid grid-cols-7 gap-2 pt-2">{[1, 2, 3, 4, 5, 6, 7].map((n) => <div key={n}>{bar('h-7 w-full')}</div>)}</div>}
        </div>)}</div>}
    </div></div></div>
    <div className="app-navigation app-navigation--desktop-only app-skeleton-nav" aria-hidden="true">{bar('h-10 w-36 mb-6')}{[1, 2, 3].map((i) => <div key={i}>{bar('h-12 w-full')}</div>)}</div>
    <span className="sr-only">Cargando…</span>
  </div>
}
