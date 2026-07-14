# T-063 Public Config And Errors Audit

Date: 2026-07-14

Commit SHA audited before merge: `6ef0fd8ee0bc8d92e3de21cee5075112076328f8`.

Deployed merge SHA validated: `b53f6b126e425e8c9747e9e1b95c1c9d53f4aacd`.

Production validation time: 2026-07-14 00:18 UTC.

Environment audited:
- Local repository: `C:\Users\balam\Documents\sentiq`
- Local static build: `out/`
- Production frontend: `https://sentiq.pages.dev`
- Production Supabase project: `sentiq` / `wdurjrzkfjnlaatenwnb`
- Remote Supabase Edge Functions via `pnpm qa:edge-functions-privacy`

Dictamen final: `PASS WITH CAVEATS`

## Scope

Reviewed public frontend configuration, public static build output, public capture QR/device error handling, Edge Function public error contracts, CSV export behavior, Cloudflare Pages headers, and reproducible QA evidence for COR-133 / T-063.

## Files Reviewed

- `AGENTS.md`
- `docs/codex/repo-map.md`
- `src/config/env.ts`
- `.env.example`
- `next.config.ts`
- `docs/setup/cloudflare-pages.md`
- `public/_headers`
- `public/_redirects`
- `src/config/error-messages.ts`
- `src/types/api.ts`
- `src/types/edge-functions.ts`
- `src/lib/supabase/functions.ts`
- `src/features/capture/api/public-survey.ts`
- `src/features/capture/components/public-qr-survey.tsx`
- `src/features/capture/components/public-device-survey.tsx`
- `src/app/(capture)/s/page.tsx`
- `src/app/(capture)/d/page.tsx`
- `supabase/functions/_shared/http.ts`
- `supabase/functions/submit_feedback/index.ts`
- `supabase/functions/export_feedback_csv/index.ts`
- `supabase/functions/update_alert_status/index.ts`
- `scripts/qa/edge-functions-privacy-checklist.mjs`
- `scripts/qa/public-build-audit.mjs`

## Commands Executed

| Command | Result |
| --- | --- |
| `git switch master && git pull --ff-only origin master && git rev-parse HEAD` | PASS: local `master` fast-forwarded to `b53f6b126e425e8c9747e9e1b95c1c9d53f4aacd` |
| `pnpm dlx supabase functions deploy ... --project-ref wdurjrzkfjnlaatenwnb --use-api` | PASS: deployed 10 protected functions with existing `verify_jwt=true` |
| `pnpm dlx supabase functions deploy submit_feedback --project-ref wdurjrzkfjnlaatenwnb --use-api --no-verify-jwt` | PASS: deployed public `submit_feedback` with existing `verify_jwt=false` |
| Supabase list Edge Functions via connector | PASS: versions and `verify_jwt` confirmed after deploy |
| `pnpm build` | PASS; generated static export in `out/` |
| `pnpm qa:public-build` | PASS; no forbidden markers or source maps in `out/` |
| `pnpm qa:edge-functions-privacy` | PASS: 42 PASS, 0 FAIL, 1 SKIPPED |
| `curl.exe -I https://sentiq.pages.dev...` | PASS: required headers observed on all requested routes |
| `pnpm dlx wrangler pages deployment list --project-name sentiq` | BLOCKED: local environment lacks `CLOUDFLARE_API_TOKEN` for direct deployment SHA lookup |

Previously executed before merge:
- `node --test supabase/functions/submit_feedback/index.test.mjs`: PASS 1/1
- `node --test "src/app/(capture)/capture-survey-token.test.mjs"`: PASS 6/6
- `node --test supabase/functions/regenerate_device_token/index.test.mjs`: PASS 4/4
- `pnpm lint`: PASS
- `pnpm typecheck`: PASS

## Evidence Matrix

| Area / case | Result | Evidence |
| --- | --- | --- |
| Allowed frontend env keys | PASS | `src/config/env.ts` only reads `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`. |
| Cloudflare Pages env vars | PASS MANUAL | User-provided Cloudflare screenshot verified expected names: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NODE_VERSION`, `PNPM_VERSION`. Values were not copied. Backend secrets were not shown. |
| Static build secrets scan | PASS | `pnpm qa:public-build` found no forbidden markers and no `.map` files in `out/`. |
| Source maps in public build | PASS | `pnpm qa:public-build` would fail on `*.map`; none found. |
| `submit_feedback` validation detail leak in source | PASS | Local code returns `invalid_payload` with controlled message for invalid payload and source mismatch. |
| `submit_feedback` validation detail leak in production | PASS | Post-deploy `pnpm qa:edge-functions-privacy` completed with 42 PASS, 0 FAIL. |
| Token absent | PASS | Production QA no longer leaks `token_required`. |
| Token nonexistent | PASS | Production QA returned controlled error for invalid token. |
| Token revoked | PASS | Production QA regenerated QR token and confirmed previous token no longer loads. |
| Enlace inactivo | CAVEAT | No safe production fixture for inactive link was available in automated QA. Existing public invalid/revoked token paths were validated. |
| Restaurante/sucursal/dispositivo inactivo | CAVEAT | No safe production fixtures for inactive entities were available in automated QA. |
| Payload invalid | PASS | Production returns controlled `invalid_payload` without validation rule names. |
| Source incorrecto | PASS | Production maps source mismatch to generic `invalid_payload`. |
| Rating fuera de rango | PASS | Production no longer leaks `invalid_general_experience`. |
| Telefono sin consentimiento | PASS | Production no longer leaks `customer_phone_requires_consent`. |
| Comentario demasiado largo | PASS | Production no longer leaks `comment_too_long`. |
| Rate limit | PASS | Production QA reached 429 with controlled error and no sensitive keys. |
| Protected functions without JWT | PASS | Production QA verified 401 controlled errors. |
| Wrong role / forbidden | PASS | Production QA verified protected role checks. |
| Cross-tenant / forbidden alert | PASS | Production QA verified manager forbidden alert unchanged. |
| Controlled 500 | CAVEAT | No safe deterministic 500 trigger without altering production data/config. |
| HTTP methods not allowed | PASS | Production QA verified OPTIONS and GET handling. |
| QR/device visible errors | PASS BY CODE REVIEW | Capture components show fixed safe messages and do not render raw Edge Function bodies or exception messages. |
| CSV requires auth | PASS | Production QA verified protected functions reject JWT-less calls and CSV requires auth. |
| CSV restaurant_admin scope | PASS | Production QA verified restaurant_admin receives CSV content response. |
| CSV manager scope | PASS/PARTIAL | Code scopes managers to active `manager_branch_assignments`; production role checks passed where fixture was available. |
| CSV platform_admin default | PASS | Production QA verified platform_admin receives 404 by default. |
| CSV public URL persistence | PASS BY CODE REVIEW | `export_feedback_csv` returns `{ filename, content }`; no Storage upload, signed URL, public URL, or persistent file creation. |
| CSV cross-tenant branch filter | PASS BY CODE REVIEW | Branch filters are constrained by `restaurant_id` or manager assignments and return 404 on inaccessible branch. |
| Cloudflare required headers `/` | PASS | Production has `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. |
| Cloudflare required headers `/s/...` | PASS | Same required headers present in production. |
| Cloudflare required headers `/d/...` | PASS | Same required headers present in production. |
| Cloudflare framing `/app/` | PASS | Production has `x-frame-options: DENY`. |
| Cloudflare framing `/platform-admin/` | PASS | Production has `x-frame-options: DENY`. |
| HSTS | PASS | Production returns `Strict-Transport-Security: max-age=31536000` on all verified routes. |
| Broader framing | PASS | Production returns `X-Frame-Options: DENY` globally on verified routes. |
| CSP | CAVEAT / FOLLOW-UP | Not added. A strict CSP could break static Next.js chunks, inline styles, images, or Supabase connections without browser validation after deploy. |

## Build Scan Result

`pnpm qa:public-build` examined `out/` and failed on forbidden backend markers, demo/QA placeholder credentials, private key markers, PostgreSQL connection strings, token secrets, rate-limit salts, `token_hash`, `service_role`, and source maps. Result: PASS.

The scan reports only file path and pattern name. It does not print secret values.

## Edge Functions Result

Deployed all 11 Edge Functions on 2026-07-14 from `master` at `b53f6b126e425e8c9747e9e1b95c1c9d53f4aacd`.

`verify_jwt` was preserved:
- `get_public_survey_config`: version 6, `verify_jwt=true`
- `submit_feedback`: version 6, `verify_jwt=false`
- `create_restaurant`: version 3, `verify_jwt=true`
- `create_restaurant_admin`: version 3, `verify_jwt=true`
- `get_platform_activity_summary`: version 3, `verify_jwt=true`
- `update_restaurant_account`: version 4, `verify_jwt=true`
- `create_manager_user`: version 6, `verify_jwt=true`
- `regenerate_qr_token`: version 3, `verify_jwt=true`
- `regenerate_device_token`: version 3, `verify_jwt=true`
- `update_alert_status`: version 3, `verify_jwt=true`
- `export_feedback_csv`: version 3, `verify_jwt=true`

`pnpm qa:edge-functions-privacy` result:
- PASS: 42
- FAIL: 0
- SKIPPED: 1

Skipped case:
- `update_alert_status - admin attends configured pending alert when available`: `QA_ALLOWED_ALERT_ID` was already `attended`. This is not a privacy leak.

The production QA did not expose:
- `token_required`
- `invalid_source`
- `invalid_general_experience`
- `invalid_service_attention`
- `invalid_food_quality`
- `invalid_service_speed`
- `comment_too_long`
- `phone_too_long`
- `customer_phone_requires_consent`
- `source_mismatch`

## Public Routes Result

QR and device components use controlled static messages for missing/invalid config, network failure, rate limit, unexpected submit failure, duplicate/retry state, and inactive/unavailable survey. They do not render raw response bodies, Supabase errors, UUIDs, function names, or infrastructure details.

## CSV Result

`export_feedback_csv` requires JWT authentication, resolves an active `restaurant_admin` or `manager`, scopes restaurant admins to their restaurant, scopes managers to active branch assignments, blocks platform admins by default, and returns CSV content inline as an authorized response. No public or signed persistent URL is generated.

## Headers Result

Production verified on:
- `/`
- `/s/invalid-cor-133-token`
- `/d/invalid-cor-133-token`
- `/app/`
- `/platform-admin/`

Observed production headers on all five routes:
- `strict-transport-security: max-age=31536000`
- `permissions-policy: camera=(), microphone=(), geolocation=()`
- `referrer-policy: strict-origin-when-cross-origin`
- `x-content-type-options: nosniff`
- `x-frame-options: DENY`

No `content-security-policy` header is intentionally present yet.

Framing decision:
- Keep global `X-Frame-Options: DENY`.
- Rationale: public QR/device surveys are direct navigation flows, not embedded widgets. A repository search found no current iframe/embedding requirement for `/s` or `/d`.
- If a future restaurant widget or partner embedding requirement appears, limit DENY back to `/app/*` and `/platform-admin/*` and use an explicitly tested CSP `frame-ancestors` allowlist for the embedded public routes.

Cloudflare deployment SHA note:
- Effective production headers match the merged `_headers` from `b53f6b126e425e8c9747e9e1b95c1c9d53f4aacd`.
- Direct deployment metadata lookup via Wrangler was blocked because no `CLOUDFLARE_API_TOKEN` was available locally.

## Variables Verified

Validated in code/build:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

Manually verified in Cloudflare dashboard screenshot:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NODE_VERSION`
- `PNPM_VERSION`

Must remain absent from Cloudflare Pages:
- `SUPABASE_SERVICE_ROLE_KEY`
- backend JWT/admin secrets
- private keys
- rate-limit salts
- token secrets
- PostgreSQL connection strings
- QA/demo real credentials

No values were printed in this document.

## Accepted Exceptions

- Supabase URL and anon/publishable key are public by design.
- CSV content may contain authorized response fields for authenticated restaurant users.
- Existing administrative business error codes such as `slug_conflict`, `email_conflict`, `admin_exists`, `restaurant_not_found`, and `branch_not_found` remain unchanged to avoid breaking approved admin UI contracts in this ticket.
- Known Supabase leaked-password protection warning remains an external caveat and was not changed in COR-133.

## Remaining Follow-ups

- Add or provide safe inactive link/entity fixtures, or explicitly accept those cases as manually verified elsewhere.
- Evaluate CSP in report-only mode before enforcing.
- Optionally verify Cloudflare deployment SHA through dashboard/API when a read-only API token is available.
