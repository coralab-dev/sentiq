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

Secrets requeridos para demo:

- `SUPABASE_SERVICE_ROLE_KEY`: solo Edge Functions/scripts backend.
- `SUPABASE_URL`.
- `NEXT_PUBLIC_APP_URL=https://sentiq.pages.dev`.
- `RATE_LIMIT_SECRET_SALT`: sal usada por `supabase/functions/_shared/rate-limit.ts`.

No se usa `TOKEN_HASH_SECRET` en la implementacion actual: los tokens publicos
se hashean con SHA-256 en `supabase/functions/_shared/public-token.ts`.

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

## Edge Functions desplegadas

Funciones esperadas en el proyecto demo `wdurjrzkfjnlaatenwnb`:

- `get_public_survey_config`
- `submit_feedback`
- `update_alert_status`
- `export_feedback_csv`
- `create_restaurant`
- `create_restaurant_admin`
- `regenerate_qr_token`
- `regenerate_device_token`
- `create_manager_user`
- `get_platform_activity_summary`
- `update_restaurant_account`

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

## T-042 / COR-111 verification

Last verified: 2026-06-24.

- Supabase project checked: `sentiq` / `wdurjrzkfjnlaatenwnb`.
- Project status checked: active/healthy.
- Demo users checked as active:
  `platform_admin`, `restaurant_admin`, `manager`.
- Demo restaurant checked as active: `SentiQ Demo Restaurante`.
- Demo branches checked as active: `Centro`, `Norte`.
- Demo device checked as active: `Tablet Demo Centro`.
- Demo QR/device survey links checked as active.
- Edge Functions checked as deployed and active.
- Function secrets checked by name. Values are not documented.
- Public Cloudflare URL checked against Supabase-backed QR/device flows.
