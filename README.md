# SIGELAB · Gestión de espacios (Lab-fis · FIS · Grupo 7)

Módulo web para consultar laboratorios, ver su disponibilidad, solicitar reservas y gestionarlas.
Stack: **Next.js 16 · TypeScript · Tailwind CSS 4 · HeroUI 3 · Supabase (Auth + PostgreSQL + RLS)**.

**Actualización 2026-11-22:** navegación con feedback inmediato, skeletons por pantalla, búsquedas sin recarga completa y lector QR funcional. Evidencia y límites en [`docs/IMPLEMENTATION_2026-11-22.md`](docs/IMPLEMENTATION_2026-11-22.md).

**Responsive web · 2026-11-23:** móvil, tablet y escritorio, navegación lateral y azul principal `#1A365D`. Capturas, pruebas y límites en [`docs/RESPONSIVE_WEB_2026-11-23.md`](docs/RESPONSIVE_WEB_2026-11-23.md).

**Cloudflare/OpenNext:** build reproducible con adaptador fijado, proxy Node y parche verificado en `workerd` para el bug de cookies. Comandos, variables de build, advertencia experimental y límites del despliegue en [`docs/CLOUDFLARE_COOKIE_FIX.md`](docs/CLOUDFLARE_COOKIE_FIX.md).

## Probar el lector QR
- Abre **Escanear QR** desde la navegación inferior. La cámara necesita **HTTPS o localhost**; si no está disponible, usa **Subir imagen**.
- Los [QRs sintéticos](public/qr/manifest.json) están también en `/scan/examples`: LAB-01, LAB-03, LAB-08, un laboratorio inexistente y un código inválido. Descárgalos o muéstralos en otra pantalla.
- El formato `SIGELAB:LAB:LAB-03` se interpreta en el lector de esta app y abre el detalle del laboratorio. No crea reservas ni cambia estados.
- `npm run qr:generate` regenera los cinco PNG sin conectarse a la base.
- Para la demo con rendimiento de producción: `npm run build` y luego `npm start`. `next dev` incluye compilación y herramientas de desarrollo.

**Base de datos:** aplicar `supabase/migrations/20261122000005_review_fixes.sql` en el proyecto Supabase para activar las correcciones de roles, contador y aprobaciones vencidas. La migración fue probada localmente; no se ejecutó contra la base remota durante este trabajo.

> **Estado:** HU-01 a HU-06 implementadas y verificadas contra el proyecto Supabase SIGELAB real (PostgreSQL + Auth + RLS). Resultados reales y limitaciones en [`docs/TEST_EVIDENCE.md`](docs/TEST_EVIDENCE.md). Pendiente de tu parte: subir a GitHub y desplegar.

## Historias implementadas
| HU | Funcionalidad | Ruta |
|----|---------------|------|
| HU-01 | Laboratorios y detalle, aviso «¿Debo llevar mi equipo?», «Sin información registrada» | `/laboratories`, `/laboratories/[id]` |
| HU-02 | Disponibilidad por fecha/horario, filtro «Solo laboratorios disponibles» | `/availability` |
| HU-03 | Nueva reserva con validación, capacidad, solapamientos, código `SOL-AAAA-NNNN` | `/reservations/new` |
| HU-04 | Registro de reservas (admin): filtros por laboratorio/estado/conflicto, etiqueta «Conflicto» | `/admin/reservations` |
| HU-05 | Mis solicitudes (docente), detalle, motivo de rechazo, notificaciones, «Acceso restringido» | `/my-requests`, `/notifications` |
| HU-06 | Aprobar/rechazar (admin), motivo obligatorio, bloqueo por conflicto, historial | `/admin/requests` |

## Arquitectura
```
src/app/            Rutas y páginas (Server Components) + formularios cliente
src/components/     UI compartida (shell, navegación, chips)
src/lib/domain/     Lógica de negocio pura (filtros, avisos, fechas, errores)
src/lib/validation/ Esquemas zod (frontend y server actions)
src/lib/supabase/   Clientes SSR y refresco de sesión (proxy.ts)
src/services/       Acceso a datos (reciben el cliente Supabase; RLS aplica siempre)
src/actions/        Server Actions (verifican rol en servidor y llaman a RPC)
supabase/migrations Esquema, funciones transaccionales y RLS
supabase/seed.sql   Catálogo demo de 8 laboratorios
scripts/seed-demo.ts Usuarios y solicitudes demo (solo contra el proyecto NUEVO)
tests/db            Integración: migraciones reales sobre PostgreSQL local (PGlite)
tests/unit          Unitarias: dominio y validación
docs/               HU, backlog, evidencias, decisiones, retrospectiva, guías
```
**Seguridad en capas:** `proxy.ts` exige sesión → Server Actions comprueban rol → funciones SQL `security definer` comprueban rol otra vez → RLS limita lectura → índice único parcial impide dos reservas aprobadas en el mismo laboratorio/fecha/bloque. El rol vive en `profiles` y se asigna solo vía `app_metadata` (servidor); el cliente no puede cambiarlo.

## Ejecutar localmente
Requisitos: Node 22+, un proyecto Supabase **nuevo** con las migraciones aplicadas ([`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md)).
```bash
npm install
cp .env.example .env.local     # completa los valores del proyecto SIGELAB
npm run check:env              # valida el .env.local sin imprimir secretos
npm run seed:demo              # cuentas y solicitudes demo (idempotente)
npm run dev                    # http://localhost:3000
```
Cuentas demo (contraseña = `DEMO_PASSWORD` de tu `.env.local`): `ana.martinez@` (estudiante), `carla.mendoza@` y `diego.salazar@` (docentes), `jorge.vasconez@` (administrador), dominio `epn.edu.ec`.

## Pruebas
| Comando | Qué ejecuta |
|---|---|
| `npm run lint` | TypeScript |
| `npm test` | Unitarias + PostgreSQL local (PGlite), sin red |
| `npm run test:live` | API contra Supabase real (requiere `.env.local` y seed) |
| `npm run test:e2e` | Navegador (Playwright/Chromium; primera vez: `npx playwright install chromium`) |
| `npm run verify:supabase` | Verificación de solo lectura del proyecto |

## Subir a GitHub (lo haces tú; no se ejecutó nada)
```bash
cd SIGELAB
git init && git branch -M main
git add . && git status          # comprueba que .env.local NO aparece
git commit -m "feat: SIGELAB gestión de espacios"
git remote add origin https://github.com/<usuario>/<repo>.git
git push -u origin main
```

## Desplegar en Vercel
Ver [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md).

## Estado real y pendientes
Ver [`docs/TEST_EVIDENCE.md`](docs/TEST_EVIDENCE.md) (qué está verificado y qué no).
