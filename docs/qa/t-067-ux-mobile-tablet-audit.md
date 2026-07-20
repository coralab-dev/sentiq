# T-067 UX mobile/tablet audit

| Campo | Valor |
| --- | --- |
| Fecha | 2026-07-20 |
| Base auditada | `master` en `6a3fdf0e8fe286861d91758b6095c7b7c1b39033` más los cambios locales de esta rama |
| Commit del rediseño | `6a3fdf0e8fe286861d91758b6095c7b7c1b39033` |
| Commit del fix | Sin commit; cambios locales auditados por restricción de COR-137 |
| Rama | `balamsilva26/cor-137-fix-ux-redesign-regressions` |
| Estado | `PASS WITH CAVEATS` |

## Dictamen

`PASS WITH CAVEATS`. Las correcciones de copy, encoding, jerarquía, responsive y navegación autenticada fueron verificadas localmente. Los flujos QR y dispositivo activos se ejecutaron con enlaces QA privados y datos ficticios, sin registrar sus valores en esta evidencia. El despliegue público conserva parte del copy anterior porque no se hizo deploy; el mensaje corregido del dispositivo se verificó contra el build local auditado. No se registraron tokens, correos, teléfonos ni credenciales.

## Alcance auditado

Se revisaron y/o ajustaron:

- Landing pública.
- Login.
- Aviso de privacidad.
- Encuesta QR y encuesta en dispositivo.
- Shell del restaurante y menú móvil “Más”.
- Dashboard, respuestas, alertas, exportación y configuración.
- Tablas, inspectores y diálogos compartidos.
- Copy operativo del alta de restaurantes y estados compartidos.

No se modificaron contratos de API, payloads de encuesta, permisos, roles ni la arquitectura de Supabase.

## Matriz de viewports

Resultados permitidos: `PASS`, `FAIL`, `NOT TESTED`, `NOT APPLICABLE`.

| Pantalla / flujo | 320×568 | 360×800 | 390×844 | 430×932 | 768×1024 | 820×1180 | 1024×768 | 1440×900 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Landing `/` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Login `/login` | NOT TESTED | NOT TESTED | PASS | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED |
| Privacidad `/privacidad` | NOT TESTED | NOT TESTED | PASS | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED |
| QR inválido `/s?token=…` | NOT TESTED | NOT TESTED | PASS | NOT TESTED | NOT TESTED | NOT TESTED | NOT APPLICABLE | NOT APPLICABLE |
| Dispositivo inválido `/d?token=…` | NOT TESTED | NOT TESTED | PASS | NOT TESTED | NOT TESTED | NOT TESTED | NOT APPLICABLE | NOT APPLICABLE |
| QR activo | NOT TESTED | NOT TESTED | PASS | NOT TESTED | NOT TESTED | NOT TESTED | NOT APPLICABLE | NOT APPLICABLE |
| Dispositivo activo | NOT APPLICABLE | NOT APPLICABLE | PASS | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT APPLICABLE |
| Dashboard autenticado | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Respuestas autenticado | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Alertas autenticado | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Exportación autenticado | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Configuración autenticado | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

En `/s/invalid-cor-137-token` y `/d/invalid-cor-137-token` el proyecto devuelve 404 porque las páginas implementadas son `/s` y `/d` con token en query. La validación equivalente se ejecutó sin exponer el valor del token en la evidencia.

## Overflow y revisión visual

- La landing se abrió con Playwright en los ocho viewports requeridos.
- En todos los viewports de la landing, `document.documentElement.scrollWidth === window.innerWidth` y `document.body.scrollWidth === window.innerWidth`.
- El preview de encuesta usa una columna en móvil y dos desde `sm`.
- Login y privacidad se abrieron a 390×844 sin overflow; login mostró un único `h1` con “Bienvenido de vuelta.”.
- Con una cuenta QA se recorrieron `/app/dashboard`, `/app/respuestas`, `/app/alertas`, `/app/exportar` y `/app/configuracion` en los ocho viewports; las 40 combinaciones quedaron sin overflow horizontal.
- En el panel autenticado se verificaron el menú “Más”, filtros, tarjetas de respuestas, inspector, exportación y configuración a 390×844.
- El menú “Más” abrió con foco dentro del diálogo, bloqueó el fondo, cerró con Escape, devolvió el foco al trigger y se cerró antes de navegar a Configuración.

## Pruebas funcionales de captura

| Flujo | Resultado | Evidencia |
| --- | --- | --- |
| QR inválido | PASS | `/s?token=…` mostró “Enlace no disponible” sin overflow a 390×844. |
| Dispositivo inválido | PASS | `/d?token=…` mostró “Enlace no disponible” sin overflow a 390×844. |
| QR activo | PASS | Enlace QA activo probado a 390×844: cuatro calificaciones, validaciones, consentimiento, teléfono inválido, envío y mensaje final. |
| Dispositivo activo | PASS | Enlace QA activo probado a 390×844: sucursal, zona y dispositivo, envío, mensaje de reinicio, limpieza tras cuatro segundos y “Nueva encuesta”. |

Se enviaron respuestas QA ficticias; no se usaron datos personales reales. No se regeneraron tokens.

## Correcciones verificadas

- Se eliminó el mojibake real de dashboard, preguntas y respuestas; la prueba preventiva recorre `src/app/(restaurant)`, `src/app/(public)`, `src/app/(auth)`, `src/components` y `src/features/capture`.
- Se corrigieron acentos en operación, atención, métricas, filtros, paginación, teléfono, exportación, sesión, conexión, configuración, cuenta y estados compartidos.
- La landing ahora distingue entre sucursal correspondiente y zona configurada cuando aplica.
- Login: `Bienvenido de vuelta.` es el único `h1` principal; el encabezado editorial pasó a `h2`.
- “Más” usa `@base-ui/react/dialog` con trigger, backdrop, popup, title y close; el estado controlado permite cierre por navegación y Base UI gestiona Escape, foco inicial, focus trap y retorno al trigger.
- Se agregaron pruebas de copy público, copy operativo, jerarquía del login, responsive del preview, menú móvil y encoding.

## Pruebas ejecutadas

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test:ui` | PASS — 80 pruebas, 80 exitosas |
| `node --test "src/app/(public)/public-copy.test.mjs"` | PASS — 9 pruebas |
| `node --test "src/app/(capture)/capture-survey-token.test.mjs"` | PASS — incluido en `test:ui` |
| `node --test "supabase/functions/regenerate_device_token/index.test.mjs"` | PASS — incluido en `test:ui` |
| `pnpm build` | PASS — ejecución final |
| `pnpm qa:public-build` | PASS — ejecución final |

Las pruebas Node existentes emiten el warning no bloqueante de `MODULE_TYPELESS_PACKAGE_JSON` para módulos TypeScript importados directamente.

## Limitaciones y caveats

- El despliegue público usado para los enlaces activos conserva copy anterior en algunos textos configurables y en el aviso de reinicio; el build local auditado ya muestra el mensaje corregido. No se hizo deploy por restricción de COR-137.
- La exploración detallada de login, privacidad y captura se concentró en 390×844; la matriz conserva `NOT TESTED` en sus viewports secundarios. La landing y el panel sí tuvieron comprobación de overflow en los ocho viewports.
- La URL documentada para captura es `/s` y `/d` con token en query; las variantes `/s/<token>` y `/d/<token>` no corresponden al routing implementado.

## Confirmaciones

- No se modificó schema, migraciones, RLS ni configuración administrativa de Supabase; solo se enviaron respuestas QA ficticias mediante los enlaces activos autorizados.
- No se modificaron Supabase Edge Functions.
- No se modificaron contratos de API, payloads de encuesta, permisos, roles ni tokens.
- No se hizo deploy.
- No se cerró COR-137.
- No se hizo commit, push ni PR.
