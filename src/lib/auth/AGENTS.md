# src/lib/auth/AGENTS.md

## Proposito

Esta carpeta controla sesion, roles, permisos, navegacion y redirecciones.

## Archivos relacionados

- `session.ts`: obtiene sesion y perfil desde Supabase.
- `permissions.ts`: define roles validos, rutas permitidas y navegacion.
- `redirects.ts`: define redirecciones post-login y no autorizado.
- `src/config/routes.ts`: fuente central de rutas.
- `src/types/domain.ts`: fuente de roles y tipos de dominio.

## Reglas

- No cambiar roles sin revisar `src/types/domain.ts`.
- No cambiar permisos sin revisar `src/config/routes.ts`.
- Si cambia acceso de manager, restaurant_admin o platform_admin, revisar navegacion y redirects.
- Mantener cambios pequenos y explicitos.
- No tocar RLS o migraciones salvo que la tarea lo pida.

## Validacion

- Ejecutar `pnpm lint`.
- Ejecutar `pnpm typecheck`.
- Ejecutar `pnpm build` si cambia navegacion, rutas o layouts.
