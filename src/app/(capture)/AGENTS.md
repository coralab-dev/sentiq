# src/app/(capture)/AGENTS.md

## Proposito

Rutas publicas de captura de feedback por QR o dispositivo.

## Reglas

- Revisar `src/features/capture` para logica reutilizable.
- Revisar `src/features/capture/api/public-survey.ts` si cambia carga o envio de encuesta.
- Revisar `src/types/domain.ts` y `src/types/edge-functions.ts` si cambia contrato de datos.
- No tocar panel restaurante ni platform admin salvo que sea necesario.
- No tocar RLS salvo que la tarea lo pida explicitamente.

## Validacion

- Ejecutar `pnpm lint`.
- Ejecutar `pnpm typecheck`.
- Ejecutar `pnpm build` si cambian rutas o render.
