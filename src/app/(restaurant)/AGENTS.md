# src/app/(restaurant)/AGENTS.md

## Proposito

Panel de restaurante: dashboard, respuestas, alertas, exportacion y configuracion.

## Reglas

- Usar componentes compartidos de `src/components/layout`, `src/components/panel` y `src/components/shared` cuando aplique.
- Revisar `src/lib/auth` solo si cambia acceso, navegacion o permisos.
- No tocar platform admin ni captura publica salvo que la tarea lo requiera.
- No tocar Supabase migrations ni docs/security para cambios visuales.
- Mantener cambios de UI limitados al modulo solicitado.

## Validacion

- Ejecutar `pnpm lint`.
- Ejecutar `pnpm typecheck`.
- Ejecutar `pnpm build` si cambia layout, rutas o navegacion.
