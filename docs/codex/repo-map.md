# SentiQ repo map

Esta guia ayuda a ubicar el area correcta antes de trabajar en una tarea. No reemplaza la documentacion tecnica completa; sirve para reducir exploracion innecesaria del repo.

## Stack

- Next.js App Router
- React
- TypeScript
- Supabase
- Supabase Edge Functions
- Tailwind CSS
- pnpm

## Estructura principal

| Ruta | Proposito | Leer cuando |
| --- | --- | --- |
| `src/app/(public)` | Paginas publicas generales | Cambios en landing, privacidad o paginas publicas |
| `src/app/(auth)` | Login y callbacks de autenticacion | Cambios de login o auth callback |
| `src/app/(capture)` | Rutas publicas de encuesta QR/dispositivo | Cambios en captura de feedback |
| `src/app/(restaurant)` | Panel del restaurante | Cambios en dashboard, respuestas, alertas, exportacion o configuracion |
| `src/app/(platform)` | Admin de plataforma | Cambios de gestion global o platform admin |
| `src/features/capture` | Logica/componentes de encuesta publica | Cambios de encuesta publica |
| `src/components/layout` | Shells y layouts compartidos | Cambios de navegacion, sidebar o layout |
| `src/components/panel` | Componentes reutilizables del panel | Tablas, filtros, headers, menus |
| `src/components/shared` | Estados, badges y componentes compartidos | Loading, error, empty states |
| `src/lib/auth` | Sesion, roles, permisos y redirects | Cambios de acceso o navegacion por rol |
| `src/lib/supabase` | Cliente Supabase y wrappers | Cambios de integracion Supabase en frontend |
| `src/config` | Rutas, env y nombres de Edge Functions | Cambios en rutas, env o contratos de funcion |
| `src/types` | Tipos de dominio, API y Supabase | Cambios de contratos o tipos |
| `supabase/functions` | Edge Functions | Cambios backend serverless |
| `supabase/migrations` | Schema, constraints, helpers y RLS | Cambios de DB o permisos |
| `docs/security` | Matriz RLS y queries manuales | Auditoria, permisos o RLS |
| `scripts` | Scripts de seed y QA | Automatizacion local o QA |

## Reglas para elegir contexto

- Para UI del panel restaurante, empezar en `src/app/(restaurant)` y componentes relacionados.
- Para encuesta publica, empezar en `src/app/(capture)` y `src/features/capture`.
- Para permisos de usuario, empezar en `src/lib/auth`, `src/config/routes.ts` y `src/types/domain.ts`.
- Para Edge Functions, empezar en `supabase/functions`, `src/config/edge-functions.ts` y `src/types/edge-functions.ts`.
- Para RLS, empezar en `docs/security/rls-permission-matrix.md` y luego abrir solo la migracion relevante.
- No abrir `pnpm-lock.yaml` salvo cambios de dependencias.
- No abrir `src/types/supabase.ts` salvo que se necesiten tipos generados.

## Comandos utiles

- `pnpm dev`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm seed:demo`
- `pnpm qa:update-alert-status`
