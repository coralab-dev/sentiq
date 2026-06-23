import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse, readJsonBody } from "../_shared/http.ts";
import { createServiceClient } from "../_shared/supabase-admin.ts";

type Payload = { restaurant_id?: unknown; plan_code?: unknown; account_status?: unknown };
type Input = { restaurant_id: string; plan_code: "demo" | "basico" | "pro" | "custom"; account_status: "demo" | "pilot" | "active" | "paused" | "cancelled" };
type Profile = { role: string; status: string };
type Account = { restaurant_id: string; started_at: string | null; cancelled_at: string | null };
type ErrorCode = "invalid_method" | "invalid_payload" | "unauthorized" | "forbidden" | "restaurant_not_found" | "server_error";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PLANS = new Set(["demo", "basico", "pro", "custom"]);
const STATUSES = new Set(["demo", "pilot", "active", "paused", "cancelled"]);

Deno.serve(async (req: Request) => {
  const options = handleOptions(req); if (options) return options;
  if (req.method !== "POST") return fail("invalid_method", 405);
  try {
    const supabase = createServiceClient();
    const jwt = bearer(req.headers.get("Authorization") ?? req.headers.get("authorization"));
    if (!jwt) return fail("unauthorized", 401);
    const { data: auth, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !auth.user) return fail("unauthorized", 401);
    const input = validate(await readJsonBody(req) as Payload | null);
    if (!input) return fail("invalid_payload", 400);
    const { data: profile, error: profileError } = await supabase.from("user_profiles").select("role,status").eq("id", auth.user.id).maybeSingle<Profile>();
    if (profileError) return fail("server_error", 500);
    if (!profile || profile.role !== "platform_admin" || profile.status !== "active") return fail("forbidden", 403);
    const { data: restaurant, error: restaurantError } = await supabase.from("restaurants").select("id").eq("id", input.restaurant_id).maybeSingle<{ id: string }>();
    if (restaurantError) return fail("server_error", 500);
    if (!restaurant) return fail("restaurant_not_found", 404);
    const { data: account, error: accountError } = await supabase.from("restaurant_accounts").select("restaurant_id,started_at,cancelled_at").eq("restaurant_id", input.restaurant_id).maybeSingle<Account>();
    if (accountError) return fail("server_error", 500);
    const now = new Date().toISOString();
    const values = {
      plan_code: input.plan_code,
      account_status: input.account_status,
      started_at: input.account_status === "active" && !account?.started_at ? now : account?.started_at ?? null,
      cancelled_at: input.account_status === "cancelled" ? now : null,
      updated_at: now,
    };
    const query = account
      ? supabase.from("restaurant_accounts").update(values).eq("restaurant_id", input.restaurant_id).select("restaurant_id,plan_code,account_status,started_at,cancelled_at,updated_at").single()
      : supabase.from("restaurant_accounts").insert({ restaurant_id: input.restaurant_id, ...values }).select("restaurant_id,plan_code,account_status,started_at,cancelled_at,updated_at").single();
    const { data: updated, error: updateError } = await query;
    if (updateError || !updated) return fail("server_error", 500);
    return jsonResponse({ ok: true, ...updated });
  } catch {
    return fail("server_error", 500);
  }
});

function validate(body: Payload | null): Input | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const restaurantId = typeof body.restaurant_id === "string" ? body.restaurant_id.trim() : "";
  if (!UUID.test(restaurantId) || typeof body.plan_code !== "string" || !PLANS.has(body.plan_code) || typeof body.account_status !== "string" || !STATUSES.has(body.account_status)) return null;
  return { restaurant_id: restaurantId, plan_code: body.plan_code as Input["plan_code"], account_status: body.account_status as Input["account_status"] };
}

function bearer(header: string | null) { const [scheme, token] = header?.split(" ") ?? []; return scheme === "Bearer" && token?.trim() ? token.trim() : null; }
function fail(code: ErrorCode, status: number) { return jsonResponse({ ok: false, error: { code, message: code } }, status); }
