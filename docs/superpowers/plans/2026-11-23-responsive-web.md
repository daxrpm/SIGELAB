# SIGELAB responsive web — plan de implementación

Objetivo aprobado: conservar la identidad y flujos móviles, adaptar tablet y escritorio con navegación lateral, contenido amplio, columnas y formularios legibles. Kit Figma pendiente: la integración rechaza el archivo por permisos de edición; no atribuirle recursos que no se han podido leer.

Arquitectura: reutilizar AppShell y BottomNav; un solo árbol de navegación que cambia de disposición con CSS. Usar tokens existentes, sin dependencias ni cambios en autenticación, dominio, BD o configuración Cloudflare. HeroUI y Lucide siguen vigentes. Actualización explícita del usuario: azul principal #1A365D según captura del kit; superficie #F4F6F8 y azul suave #E8EFF8. Verde reservado a estados semánticos y tipografía de sistema existente. Modo Operate; movimiento discreto 150ms, sin efectos decorativos.

- [x] TDD: prueba geométrica móvil/tablet/escritorio y recorrido de navegación; comprobar rojo en Worker actual.
- [x] Shell fluido y navegación lateral desde 1024px; móvil sin máximo 448px; contenido acotado a 1280px. Nav y skeleton ocupan el mismo espacio. Main y regiones con ancho mínimo 0 para evitar desbordamientos.
- [x] Login, módulos y catálogo: aprovechar el espacio con columnas; formularios/detalles/QR limitados para lectura y cámara. Adaptar listados administrativos y filtros, tabla de horarios con scroll local accesible.
- [x] Verificar 360, 768, 1280, 1920px y borde 320px; roles, teclado, zoom, cargas, cámara simulada y operaciones existentes. Build y workerd; no sustituir por next start.
- [x] Audit Impeccable/Web Interface Guidelines y revisión del diff; guardar capturas y evidencia, commits semánticos firmados sin coautor; push y PR.
