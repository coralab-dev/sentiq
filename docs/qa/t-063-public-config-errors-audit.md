# T-063 Public Config And Errors Audit

Date: 2026-07-13

Commit SHA audited: `5001b6a` plus local uncommitted COR-133 fixes.

Environment audited:
- Local repository: `C:\Users\balam\Documents\sentiq`
- Local static build: `out/`
- Production frontend: `https://sentiq.pages.dev`
- Remote Supabase Edge Functions via `pnpm qa:edge-functions-privacy`

Dictamen final: `BLOCKED`

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

## Commands Executed

| Command | Result |
| --- | --- |
| `git status --short --branch` | PASS: clean before work, then COR-133 branch with scoped changes |
| `node --test supabase/functions/submit_feedback/index.test.mjs` | PASS: 1/1 |
| `node --test "src/app/(capture)/capture-survey-token.test.mjs"` | PASS: 6/6 |
| `node --test supabase/functions/regenerate_device_token/index.test.mjs` | PASS: 4/4 |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm build` | PASS; generated static export in `out/` |
| `pnpm qa:public-build` | PASS; no forbidden markers or source maps in `out/` |
| `pnpm qa:edge-functions-privacy` | FAIL in production: deployed `submit_feedback` still leaks validation details |
| `deno --version` | BLOCKED: Deno CLI not installed |
| `supabase --version` | BLOCKED: Supabase CLI not installed |
| `curl.exe -I https://sentiq.pages.dev...` | PASS/PARTIAL: required current headers present except HSTS and global framing pending deployment |

## Evidence Matrix

| Area / case | Result | Evidence |
| --- | --- | --- |
| Allowed frontend env keys | PASS | `src/config/env.ts` only reads `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`. |
| `.env.example` public/frontend separation | PASS WITH CAVEATS | Backend/demo vars are documented for scripts, not frontend. Values are placeholders only. |
| Static build secrets scan | PASS | `pnpm qa:public-build` found no forbidden markers and no `.map` files in `out/`. |
| Source maps in public build | PASS | `pnpm qa:public-build` would fail on `*.map`; none found. |
| `submit_feedback` validation detail leak in source | PASS LOCAL | Local code now returns `invalid_payload` with controlled message for invalid payload and source mismatch. |
| `submit_feedback` validation detail leak in production | FAIL | `pnpm qa:edge-functions-privacy` found `token_required`, `invalid_general_experience`, `customer_phone_requires_consent`, `comment_too_long`, and `source_mismatch`. Requires Edge Function deployment. |
| Token absent | FAIL PROD / PASS LOCAL GUARD | Production QA leaks `token_required`; local `errorResponse` no longer accepts arbitrary details. |
| Token nonexistent | PASS | Production QA returned controlled error for invalid token. |
| Token revoked | PASS | Production QA regenerated QR token and confirmed previous token no longer loads. |
| Enlace inactivo | BLOCKED | No safe production fixture for inactive link was available in automated QA. |
| Restaurante/sucursal/dispositivo inactivo | BLOCKED | No safe production fixtures for inactive entities were available in automated QA. |
| Payload invalid | FAIL PROD / PASS LOCAL | Production leaks validation rule names; local regression test passes. |
| Source incorrecto | FAIL PROD / PASS LOCAL | Production leaks `source_mismatch`; local code maps to `invalid_payload`. |
| Rating fuera de rango | FAIL PROD / PASS LOCAL | Production leaks `invalid_general_experience`; local regression protects against it. |
| Teléfono sin consentimiento | FAIL PROD / PASS LOCAL | Production leaks `customer_phone_requires_consent`; local regression protects against it. |
| Comentario demasiado largo | FAIL PROD / PASS LOCAL | Production leaks `comment_too_long`; local QA now detects it. |
| Rate limit | PASS | Production QA reached 429 with controlled error and no sensitive keys. |
| Protected functions without JWT | PASS | Production QA verified 401 controlled errors. |
| Wrong role / forbidden | PASS | Production QA verified protected role checks. |
| Cross-tenant / forbidden alert | PASS | Production QA verified manager forbidden alert unchanged. |
| Controlled 500 | BLOCKED | No safe deterministic 500 trigger without altering production data/config. |
| HTTP methods not allowed | PASS | Production QA verified OPTIONS and GET handling. |
| QR/device visible errors | PASS BY CODE REVIEW | Capture components show fixed safe messages and do not render raw Edge Function bodies or exception messages. |
| CSV requires auth | PASS | Production QA verified unauthenticated protected functions reject JWT-less calls. |
| CSV restaurant_admin scope | PASS | Production QA verified restaurant_admin receives CSV content response. |
| CSV manager scope | PASS/PARTIAL | Code scopes managers to active `manager_branch_assignments`; production role checks passed where fixture was available. |
| CSV platform_admin default | PASS | Production QA verified platform_admin receives 404 by default. |
| CSV public URL persistence | PASS BY CODE REVIEW | `export_feedback_csv` returns `{ filename, content }`; no Storage upload, signed URL, public URL, or persistent file creation. |
| CSV cross-tenant branch filter | PASS BY CODE REVIEW | Branch filters are constrained by `restaurant_id` or manager assignments and return 404 on inaccessible branch. |
| Cloudflare required headers `/` | PASS | Production has `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: camera=(), microphone=(), geolocation=()`. |
| Cloudflare required headers `/s/...` | PASS | Same required headers present in production. |
| Cloudflare required headers `/d/...` | PASS | Same required headers present in production. |
| Cloudflare framing `/app/` | PASS | Production has `x-frame-options: DENY`. |
| Cloudflare framing `/platform-admin/` | PASS | Production has `x-frame-options: DENY`. |
| HSTS | BLOCKED/PENDING DEPLOY | Local `_headers` now adds `Strict-Transport-Security: max-age=31536000`; production does not show it yet. |
| Broader framing | BLOCKED/PENDING DEPLOY | Local `_headers` now applies `X-Frame-Options: DENY` globally; production currently applies it only on app/admin paths. |
| CSP | BLOCKED / FOLLOW-UP | Not added. A strict CSP could break static Next.js chunks, inline styles, images, or Supabase connections without browser validation after deploy. |
| Cloudflare Pages env vars | BLOCKED | No read-only dashboard/API access was available in this session. Must manually verify names only: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NODE_VERSION`, `PNPM_VERSION`; backend secrets absent. |

## Build Scan Result

`pnpm qa:public-build` examined `out/` and failed on forbidden backend markers, demo/QA placeholder credentials, private key markers, PostgreSQL connection strings, token secrets, rate-limit salts, `token_hash`, `service_role`, and source maps. Result: PASS.

The scan reports only file path and pattern name. It does not print secret values.

## Edge Functions Result

Local code changes:
- `supabase/functions/_shared/http.ts` now uses a controlled public message catalog and no longer accepts arbitrary public messages.
- `supabase/functions/submit_feedback/index.ts` no longer serializes validation rule arrays or `source_mismatch`.
- `supabase/functions/export_feedback_csv/index.ts` and `supabase/functions/update_alert_status/index.ts` no longer return `method_not_allowed` / `not_found_or_forbidden`.
- `scripts/qa/edge-functions-privacy-checklist.mjs` now detects technical markers, internal validation codes, function names in public error bodies, and source mismatch leaks.

Production state:
- BLOCKED/FAIL until Edge Functions are deployed.
- Current deployed `submit_feedback` still leaks internal validation details as confirmed by `pnpm qa:edge-functions-privacy`.

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

Observed production headers:
- `x-content-type-options: nosniff`
- `referrer-policy: strict-origin-when-cross-origin`
- `permissions-policy: camera=(), microphone=(), geolocation=()`
- `x-frame-options: DENY` on `/app/` and `/platform-admin/`

Local repository update:
- `public/_headers` now also sets `X-Frame-Options: DENY` globally.
- `public/_headers` now sets `Strict-Transport-Security: max-age=31536000`.

Not adopted:
- CSP. Recommendation: define a report-only CSP first, validate static Next.js chunks, Supabase function/API calls, images/logos, and styles in production or preview, then graduate to enforcing CSP.

## Variables Verified

Validated in code/build:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

Pending Cloudflare dashboard verification:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NODE_VERSION`
- `PNPM_VERSION`

Must be absent from Cloudflare Pages:
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

## Risks Pending

- Production Edge Functions still need deployment and re-run of `pnpm qa:edge-functions-privacy`.
- Cloudflare Pages environment variables need read-only dashboard/API verification.
- HSTS and global framing need deployment verification.
- Inactive link/entity cases need safe production fixtures or a non-production environment with equivalent data.
- CSP needs a separate report-only validation pass.
- Deno/Supabase CLI checks were not available locally.

## Evidence Required To Close COR-133

1. Deploy the updated Edge Functions.
2. Deploy the updated static frontend headers.
3. Re-run `pnpm qa:edge-functions-privacy` and confirm zero failures.
4. Re-run `pnpm build && pnpm qa:public-build`.
5. Verify production headers again on `/`, `/s/<invalid>`, `/d/<invalid>`, `/app/`, and `/platform-admin/`.
6. Verify Cloudflare Pages variables in dashboard/API and record names only.
7. Add or provide safe inactive link/entity fixtures, or explicitly accept those cases as manually verified elsewhere.

