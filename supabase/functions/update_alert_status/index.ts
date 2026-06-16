import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse, readJsonBody } from "../_shared/http.ts";
import { createServiceClient } from "../_shared/supabase-admin.ts";

type RequestPayload = {
  alert_id?: unknown;
  status?: unknown;
  internal_note?: unknown;
};

type UserProfile = {
  id: string;
  restaurant_id: string | null;
  role: string;
  status: string;
};

type FeedbackAlert = {
  id: string;
  restaurant_id: string;
  branch_id: string;
  status: string;
};

type UpdateAlertStatusErrorCode =
  | "invalid_payload"
  | "unauthorized"
  | "not_found_or_forbidden"
  | "method_not_allowed"
  | "server_error";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INTERNAL_NOTE_MAX_LENGTH = 500;

Deno.serve(async (req: Request) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  if (req.method !== "POST") {
    return controlledError("method_not_allowed", 405);
  }

  const body = (await readJsonBody(req)) as RequestPayload | null;
  const input = validateRequestPayload(body);

  if (!input.ok) {
    return controlledError("invalid_payload", 400);
  }

  try {
    const supabase = createServiceClient();
    const jwt = getBearerToken(req.headers.get("Authorization") ?? req.headers.get("authorization"));

    if (!jwt) {
      return controlledError("unauthorized", 401);
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !userData.user) {
      return controlledError("unauthorized", 401);
    }

    const profileResult = await getActiveProfile(supabase, userData.user.id);

    if (!profileResult.ok) {
      return controlledError(profileResult.code, profileResult.status);
    }

    const alertResult = await getFeedbackAlert(supabase, input.value.alert_id);

    if (!alertResult.ok) {
      return controlledError(alertResult.code, alertResult.status);
    }

    const hasPermission = await canAttendAlert(
      supabase,
      profileResult.profile,
      alertResult.alert,
    );

    if (!hasPermission) {
      return controlledError("not_found_or_forbidden", 404);
    }

    if (alertResult.alert.status === "attended") {
      return jsonResponse({
        ok: true,
        alert_id: alertResult.alert.id,
        status: "attended",
      });
    }

    if (alertResult.alert.status !== "pending") {
      return controlledError("server_error", 500);
    }

    const now = new Date().toISOString();
    const { data: updatedAlert, error: updateError } = await supabase
      .from("feedback_alerts")
      .update({
        status: "attended",
        attended_by: userData.user.id,
        attended_at: now,
        internal_note: input.value.internal_note,
        updated_at: now,
      })
      .eq("id", input.value.alert_id)
      .eq("status", "pending")
      .select("id, status")
      .maybeSingle<{ id: string; status: string }>();

    if (updateError || !updatedAlert) {
      return controlledError("server_error", 500);
    }

    return jsonResponse({
      ok: true,
      alert_id: updatedAlert.id,
      status: "attended",
    });
  } catch {
    return controlledError("server_error", 500);
  }
});

function validateRequestPayload(body: RequestPayload | null):
  | { ok: true; value: { alert_id: string; internal_note: string | null } }
  | { ok: false } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false };
  }

  const alertId = typeof body.alert_id === "string" ? body.alert_id.trim() : "";

  if (!UUID_PATTERN.test(alertId)) {
    return { ok: false };
  }

  if (body.status !== "attended") {
    return { ok: false };
  }

  if (
    body.internal_note !== undefined &&
    body.internal_note !== null &&
    typeof body.internal_note !== "string"
  ) {
    return { ok: false };
  }

  const internalNote = typeof body.internal_note === "string"
    ? body.internal_note.trim()
    : "";

  if (internalNote.length > INTERNAL_NOTE_MAX_LENGTH) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      alert_id: alertId,
      internal_note: internalNote.length > 0 ? internalNote : null,
    },
  };
}

function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token || token.trim().length === 0) {
    return null;
  }

  return token.trim();
}

async function getActiveProfile(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<
  | { ok: true; profile: UserProfile }
  | { ok: false; code: UpdateAlertStatusErrorCode; status: number }
> {
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("id, restaurant_id, role, status")
    .eq("id", userId)
    .maybeSingle<UserProfile>();

  if (error) {
    return { ok: false, code: "server_error", status: 500 };
  }

  if (!profile || profile.status !== "active") {
    return { ok: false, code: "unauthorized", status: 401 };
  }

  if (profile.role !== "restaurant_admin" && profile.role !== "manager") {
    return { ok: false, code: "not_found_or_forbidden", status: 404 };
  }

  if (!profile.restaurant_id) {
    return { ok: false, code: "not_found_or_forbidden", status: 404 };
  }

  return { ok: true, profile };
}

async function getFeedbackAlert(
  supabase: ReturnType<typeof createServiceClient>,
  alertId: string,
): Promise<
  | { ok: true; alert: FeedbackAlert }
  | { ok: false; code: UpdateAlertStatusErrorCode; status: number }
> {
  const { data: alert, error } = await supabase
    .from("feedback_alerts")
    .select("id, restaurant_id, branch_id, status")
    .eq("id", alertId)
    .maybeSingle<FeedbackAlert>();

  if (error) {
    return { ok: false, code: "server_error", status: 500 };
  }

  if (!alert) {
    return { ok: false, code: "not_found_or_forbidden", status: 404 };
  }

  return { ok: true, alert };
}

async function canAttendAlert(
  supabase: ReturnType<typeof createServiceClient>,
  profile: UserProfile,
  alert: FeedbackAlert,
): Promise<boolean> {
  if (profile.restaurant_id !== alert.restaurant_id) {
    return false;
  }

  if (profile.role === "restaurant_admin") {
    return true;
  }

  if (profile.role !== "manager") {
    return false;
  }

  const { data: assignment, error } = await supabase
    .from("manager_branch_assignments")
    .select("id")
    .eq("manager_user_id", profile.id)
    .eq("restaurant_id", alert.restaurant_id)
    .eq("branch_id", alert.branch_id)
    .eq("status", "active")
    .maybeSingle<{ id: string }>();

  if (error) {
    throw error;
  }

  return Boolean(assignment);
}

function controlledError(code: UpdateAlertStatusErrorCode, status: number): Response {
  return jsonResponse({ ok: false, error: code }, status);
}
