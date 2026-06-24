# Supabase setup

SentiQ usa Supabase para datos, autenticacion y Edge Functions.

## Variables publicas

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

Estas variables pueden usarse en frontend. No expongas service role en codigo frontend.

## Edge Functions secrets

Configura `NEXT_PUBLIC_APP_URL` tambien como secret de Supabase Edge Functions.
Las funciones `create_restaurant`, `regenerate_qr_token` y
`regenerate_device_token` lo usan para construir URLs publicas `/s/:token` y
`/d/:token`.

Demo:

```bash
pnpm dlx supabase secrets set --project-ref wdurjrzkfjnlaatenwnb NEXT_PUBLIC_APP_URL=https://sentiq.pages.dev
```

Verificacion:

```bash
pnpm dlx supabase secrets list --project-ref wdurjrzkfjnlaatenwnb
```

Si falta este secret, las Edge Functions usan el fallback local
`http://localhost:3000` y los QR/device regenerados en demo quedan con dominio
incorrecto.

## Variables para seed/demo

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Emails demo segun `.env.example`.
- Passwords demo segun `.env.example`.

## Comandos

- `pnpm seed:demo`: carga datos demo.
- `pnpm qa:update-alert-status`: actualiza estado de alertas para QA.

## Reglas

- Mantener `SUPABASE_SERVICE_ROLE_KEY` solo en entorno seguro de servidor o scripts locales.
- Revisar `supabase/functions` cuando cambien contratos serverless.
- Revisar `supabase/migrations` solo para cambios de schema, DB o RLS.
