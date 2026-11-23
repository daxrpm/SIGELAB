'use client'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-4 bg-surface p-6">
    <h1 className="text-xl font-bold">No pudimos cargar esta pantalla</h1>
    <p className="text-sm text-gray-600">Comprueba tu conexión e inténtalo de nuevo.</p>
    <button type="button" onClick={reset} className="rounded-lg bg-brand px-4 py-3 font-semibold text-white">Reintentar</button>
  </main>
}
