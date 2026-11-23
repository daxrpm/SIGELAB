import Image from 'next/image'
import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import examples from '../../../../public/qr/manifest.json'

export default async function QrExamplesPage() {
  const user = await requireUser()
  return <AppShell contentWidth="narrow" user={user} title="QRs de prueba" back="/scan" hideNav>
    <div className="space-y-4 p-4">
      <p className="text-sm text-gray-600">Escanea desde otra pantalla o descarga una imagen y súbela al lector. Estos códigos no crean reservas ni modifican datos.</p>
      {examples.map((example) => <article key={example.file} className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold">{example.title}</h2><p className="mt-1 text-xs text-gray-500">{example.expected}</p>
        <Image src={`/qr/${example.file}.png`} alt={`QR de prueba: ${example.title}`} width={200} height={200} unoptimized className="mx-auto my-3" />
        <p className="break-all text-center font-mono text-xs text-gray-600">{example.payload}</p>
        <a href={`/qr/${example.file}.png`} download className="mt-3 block rounded-lg border border-gray-300 py-2.5 text-center text-sm font-semibold text-brand">Descargar PNG</a>
      </article>)}
    </div>
  </AppShell>
}
