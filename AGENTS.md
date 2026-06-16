# AGENTS.md

## Proyecto

SentiQ es una app Next.js + React + TypeScript + Supabase para feedback de restaurantes.

## Stack

- Package manager: pnpm
- App: Next.js App Router
- UI: React + Tailwind
- Backend externo: Supabase + Edge Functions
- Alias TypeScript: `@/*` apunta a `src/*`

## Comandos

- Dev: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Seed demo: `pnpm seed:demo`
- QA alert status: `pnpm qa:update-alert-status`

## Reglas de contexto

- No escanear todo el repo para tareas puntuales.
- Primero identificar el area afectada y leer solo archivos relacionados.
- No abrir `pnpm-lock.yaml` salvo que la tarea sea de dependencias.
- No abrir `src/types/supabase.ts` salvo que la tarea requiera tipos generados de Supabase.
- No abrir `supabase/migrations` salvo que la tarea sea de schema, DB o RLS.
- No abrir `docs/security` salvo que la tarea sea de permisos, RLS o auditoria.
- No hacer refactors globales si la tarea es puntual.
- Antes de editar mas de 5 archivos, explicar por que hace falta.

## Areas principales

- Captura publica: `src/app/(capture)`, `src/features/capture`, `supabase/functions/get_public_survey_config`, `supabase/functions/submit_feedback`
- Panel restaurante: `src/app/(restaurant)`, `src/components/layout`, `src/components/panel`
- Platform admin: `src/app/(platform)`
- Auth/permisos: `src/lib/auth`, `src/config/routes.ts`, `src/types/domain.ts`
- Supabase client/functions: `src/lib/supabase`, `src/config/edge-functions.ts`
- DB/RLS: `supabase/migrations`, `docs/security`

## Done when

- El cambio esta limitado al scope solicitado.
- Pasa `pnpm lint`.
- Pasa `pnpm typecheck` si toca TypeScript.
- Pasa `pnpm build` si toca rutas, layouts, env, Next config o render.
- El diff no incluye cambios no relacionados.
