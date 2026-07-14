# T-067 UX mobile/tablet audit

Fecha: 2026-07-14

Commit auditado: `fe88f05` con cambios locales sin commit en la rama `balamsilva26/cor-137-t-067-pulido-ux-pre-piloto-en-mobiletablet-y-textos-publicos`.

Dictamen: `PASS WITH CAVEATS`

## Archivos cambiados

- `src/app/(public)/page.tsx`
- `src/app/(public)/privacidad/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/features/capture/components/public-qr-survey.tsx`
- `src/features/capture/components/public-device-survey.tsx`
- `src/components/feedback/thank-you-message.tsx`
- `src/components/feedback/rating-scale.tsx`
- `src/components/shared/error-state.tsx`
- `src/components/shared/loading-state.tsx`
- `src/app/(public)/public-copy.test.mjs`
- `docs/qa/t-067-ux-mobile-tablet-audit.md`

## Copy corregido

- QR: `Ingresa un teléfono válido de 8 a 15 dígitos.`
- Dispositivo: `La encuesta se reiniciará automáticamente después de enviar.`
- Agradecimiento QR: `Puedes cerrar esta pestaña. Tu respuesta ya fue registrada.`
- Agradecimiento dispositivo: `La encuesta se reiniciará automáticamente en unos segundos.`
- Login: acentos en `sesión`, `correo electrónico`, `contraseña`, `operación`.
- Login: se retiraron roles internos y rutas técnicas visibles.
- Privacidad: se cambió `demo controlada` por `piloto controlado`.
- Privacidad: se agregó conservación durante el piloto y hasta cinco meses después del cierre.
- Privacidad: se agregó plazo máximo de tres meses para solicitudes autorizadas de eliminación o anonimización.
- Estados compartidos: acentos en `información` y `calificación`.

## Rediseño

La landing pública se reemplazó por una estructura SaaS sobria y responsive:

- Header compacto con marca, aviso de privacidad e inicio de sesión.
- Hero con copy aprobado, CTA principal y ancla a `#como-funciona`.
- Vista conceptual del producto sin imágenes externas, sin métricas falsas y sin posiciones absolutas frágiles.
- Tres beneficios operativos.
- Sección `Cómo funciona` con cuatro pasos.
- Bloque de privacidad y confianza con consentimiento explícito.
- CTA final y footer con `Piloto controlado`.

## Matriz de viewports

La verificación automatizada de overflow visual no se ejecutó por instrucción del usuario: la prueba visual será manual.

| Pantalla | 360x800 | 390x844 | 768x1024 | 1024x768 | 1440x900 |
| --- | --- | --- | --- | --- | --- |
| Landing | Pendiente usuario | Pendiente usuario | Pendiente usuario | Pendiente usuario | Pendiente usuario |
| Login | Pendiente usuario | Pendiente usuario | Pendiente usuario | Pendiente usuario | Pendiente usuario |
| Privacidad | Pendiente usuario | Pendiente usuario | Pendiente usuario | Pendiente usuario | Pendiente usuario |
| QR inválido | Pendiente usuario | Pendiente usuario | Pendiente usuario | No requerido | No requerido |
| QR activo | Pendiente usuario | Pendiente usuario | Pendiente usuario | No requerido | No requerido |
| Device inválido | No requerido | No requerido | Pendiente usuario | Pendiente usuario | No requerido |
| Device activo | No requerido | No requerido | Pendiente usuario | Pendiente usuario | Pendiente usuario |

## Resultado por ruta

- `/`: cambios implementados; visual pendiente por usuario.
- `/login`: cambios implementados; visual pendiente por usuario.
- `/privacidad`: cambios implementados; visual pendiente por usuario.
- `/s/invalid-cor-137-token`: flujo de error genérico preservado; visual pendiente por usuario.
- `/d/invalid-cor-137-token`: flujo de error genérico preservado; visual pendiente por usuario.
- QR activo: no probado por falta de enlace QA privado en este hilo.
- Device activo: no probado por falta de enlace QA privado en este hilo.

## Pruebas ejecutadas

- `node --test "src/app/(public)/public-copy.test.mjs"`: PASS. Primero falló con el copy anterior y después pasó con el cambio.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm build`: PASS.
- `pnpm qa:public-build`: PASS.
- `node --test "src/app/(capture)/capture-survey-token.test.mjs"`: PASS, con warning existente de Node por módulo sin `type`.
- `node --test supabase/functions/regenerate_device_token/index.test.mjs`: PASS.

## Limitaciones

- No se ejecutaron pruebas visuales automatizadas ni capturas porque el usuario indicó que realizará esa prueba.
- No se probaron QR activo ni device activo porque no se proporcionaron enlaces QA privados en este hilo.
- No se enviaron respuestas de encuesta.
- No se regeneraron tokens.

## Hallazgos pendientes

- Completar revisión visual manual en los viewports requeridos.
- Registrar screenshots manuales si se necesitan como evidencia externa.
- Probar QR activo y device activo con enlaces QA privados, sin documentar tokens ni parámetros sensibles.

## Confirmaciones

- No se modificó schema, migraciones, RLS ni datos de Supabase.
- No se modificaron Edge Functions.
- No se agregaron dependencias.
- No se hizo deploy.
- No se cerró COR-137 en Linear.
- No se hizo commit, push ni PR.
