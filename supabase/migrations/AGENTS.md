# supabase/migrations/AGENTS.md

## Proposito

Migraciones de base de datos, constraints, indices, helpers y RLS.

## Reglas

- No leer todas las migraciones salvo que la tarea sea de schema completo.
- Para RLS, empezar por `docs/security/rls-permission-matrix.md`.
- Para pruebas manuales, revisar `docs/security/rls-test-queries.sql`.
- Si se cambia una policy, actualizar la matriz RLS correspondiente.
- Nunca modificar datos reales ni credenciales.
- No tocar UI salvo que el cambio de DB requiera ajuste visible.

## Validacion

- Explicar actor, tabla, operacion y resultado esperado si cambia RLS.
- Actualizar documentacion de seguridad cuando aplique.
