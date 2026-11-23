import { AppShell } from '@/components/app-shell'
import { requireUser } from '@/lib/auth'
import { QrScanner } from './qr-scanner'

export default async function ScanPage() {
  const user = await requireUser()
  return <AppShell contentWidth="narrow" user={user} title="Escanear QR" back="/laboratories" hideNav><QrScanner /></AppShell>
}
