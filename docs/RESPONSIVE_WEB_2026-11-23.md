# SIGELAB responsive y azul principal — 2026-11-23

## Resultado y criterio visual

La app deja de estar limitada a una columna móvil de 448px. Conserva los flujos y componentes existentes, con navegación inferior en móvil, contenido fluido en tablet y navegación lateral desde 1024px. El contenido de escritorio tiene un máximo de 1280px; formularios, detalles y notificaciones limitan la medida de lectura a 800px. El contenido del lector tiene un ancho máximo de 544px en pantallas amplias.

El usuario indicó el color principal mediante una captura del kit: **#1A365D**, aplicado a marca, encabezados, foco, selección y acciones de todos los roles. Fondo #F4F6F8, superficies blancas y azul suave #E8EFF8. Verde, naranja y rojo siguen comunicando disponibilidad/éxito, advertencias y errores; no se usan como sustitutos de una etiqueta o icono.

Se conserva HeroUI, Lucide y la tipografía existente, sin dependencias nuevas. `design-taste-frontend` se consultó para preservar identidad; sus patrones de landing no se aplican a esta interfaz de trabajo. `no-slop-ui`, `frontend-design`, UI/UX Pro Max e Impeccable adapt/audit guían disposición, lectura y estados. Los recursos no se atribuyen a una extracción de Figma: la integración está conectada, pero el archivo rechaza acceso por falta de permisos de edición. La referencia accesible es la captura aportada por el usuario.

## Cambios

- AppShell comparte la estructura fluida, límite de contenido, cabecera y navegación; BottomNav cambia por CSS, sin detectar el dispositivo mediante JavaScript ni duplicar rutas por plataforma.
- Se conserva navegación móvil oculta donde ya se ocultaba (reserva/QR/módulos). En escritorio la navegación lateral permanece disponible también allí.
- Catálogo a dos columnas desde 768px y tres desde 1536px; solicitudes y reservas administrativas a dos columnas cuando corresponde. Filtros se pueden envolver; el horario mantiene scroll local con región identificada y foco de teclado.
- Login aprovecha dos columnas en escritorio. Módulos reutiliza AppShell; el encabezado anterior «Volver» pasa a «Módulos», que identifica la pantalla. Se oculta allí la flecha de vuelta para evitar un enlace a la propia pantalla; el resto de rutas conserva su destino de vuelta.
- Reserva organiza fecha en dos semanas de siete días en tablet/escritorio, horarios en cuatro columnas y campos relacionados en dos columnas. En móvil conserva el orden y el desplazamiento de fechas.
- Los botones flotantes de reserva permanecen dentro del área de contenido; no quedan pegados al borde físico de un monitor grande.
- Skeletons comparten el ancho y la estructura lateral. `min-height:100dvh`, `min-width:0`, etiquetas y límites de lectura evitan contenedores rígidos.
- Controles de cabecera de 44×44px, campos móviles de 16px para evitar zoom de foco en iOS, enlace de salto y margen de scroll para la cabecera fija. El orden visual del menú respeta su orden de tabulación.

## Verificación reproducible

```sh
npm run lint
npm test
npm run build:cloudflare
npm run preview:cloudflare -- --port 3300
```

En otra terminal, después de que el preview esté listo:

```sh
PLAYWRIGHT_BASE_URL=http://localhost:3300 npm run test:responsive
PLAYWRIGHT_BASE_URL=http://localhost:3300 npm run test:e2e -- --grep-invert 'estado vacío'
```

- TDD adicional: el menú de módulos mostraba un enlace «Volver» a sí mismo; la prueba falla con un enlace cuando espera cero y se corrige con `back={false}`.
- Rojo antes de implementar: el test desktop esperaba al menos 1039px de contenido a 1280px; recibió 448px.
- Tipos: código 0. Unitarios/BD local: **94/94**, diez archivos, código 0.
- Build Cloudflare: código 0, `.open-next/worker.js` generado. Sigue la advertencia preexistente de OpenNext: middleware Node experimental. No se oculta ni se cambia la reparación de cookies.
- `wrangler deploy --dry-run`: código 0, 37 assets, Worker gzip 1626.56 KiB; no publica la versión.
- La prueba responsive cubre 320, 360, 640, 768, 1280 y 1920px: ancho real, columnas, nav lateral/inferior, color calculado de cabecera, sin scroll horizontal del documento, salto por teclado, QR y controles de docente/administrador.
- Artefacto final, incluido `back={false}`: **42/42 E2E**, código 0, 2.7 minutos; los siete casos responsive están incluidos. Consola/accesibilidad de los tres roles: sin hallazgos en la suite.
- El primer recorrido completo registró 41 aprobados y un POST de login 503 durante `Reloading local server`: se modificó package.json mientras Wrangler estaba observándolo. Se repite la suite con configuración estable; no se añaden reintentos automáticos para ocultar fallos.
- Impeccable detector: `[]`, código 0, en los ocho archivos principales modificados.

Las tres pruebas de vacío usan hooks exclusivos de desarrollo y se excluyen del artefacto de producción. Esta entrega no modifica esos hooks ni habilita datos simulados en producción.

## Auditoría y revisión del diff

Base: `a5d2988` (main con reparación Cloudflare ya fusionada). `git blame` atribuye el límite original `max-w-md` al commit inicial `3df7303`. AppShell tiene **13 pantallas consumidoras**, BottomNav un consumidor de producción (AppShell); las modificaciones de ancho afectan todas esas rutas, además del login y la pantalla de error.

La revisión independiente encontró un P3: reordenar QR solo por CSS hacía diferir orden visual y de teclado en escritorio. Se eliminó el reordenamiento. También se dio margen de scroll al destino del skip link. Sin otros fallos confirmados en revisión estática. Riesgo del diff bajo: no cambian sesión, validación, servicios, acciones, RLS, base de datos, proxy o dependencias. La navegación sigue recibiendo solo el rol; los contadores conservan consultas bajo la sesión existente.

Auditoría Impeccable / Web Interface Guidelines: se verifican foco, controles etiquetados, landmarks, reflow, estados, consistencia de tokens, ausencia de medición de layout en render y respeto de reduced-motion. Las capturas comprueban geometría y lectura; no acreditan un valor de Core Web Vitals en dispositivos reales.

## Límites

Verificado con Chromium automatizado y el Worker local `workerd`, no con un despliegue actualizado ni con dispositivos físicos. Safari/iOS, Firefox, teclado virtual y cámara física requieren comprobación en esos entornos; la cámara se prueba también con frames sintéticos en la suite existente. El puerto local usa localhost, que permite acceso a cámara; en el despliegue se requiere HTTPS. No se modifica configuración de publicación ni se declara actualizado el dominio.

## Capturas del Worker final

- [Catálogo móvil · 360px](screens/responsive/catalog-360.png)
- [Catálogo tablet · 768px](screens/responsive/catalog-768.png)
- [Catálogo escritorio · 1280px](screens/responsive/catalog-1280.png)
- [Catálogo amplio · 1920px](screens/responsive/catalog-1920.png)
- [Login escritorio](screens/responsive/login-1280.png)
- [Reserva escritorio](screens/responsive/reservation-1280.png)
- [Filtros administrativos y estado vacío](screens/responsive/admin-1280.png)
- [Lector QR · 320px](screens/responsive/scan-320.png)
