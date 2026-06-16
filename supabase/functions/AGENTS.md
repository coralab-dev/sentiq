# supabase/functions/AGENTS.md

## Proposito

Funciones Edge de Supabase.

## Reglas

- No asumir que el typecheck raiz cubre esta carpeta; `tsconfig.json` excluye `supabase/functions`.
- Mantener contratos sincronizados con `src/types/edge-functions.ts`.
- Mantener nombres sincronizados con `src/config/edge-functions.ts`.
- No usar service role desde codigo frontend.
- Para cambios de feedback publico, revisar tambien `src/features/capture/api/public-survey.ts`.
- No modificar migraciones salvo que cambie el contrato de DB.

## Validacion

- Revisar callers frontend relacionados.
- Confirmar input/output de la funcion.
- Ejecutar `pnpm lint` y `pnpm typecheck` si se toca codigo compartido en `src`.
