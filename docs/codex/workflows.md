# Codex workflows

Flujos recomendados para elegir contexto sin escanear todo el repo.

## UI panel restaurante

- Contexto permitido: `src/app/(restaurant)`, `src/components/layout`, `src/components/panel`, `src/components/shared`.
- Archivos iniciales: ruta afectada, componente visible y datos usados por esa vista.
- No abrir salvo necesidad: `src/lib/auth`, `supabase/migrations`, `docs/security`, `supabase/functions`.
- Validacion: `pnpm lint`, `pnpm typecheck`, `pnpm build` si cambia layout, rutas o render.

## Auth/permisos

- Contexto permitido: `src/lib/auth`, `src/config/routes.ts`, `src/types/domain.ts`.
- Archivos iniciales: `session.ts`, `permissions.ts`, `redirects.ts` segun el cambio.
- No abrir salvo necesidad: componentes UI, migraciones, Edge Functions.
- Validacion: `pnpm lint`, `pnpm typecheck`, `pnpm build` si cambia navegacion, rutas o layouts.

## Captura publica

- Contexto permitido: `src/app/(capture)`, `src/features/capture`, `src/types/domain.ts`, `src/types/edge-functions.ts`.
- Archivos iniciales: ruta de captura y `src/features/capture/api/public-survey.ts` si cambia carga o envio.
- No abrir salvo necesidad: panel restaurante, platform admin, RLS, migraciones.
- Validacion: `pnpm lint`, `pnpm typecheck`, `pnpm build` si cambian rutas o render.

## Edge Functions

- Contexto permitido: `supabase/functions`, `src/config/edge-functions.ts`, `src/types/edge-functions.ts`, callers frontend relacionados.
- Archivos iniciales: funcion afectada, contrato compartido y caller directo.
- No abrir salvo necesidad: migraciones, docs/security, componentes visuales.
- Validacion: confirmar input/output y ejecutar `pnpm lint` y `pnpm typecheck` si se toca codigo compartido en `src`.

## RLS/seguridad

- Contexto permitido: `docs/security`, migracion relevante, tipos de dominio afectados.
- Archivos iniciales: `docs/security/rls-permission-matrix.md` y `docs/security/rls-test-queries.sql`.
- No abrir salvo necesidad: UI, rutas no relacionadas, Edge Functions no afectadas.
- Validacion: documentar actor, tabla, operacion y resultado esperado; actualizar matriz y queries cuando aplique.

## Prompt base

```text
Objetivo:
...

Contexto permitido:
...

No tocar:
...

Validacion:
...
```
