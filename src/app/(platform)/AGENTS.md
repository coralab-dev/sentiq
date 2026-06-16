# src/app/(platform)/AGENTS.md

## Proposito

Panel de administracion de plataforma.

## Reglas

- Revisar `src/lib/auth` si cambia acceso de platform_admin.
- Revisar `src/config/routes.ts` si cambia navegacion.
- Revisar Edge Functions relacionadas si cambia creacion de restaurantes o usuarios.
- No tocar panel restaurante ni captura publica salvo que la tarea lo requiera.
- No cambiar roles sin revisar `src/types/domain.ts`.

## Validacion

- Ejecutar `pnpm lint`.
- Ejecutar `pnpm typecheck`.
- Ejecutar `pnpm build` si cambian rutas, layout o flujo de navegacion.
