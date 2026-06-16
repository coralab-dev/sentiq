# Local development

## Requisitos

- Node compatible con el proyecto.
- pnpm.
- Variables locales en `.env.local`.

Usa `.env.example` como plantilla para crear `.env.local`. Los archivos `.env*` no deben commitearse, salvo `.env.example`.

## Comandos

- `pnpm dev`: servidor local de Next.js.
- `pnpm lint`: ESLint.
- `pnpm typecheck`: TypeScript sin emitir archivos.
- `pnpm build`: build de produccion.
- `pnpm check`: validacion general si el script existe.

## Flujo recomendado

1. Instalar dependencias con `pnpm install`.
2. Crear `.env.local` desde `.env.example`.
3. Levantar la app con `pnpm dev`.
4. Validar cambios con `pnpm check` o con los comandos individuales segun el alcance.
