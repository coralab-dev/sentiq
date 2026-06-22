import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse, readJsonBody } from "../_shared/http.ts";
import { createPublicTokenSecret } from "../_shared/public-token.ts";
import { createServiceClient } from "../_shared/supabase-admin.ts";

type Payload = { restaurant_name?: unknown; legal_name?: unknown; contact_name?: unknown; contact_email?: unknown; contact_phone?: unknown; plan_code?: unknown; account_status?: unknown; branch_name?: unknown; branch_slug?: unknown; branch_address?: unknown; branch_internal_phone?: unknown; branch_notes?: unknown; create_initial_qr?: unknown };
type Input = { restaurantName: string; restaurantSlug: string; legalName: string | null; contactName: string | null; contactEmail: string | null; contactPhone: string | null; planCode: "demo" | "basico" | "pro" | "custom"; accountStatus: "demo" | "pilot" | "active"; branchName: string; branchSlug: string; branchAddress: string | null; branchInternalPhone: string | null; branchNotes: string | null; createInitialQr: boolean };
type ErrorCode = "invalid_method" | "invalid_payload" | "unauthorized" | "forbidden" | "slug_conflict" | "server_error";
type Created = { restaurantId?: string; accountId?: string; settingsId?: string; branchId?: string; qrLinkId?: string };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[+\d][\d\s().-]{6,24}$/;
const PLANS = new Set(["demo", "basico", "pro", "custom"]);
const ACCOUNT_STATUSES = new Set(["demo", "pilot", "active"]);

Deno.serve(async (req: Request) => {
  const options = handleOptions(req); if (options) return options;
  if (req.method !== "POST") return fail("invalid_method", 405);
  const supabase = createServiceClient();
  const jwt = bearer(req.headers.get("Authorization") ?? req.headers.get("authorization"));
  if (!jwt) return fail("unauthorized", 401);
  const { data: auth, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !auth.user) return fail("unauthorized", 401);
  const input = validate(await readJsonBody(req) as Payload | null);
  if (!input) return fail("invalid_payload", 400);
  const { data: profile, error: profileError } = await supabase.from("user_profiles").select("role,status").eq("id", auth.user.id).maybeSingle<{ role: string; status: string }>();
  if (profileError) return fail("server_error", 500);
  if (!profile || profile.role !== "platform_admin" || profile.status !== "active") return fail("forbidden", 403);
  const { data: duplicate, error: duplicateError } = await supabase.from("restaurants").select("id").eq("slug", input.restaurantSlug).maybeSingle<{ id: string }>();
  if (duplicateError) return fail("server_error", 500);
  if (duplicate) return fail("slug_conflict", 409);

  const created: Created = {};
  try {
    const restaurant = await insertOne(supabase.from("restaurants").insert({ name: input.restaurantName, legal_name: input.legalName, slug: input.restaurantSlug, contact_name: input.contactName, contact_email: input.contactEmail, contact_phone: input.contactPhone, status: "active" }).select("id").single()); created.restaurantId = restaurant.id;
    const account = await insertOne(supabase.from("restaurant_accounts").insert({ restaurant_id: restaurant.id, plan_code: input.planCode, account_status: input.accountStatus, started_at: input.accountStatus === "active" ? new Date().toISOString() : null }).select("id").single()); created.accountId = account.id;
    const settings = await insertOne(supabase.from("restaurant_settings").insert({ restaurant_id: restaurant.id, primary_color: "#0f766e", secondary_color: "#ea580c", survey_welcome_text: "Gracias por elegirnos. Tu opinión nos ayuda a mejorar cada día.", survey_thank_you_text: "Tu feedback nos ayuda a brindar mejores experiencias cada día.", question_general_text: "¿Cómo fue tu experiencia general?", question_attention_text: "¿Cómo calificarías la atención?", question_food_text: "¿Cómo calificarías los alimentos o bebidas?", question_speed_text: "¿Cómo calificarías la rapidez del servicio?", contact_consent_text: "Acepto que el restaurante me contacte para dar seguimiento a mi experiencia." }).select("id").single()); created.settingsId = settings.id;
    const branch = await insertOne(supabase.from("branches").insert({ restaurant_id: restaurant.id, name: input.branchName, slug: input.branchSlug, address: input.branchAddress, internal_phone: input.branchInternalPhone, notes: input.branchNotes, status: "active" }).select("id").single()); created.branchId = branch.id;
    const response: Record<string, unknown> = { ok: true, restaurant_id: restaurant.id, restaurant_slug: input.restaurantSlug, account_id: account.id, settings_id: settings.id, branch_id: branch.id, branch_slug: input.branchSlug };
    if (input.createInitialQr) {
      const secret = await createPublicTokenSecret();
      const link = await insertOne(supabase.from("survey_links").insert({ restaurant_id: restaurant.id, branch_id: branch.id, zone_id: null, device_id: null, type: "qr", name: `QR ${input.branchName}`, token_hash: secret.tokenHash, token_last4: secret.tokenLast4, status: "active", created_by: auth.user.id, regenerated_at: new Date().toISOString() }).select("id").single()); created.qrLinkId = link.id;
      response.qr_link_id = link.id; response.qr_url = buildQrUrl(secret.token); response.token_last4 = secret.tokenLast4;
    }
    return jsonResponse(response);
  } catch { await rollback(supabase, created); return fail("server_error", 500); }
});

function validate(body: Payload | null): Input | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const restaurantName = text(body.restaurant_name), branchName = text(body.branch_name);
  const legalName = optional(body.legal_name), contactName = optional(body.contact_name), contactEmail = optional(body.contact_email)?.toLowerCase() ?? null, contactPhone = optional(body.contact_phone);
  const branchSlugRaw = optional(body.branch_slug), branchAddress = optional(body.branch_address), branchInternalPhone = optional(body.branch_internal_phone), branchNotes = optional(body.branch_notes);
  if (!restaurantName || restaurantName.length < 2 || restaurantName.length > 120 || !branchName || branchName.length < 2 || branchName.length > 120) return null;
  if (legalName === undefined || contactName === undefined || contactEmail === undefined || contactPhone === undefined || branchSlugRaw === undefined || branchAddress === undefined || branchInternalPhone === undefined || branchNotes === undefined) return null;
  if (contactEmail && !EMAIL.test(contactEmail) || contactPhone && !PHONE.test(contactPhone) || branchInternalPhone && !PHONE.test(branchInternalPhone)) return null;
  if (typeof body.plan_code !== "string" || !PLANS.has(body.plan_code) || typeof body.account_status !== "string" || !ACCOUNT_STATUSES.has(body.account_status)) return null;
  if (body.create_initial_qr !== undefined && typeof body.create_initial_qr !== "boolean") return null;
  const restaurantSlug = slugify(restaurantName), branchSlug = slugify(branchSlugRaw || branchName); if (!restaurantSlug || !branchSlug) return null;
  return { restaurantName, restaurantSlug, legalName, contactName, contactEmail, contactPhone, planCode: body.plan_code as Input["planCode"], accountStatus: body.account_status as Input["accountStatus"], branchName, branchSlug, branchAddress, branchInternalPhone, branchNotes, createInitialQr: body.create_initial_qr !== false };
}
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function optional(value: unknown): string | null | undefined { if (value === undefined || value === null) return null; if (typeof value !== "string") return undefined; return value.trim() || null; }
function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function bearer(header: string | null) { const [scheme, token] = header?.split(" ") ?? []; return scheme === "Bearer" && token?.trim() ? token.trim() : null; }
async function insertOne(promise: PromiseLike<{ data: { id: string } | null; error: unknown }>) { const { data, error } = await promise; if (error || !data) throw error ?? new Error("insert_failed"); return data; }
async function rollback(supabase: ReturnType<typeof createServiceClient>, created: Created) { if (created.qrLinkId) await supabase.from("survey_links").delete().eq("id", created.qrLinkId); if (created.branchId) await supabase.from("branches").delete().eq("id", created.branchId); if (created.settingsId) await supabase.from("restaurant_settings").delete().eq("id", created.settingsId); if (created.accountId) await supabase.from("restaurant_accounts").delete().eq("id", created.accountId); if (created.restaurantId) await supabase.from("restaurants").delete().eq("id", created.restaurantId); }
function buildQrUrl(token: string) { return `${(Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000").trim().replace(/\/+$/, "")}/s/${encodeURIComponent(token)}`; }
function fail(code: ErrorCode, status: number) { return jsonResponse({ ok: false, error: { code, message: code } }, status); }
