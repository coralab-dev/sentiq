import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse, readJsonBody } from "../_shared/http.ts";
import { createServiceClient } from "../_shared/supabase-admin.ts";

type Input = { full_name?: unknown; email?: unknown; branch_ids?: unknown; restaurant_id?: unknown };
type Profile = { id: string; restaurant_id: string | null; role: string; status: string };
type ErrorCode = "invalid_method" | "invalid_payload" | "unauthorized" | "forbidden" | "branch_not_found" | "email_conflict" | "server_error";
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
    if (!parsed.ok) return fail("invalid_payload", 400);
    const { data: admin, error: profileError } = await supabase.from("user_profiles").select("id,restaurant_id,role,status").eq("id", auth.user.id).maybeSingle<Profile>();
    if (profileError) return fail("server_error", 500);
    if (!admin || admin.status !== "active" || admin.role !== "restaurant_admin" || !admin.restaurant_id) return fail("forbidden", 403);
    if (parsed.value.restaurant_id && parsed.value.restaurant_id !== admin.restaurant_id) return fail("forbidden", 403);

    const { data: branches, error: branchError } = await supabase.from("branches").select("id").eq("restaurant_id", admin.restaurant_id).eq("status", "active").in("id", parsed.value.branch_ids);
    if (branchError) return fail("server_error", 500);
    if ((branches ?? []).length !== parsed.value.branch_ids.length) return fail("branch_not_found", 404);

    const existingAuth = await findAuthUser(supabase, parsed.value.email);
    let managerId: string; let created = false; let status: "active" | "invited" = "active";
    if (existingAuth) {
      managerId = existingAuth.id;
      const { data: existingProfile, error } = await supabase.from("user_profiles").select("id,restaurant_id,role,status").eq("id", managerId).maybeSingle<Profile>();
      if (error) return fail("server_error", 500);
      if (!existingProfile || existingProfile.role !== "manager" || existingProfile.restaurant_id !== admin.restaurant_id) return fail("email_conflict", 409);
    } else {
      const metadata = { full_name: parsed.value.full_name, role: "manager", restaurant_id: admin.restaurant_id };
      const invitation = await supabase.auth.admin.inviteUserByEmail(parsed.value.email, { data: metadata });
      let newUser = invitation.data.user;
      if (invitation.error || !newUser) {
        const fallback = await supabase.auth.admin.createUser({ email: parsed.value.email, password: randomPassword(), email_confirm: false, user_metadata: metadata });
        if (fallback.error || !fallback.data.user) return fail(fallback.error?.message?.toLowerCase().includes("already") ? "email_conflict" : "server_error", fallback.error?.message?.toLowerCase().includes("already") ? 409 : 500);
        newUser = fallback.data.user;
      }
      managerId = newUser.id; created = true; status = "invited";
    }

    const now = new Date().toISOString();
    const { error: upsertError } = await supabase.from("user_profiles").upsert({ id: managerId, restaurant_id: admin.restaurant_id, full_name: parsed.value.full_name, email: parsed.value.email, role: "manager", status, created_by: admin.id, updated_at: now }, { onConflict: "id" });
    if (upsertError) return fail("server_error", 500);
    const { data: current, error: currentError } = await supabase.from("manager_branch_assignments").select("id,branch_id,status").eq("manager_user_id", managerId).eq("restaurant_id", admin.restaurant_id);
    if (currentError) return fail("server_error", 500);
    const requested = new Set(parsed.value.branch_ids);
    for (const row of current ?? []) if (!requested.has(row.branch_id) && row.status !== "inactive") await supabase.from("manager_branch_assignments").update({ status: "inactive" }).eq("id", row.id);
    for (const branchId of parsed.value.branch_ids) {
      const row = (current ?? []).find((item) => item.branch_id === branchId);
      const result = row ? await supabase.from("manager_branch_assignments").update({ status: "active" }).eq("id", row.id) : await supabase.from("manager_branch_assignments").insert({ restaurant_id: admin.restaurant_id, manager_user_id: managerId, branch_id: branchId, status: "active", created_by: admin.id });
      if (result.error) return fail("server_error", 500);
    }
    return jsonResponse({ ok: true, user_id: managerId, email: parsed.value.email, status, branch_ids: parsed.value.branch_ids, created });
  } catch { return fail("server_error", 500); }
});

function validate(body: Input | null): { ok: true; value: { full_name: string; email: string; branch_ids: string[]; restaurant_id?: string } } | { ok: false } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false };
  const full_name = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (full_name.length < 2 || full_name.length > 120 || !EMAIL.test(email) || !Array.isArray(body.branch_ids) || body.branch_ids.length < 1 || body.branch_ids.length > 50) return { ok: false };
  if (!body.branch_ids.every((id) => typeof id === "string" && UUID.test(id)) || new Set(body.branch_ids).size !== body.branch_ids.length) return { ok: false };
  if (body.restaurant_id !== undefined && (typeof body.restaurant_id !== "string" || !UUID.test(body.restaurant_id))) return { ok: false };
  return { ok: true, value: { full_name, email, branch_ids: body.branch_ids, ...(body.restaurant_id ? { restaurant_id: body.restaurant_id } : {}) } };
}
function bearer(header: string | null) { const [scheme, token] = header?.split(" ") ?? []; return scheme === "Bearer" && token?.trim() ? token.trim() : null; }
function randomPassword() { const bytes = crypto.getRandomValues(new Uint8Array(32)); return `${btoa(String.fromCharCode(...bytes)).replace(/[^a-zA-Z0-9]/g, "A")}a1!`; }
async function findAuthUser(supabase: ReturnType<typeof createServiceClient>, email: string) { for (let page = 1; ; page++) { const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 }); if (error) throw error; const found = data.users.find((user) => user.email?.toLowerCase() === email); if (found) return found; if (data.users.length < 1000) return null; } }
function fail(code: ErrorCode, status: number) { return jsonResponse({ ok: false, error: { code, message: code } }, status); }
