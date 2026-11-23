'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, ImagePlus, ScanLine, X } from 'lucide-react'
import Link from '@/components/navigation-link'
import { resolveLabQrAction } from '@/actions/qr'
import { cameraErrorMessage, parseLabQr } from '@/lib/domain/qr'
import { openCamera } from '@/lib/qr/camera'
import { createQrDecoder } from '@/lib/qr/decode'

type State = 'idle' | 'starting' | 'scanning' | 'reading' | 'resolving'

export function QrScanner() {
  const router = useRouter()
  const video = useRef<HTMLVideoElement>(null)
  const controller = useRef<AbortController | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const operation = useRef(0)
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState<string | null>(null)

  const stop = useCallback(() => {
    controller.current?.abort()
    controller.current = null
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])

  const resolve = useCallback(async (payload: string, id: number) => {
    if (id !== operation.current) return
    stop()
    const parsed = parseLabQr(payload)
    if (!parsed.ok) { setError(parsed.error); setState('idle'); return }
    setState('resolving')
    try {
      const result = await resolveLabQrAction(payload)
      if (id !== operation.current) return
      if (result.ok && result.data) router.push(result.data.href)
      else { setError(result.ok ? 'No pudimos abrir el laboratorio.' : result.error); setState('idle') }
    } catch {
      if (id === operation.current) { setError('No pudimos consultar el laboratorio. Comprueba tu conexión y reintenta.'); setState('idle') }
    }
  }, [router, stop])

  const start = useCallback(async () => {
    stop()
    const id = ++operation.current
    setError(null); setState('starting')
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('La cámara necesita HTTPS o localhost. Puedes subir una imagen del QR.'); setState('idle'); return
    }
    const abort = new AbortController()
    controller.current = abort
    try {
      const decode = await createQrDecoder()
      if (id !== operation.current || !video.current) return
      await openCamera(video.current, abort.signal)
      if (id !== operation.current) return
      setState('scanning')
      const frame = () => {
        if (abort.signal.aborted || id !== operation.current) return
        const element = video.current
        if (element && element.readyState >= 2 && element.videoWidth > 0) {
          const payload = decode(element, element.videoWidth, element.videoHeight)
          if (payload) { void resolve(payload, id); return }
        }
        timer.current = setTimeout(frame, 250)
      }
      frame()
    } catch (cause) {
      if (abort.signal.aborted || id !== operation.current) return
      stop(); setError(cameraErrorMessage(cause)); setState('idle')
    }
  }, [resolve, stop])

  useEffect(() => {
    void start()
    const onVisibility = () => {
      if (document.hidden) { ++operation.current; stop(); setState('idle') }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => { ++operation.current; stop(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [start, stop])

  async function readFile(file: File) {
    stop()
    const id = ++operation.current
    setError(null); setState('reading')
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
      setError('Selecciona una imagen de hasta 10 MB.'); setState('idle'); return
    }
    let bitmap: ImageBitmap | undefined
    try {
      bitmap = await createImageBitmap(file)
      const decode = await createQrDecoder()
      if (id !== operation.current) return
      const payload = decode(bitmap, bitmap.width, bitmap.height)
      if (!payload) { setError('No encontramos un QR en esta imagen. Prueba una foto más nítida.'); setState('idle'); return }
      await resolve(payload, id)
    } catch {
      if (id === operation.current) { setError('No pudimos leer la imagen. Prueba un archivo PNG o JPG.'); setState('idle') }
    } finally { bitmap?.close() }
  }

  const cameraActive = state === 'scanning' || state === 'starting'
  const busy = state === 'reading' || state === 'resolving'
  const status = state === 'starting' ? 'Abriendo cámara…' : state === 'scanning' ? 'Buscando un código QR…' : state === 'reading' ? 'Leyendo imagen…' : state === 'resolving' ? 'Abriendo laboratorio…' : 'Cámara apagada'

  return <div className="scanner-content space-y-5 p-4">
    <div><h2 className="text-lg font-bold">Abre un laboratorio con su QR</h2><p className="mt-1 text-sm text-gray-600">Encuadra el código del laboratorio para consultar sus equipos y disponibilidad.</p></div>
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-950" data-testid="scanner-viewport">
      <video ref={video} muted playsInline aria-label="Vista previa de la cámara" className={`h-full w-full object-cover ${cameraActive ? '' : 'invisible'}`} />
      {!cameraActive && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-white"><ScanLine size={44} strokeWidth={1.5} /><p className="text-sm">{busy ? status : 'Tu cámara aparecerá aquí'}</p></div>}
      <div className="pointer-events-none absolute inset-[18%] rounded-xl border-2 border-white/80" aria-hidden="true" />
      {cameraActive && <button type="button" aria-label="Apagar cámara" onClick={() => { ++operation.current; stop(); setState('idle') }} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-950/80 text-white"><X size={20} /></button>}
    </div>
    <p className="text-center text-sm text-gray-600" role="status" aria-live="polite">{status}</p>
    {error && <p role="alert" className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">{error}</p>}
    <div className="grid grid-cols-2 gap-3">
      <button type="button" onClick={() => void start()} disabled={cameraActive || busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-3 py-3 text-sm font-semibold text-white disabled:opacity-50"><Camera size={18} />{error ? 'Reintentar cámara' : 'Activar cámara'}</button>
      <label className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-semibold focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2 ${busy ? 'opacity-50' : ''}`}><ImagePlus size={18} />Subir imagen
        <input type="file" accept="image/*" aria-label="Subir imagen del QR" disabled={busy} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void readFile(file) }} />
      </label>
    </div>
    <div className="border-t border-gray-200 pt-4 text-sm"><p className="text-gray-600">¿Quieres probarlo sin un código impreso?</p><Link href="/scan/examples" className="mt-2 inline-flex min-h-10 items-center font-semibold text-brand">Ver QRs de prueba →</Link></div>
    <p className="text-xs leading-relaxed text-gray-500">El escaneo se realiza en tu dispositivo. Las imágenes de la cámara no se suben al servidor.</p>
  </div>
}
