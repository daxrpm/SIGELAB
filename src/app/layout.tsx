import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'SIGELAB · Gestión de espacios', description: 'Reserva y disponibilidad de laboratorios · Lab-fis FIS · Grupo 7' }
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body className="min-h-dvh antialiased">{children}</body></html>
}
