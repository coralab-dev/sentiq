import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse, readJsonBody } from "../_shared/http.ts";
import { createServiceClient } from "../_shared/supabase-admin.ts";

type Payload = { restaurant_id?: unknown };
type ErrorCode = "invalid_method" | "invalid_payload" | "unauthorized" | "forbidden" | "server_error";
type Profile = { role: string; status: string };
type ResponseRow = { restaurant_id: string; general_experience: number; created_at: string };
type AlertRow = { restaurant_id: string; status: string; created_at: string; updated_at: string | null };
type Summary = { restaurant_id: string; response_count: number; alert_count: number; pending_alert_count: number; attended_alert_count: number; avg_general_experience: number | null; last_response_at: string | null; last_alert_at: string | null };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  const options = handleOptions(req); if (options) return options;
  if (req.method !== "POST") return fail("invalid_method", 405);
  try {
    const input = validate(await readJsonBody(req) as Payload | null);
    if (!input) return fail("invalid_payload", 400);
    const supabase = createServiceClient();
    const jwt = bearer(req.headers.get("Authorization") ?? req.headers.get("authorization"));
    if (!jwt) return fail("unauthorized", 401);
    const { data: auth, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !auth.user) return fail("unauthorized", 401);
    const { data: profile, error: profileError } = await supabase.from("user_profiles").select("role,status").eq("id", auth.user.id).maybeSingle<Profile>();
    if (profileError) return fail("server_error", 500);
    if (!profile || profile.role !== "platform_admin" || profile.status !== "active") return fail("forbidden", 403);

    let responsesQuery = supabase.from("feedback_responses").select("restaurant_id,general_experience,created_at");
    let alertsQuery = supabase.from("feedback_alerts").select("restaurant_id,status,created_at,updated_at");
    if (input.restaurant_id) {
      responsesQuery = responsesQuery.eq("restaurant_id", input.restaurant_id);
      alertsQuery = alertsQuery.eq("restaurant_id", input.restaurant_id);
    }
    const [responsesResult, alertsResult] = await Promise.all([responsesQuery, alertsQuery]);
    if (responsesResult.error || alertsResult.error) return fail("server_error", 500);
    return jsonResponse({ ok: true, items: summarize((responsesResult.data ?? []) as ResponseRow[], (alertsResult.data ?? []) as AlertRow[]) });
  } catch {
    return fail("server_error", 500);
  }
});

function validate(body: Payload | null): { restaurant_id?: string } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  if (body.restaurant_id === undefined || body.restaurant_id === null || body.restaurant_id === "") return {};
  if (typeof body.restaurant_id !== "string" || !UUID.test(body.restaurant_id.trim())) return null;
  return { restaurant_id: body.restaurant_id.trim() };
}

function summarize(responses: ResponseRow[], alerts: AlertRow[]): Summary[] {
  const byRestaurant = new Map<string, Summary & { rating_sum: number }>();
  const ensure = (restaurantId: string) => {
    const existing = byRestaurant.get(restaurantId);
    if (existing) return existing;
    const created = { restaurant_id: restaurantId, response_count: 0, alert_count: 0, pending_alert_count: 0, attended_alert_count: 0, avg_general_experience: null, last_response_at: null, last_alert_at: null, rating_sum: 0 };
    byRestaurant.set(restaurantId, created);
    return created;
  };
  for (const response of responses) {
    const item = ensure(response.restaurant_id);
    item.response_count += 1;
    item.rating_sum += response.general_experience;
    item.last_response_at = maxDate(item.last_response_at, response.created_at);
  }
  for (const alert of alerts) {
    const item = ensure(alert.restaurant_id);
    item.alert_count += 1;
    if (alert.status === "pending") item.pending_alert_count += 1;
    if (alert.status === "attended") item.attended_alert_count += 1;
    item.last_alert_at = maxDate(item.last_alert_at, alert.updated_at ?? alert.created_at);
  }
  return [...byRestaurant.values()].map(({ rating_sum, ...item }) => ({ ...item, avg_general_experience: item.response_count ? Math.round((rating_sum / item.response_count) * 100) / 100 : null })).sort((a, b) => a.restaurant_id.localeCompare(b.restaurant_id));
}

function maxDate(current: string | null, next: string | null) { if (!next) return current; if (!current) return next; return next > current ? next : current; }
function bearer(header: string | null) { const [scheme, token] = header?.split(" ") ?? []; return scheme === "Bearer" && token?.trim() ? token.trim() : null; }
function fail(code: ErrorCode, status: number) { return jsonResponse({ ok: false, error: { code, message: code } }, status); }
