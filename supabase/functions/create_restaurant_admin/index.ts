import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse, readJsonBody } from "../_shared/http.ts";
import { createServiceClient } from "../_shared/supabase-admin.ts";

type Input = { restaurant_id?: unknown; full_name?: unknown; email?: unknown };
type Profile = { id: string; restaurant_id: string | null; email: string | null; role: string; status: string };
type ErrorCode = "invalid_method" | "invalid_payload" | "unauthorized" | "forbidden" | "restaurant_not_found" | "email_conflict" | "admin_exists" | "server_error";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  const options = handleOptions(req); if (options) return options;
  if (req.method !== "POST") return fail("invalid_method", 405);
  try {
    const supabase = createServiceClient();
    const jwt = bearer(req.headers.get("Authorization") ?? req.headers.get("authorization"));
    if (!jwt) return fail("unauthorized", 401);
    const { data: auth, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !auth.user) return fail("unauthorized", 401);
    const parsed = validate(await readJsonBody(req) as Input | null);
    if (!parsed) return fail("invalid_payload", 400);

    const { data: platformAdmin, error: profileError } = await supabase.from("user_profiles").select("id,restaurant_id,email,role,status").eq("id", auth.user.id).maybeSingle<Profile>();
    if (profileError) return fail("server_error", 500);
    if (!platformAdmin || platformAdmin.role !== "platform_admin" || platformAdmin.status !== "active") return fail("forbidden", 403);

    const { data: restaurant, error: restaurantError } = await supabase.from("restaurants").select("id").eq("id", parsed.restaurant_id).eq("status", "active").maybeSingle<{ id: string }>();
    if (restaurantError) return fail("server_error", 500);
    if (!restaurant) return fail("restaurant_not_found", 404);

    const { data: currentAdmin, error: adminError } = await supabase.from("user_profiles").select("id,restaurant_id,email,role,status").eq("restaurant_id", parsed.restaurant_id).eq("role", "restaurant_admin").in("status", ["active", "invited"]).maybeSingle<Profile>();
    if (adminError) return fail("server_error", 500);
    if (currentAdmin) {
      if (currentAdmin.email?.toLowerCase() !== parsed.email) return fail("admin_exists", 409);
      const { error: updateError } = await supabase.from("user_profiles").update({ full_name: parsed.full_name, email: parsed.email, updated_at: new Date().toISOString() }).eq("id", currentAdmin.id);
      if (updateError) return fail("server_error", 500);
      return jsonResponse({ ok: true, user_id: currentAdmin.id, email: parsed.email, restaurant_id: parsed.restaurant_id, status: currentAdmin.status, created: false });
    }

    const existingAuth = await findAuthUser(supabase, parsed.email);
    let userId: string; let created = false; let status: "active" | "invited";
    if (existingAuth) {
      userId = existingAuth.id;
      const { data: existingProfile, error } = await supabase.from("user_profiles").select("id,restaurant_id,email,role,status").eq("id", userId).maybeSingle<Profile>();
      if (error) return fail("server_error", 500);
      if (existingProfile && (existingProfile.role !== "restaurant_admin" || existingProfile.restaurant_id !== parsed.restaurant_id)) return fail("email_conflict", 409);
      status = existingAuth.email_confirmed_at ? "active" : "invited";
    } else {
      const metadata = { full_name: parsed.full_name, role: "restaurant_admin", restaurant_id: parsed.restaurant_id };
      const invitation = await supabase.auth.admin.inviteUserByEmail(parsed.email, { data: metadata });
      let newUser = invitation.data.user;
      if (invitation.error || !newUser) {
        const fallback = await supabase.auth.admin.createUser({ email: parsed.email, password: randomPassword(), email_confirm: false, user_metadata: metadata });
        if (fallback.error || !fallback.data.user) return fail(fallback.error?.message?.toLowerCase().includes("already") ? "email_conflict" : "server_error", fallback.error?.message?.toLowerCase().includes("already") ? 409 : 500);
        newUser = fallback.data.user;
      }
      userId = newUser.id; created = true; status = "invited";
    }

    const { error: upsertError } = await supabase.from("user_profiles").upsert({ id: userId, restaurant_id: parsed.restaurant_id, full_name: parsed.full_name, email: parsed.email, role: "restaurant_admin", status, created_by: platformAdmin.id, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (upsertError) return fail("server_error", 500);
    return jsonResponse({ ok: true, user_id: userId, email: parsed.email, restaurant_id: parsed.restaurant_id, status, created });
  } catch { return fail("server_error", 500); }
});

function validate(body: Input | null) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const restaurant_id = typeof body.restaurant_id === "string" ? body.restaurant_id.trim() : "";
  const full_name = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!UUID.test(restaurant_id) || full_name.length < 2 || full_name.length > 120 || !EMAIL.test(email)) return null;
  return { restaurant_id, full_name, email };
}
function bearer(header: string | null) { const [scheme, token] = header?.split(" ") ?? []; return scheme === "Bearer" && token?.trim() ? token.trim() : null; }
function randomPassword() { const bytes = crypto.getRandomValues(new Uint8Array(32)); return `${btoa(String.fromCharCode(...bytes)).replace(/[^a-zA-Z0-9]/g, "A")}a1!`; }
async function findAuthUser(supabase: ReturnType<typeof createServiceClient>, email: string) { for (let page = 1; ; page++) { const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 }); if (error) throw error; const found = data.users.find((user) => user.email?.toLowerCase() === email); if (found) return found; if (data.users.length < 1000) return null; } }
function fail(code: ErrorCode, status: number) { return jsonResponse({ ok: false, error: { code, message: code } }, status); }
