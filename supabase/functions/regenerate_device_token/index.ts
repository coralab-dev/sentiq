import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse, readJsonBody } from "../_shared/http.ts";
import { createPublicTokenSecret } from "../_shared/public-token.ts";
import { createServiceClient } from "../_shared/supabase-admin.ts";

type RequestPayload = {
  device_id?: unknown;
  survey_link_id?: unknown;
};

type UserProfile = {
  id: string;
  restaurant_id: string | null;
  role: string;
  status: string;
};

type Device = {
  id: string;
  restaurant_id: string;
  branch_id: string;
  zone_id: string | null;
  name: string;
  status: string;
};

type SurveyLink = {
  id: string;
  restaurant_id: string;
  branch_id: string;
  zone_id: string | null;
  device_id: string | null;
  type: string;
  status: string;
};

type Target = {
  device: Device;
  surveyLink: SurveyLink | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  if (req.method !== "POST") {
    return controlledError("invalid_method", 405);
  }

  const body = (await readJsonBody(req)) as RequestPayload | null;
  const input = validateRequestPayload(body);

  if (!input.ok) {
    return controlledError(input.code, 400);
  }

  try {
    const supabase = createServiceClient();
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    const jwt = getBearerToken(authHeader);

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

    const targetResult = input.value.kind === "device"
      ? await resolveByDeviceId(supabase, input.value.id)
      : await resolveBySurveyLinkId(supabase, input.value.id);

    if (!targetResult.ok) {
      return controlledError(targetResult.code, targetResult.status);
    }

    if (!canRegenerateDeviceToken(profileResult.profile, targetResult.target.device.restaurant_id)) {
      return controlledError("forbidden", 403);
    }

    const tokenSecret = await createPublicTokenSecret();
    const now = new Date().toISOString();
    const linkResult = targetResult.target.surveyLink
      ? await updateDeviceSurveyLink(
        supabase,
        targetResult.target.surveyLink.id,
        tokenSecret,
        now,
      )
      : await createDeviceSurveyLink(
        supabase,
        targetResult.target.device,
        userData.user.id,
        tokenSecret,
        now,
      );

    if (!linkResult.ok) {
      return controlledError("server_error", 500);
    }

    return jsonResponse({
      ok: true,
      url: buildSurveyDeviceUrl(tokenSecret.token),
      token_last4: tokenSecret.tokenLast4,
    });
  } catch {
    return controlledError("server_error", 500);
  }
});

function validateRequestPayload(body: RequestPayload | null):
  | { ok: true; value: { kind: "device" | "survey_link"; id: string } }
  | { ok: false; code: RegenerateDeviceTokenErrorCode } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, code: "invalid_payload" };
  }

  const deviceId = typeof body.device_id === "string" ? body.device_id.trim() : "";
  const surveyLinkId = typeof body.survey_link_id === "string" ? body.survey_link_id.trim() : "";

  if (Boolean(deviceId) === Boolean(surveyLinkId)) {
    return { ok: false, code: "invalid_payload" };
  }

  const id = deviceId || surveyLinkId;

  if (!UUID_PATTERN.test(id)) {
    return { ok: false, code: "invalid_payload" };
  }

  return {
    ok: true,
    value: deviceId ? { kind: "device", id: deviceId } : { kind: "survey_link", id: surveyLinkId },
  };
}

function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  return scheme === "Bearer" && token?.trim() ? token.trim() : null;
}

async function getActiveProfile(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<
  | { ok: true; profile: UserProfile }
  | { ok: false; code: RegenerateDeviceTokenErrorCode; status: number }
> {
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("id, restaurant_id, role, status")
    .eq("id", userId)
    .maybeSingle<UserProfile>();

  if (error) return { ok: false, code: "server_error", status: 500 };
  if (!profile || profile.status !== "active") {
    return { ok: false, code: "forbidden", status: 403 };
  }
  if (profile.role !== "platform_admin" && profile.role !== "restaurant_admin") {
    return { ok: false, code: "forbidden", status: 403 };
  }

  return { ok: true, profile };
}

async function resolveByDeviceId(
  supabase: ReturnType<typeof createServiceClient>,
  deviceId: string,
): Promise<
  | { ok: true; target: Target }
  | { ok: false; code: RegenerateDeviceTokenErrorCode; status: number }
> {
  const deviceResult = await getDevice(supabase, deviceId);
  if (!deviceResult.ok) return deviceResult;

  const device = deviceResult.device;
  let linksQuery = supabase
    .from("survey_links")
    .select("id, restaurant_id, branch_id, zone_id, device_id, type, status")
    .eq("device_id", device.id)
    .eq("type", "device")
    .eq("restaurant_id", device.restaurant_id)
    .eq("branch_id", device.branch_id)
    .order("created_at", { ascending: false });

  linksQuery = device.zone_id === null
    ? linksQuery.is("zone_id", null)
    : linksQuery.eq("zone_id", device.zone_id);

  const { data: surveyLinks, error } = await linksQuery;
  if (error) return { ok: false, code: "server_error", status: 500 };

  return {
    ok: true,
    target: { device, surveyLink: selectDeviceSurveyLink(surveyLinks ?? []) },
  };
}

async function resolveBySurveyLinkId(
  supabase: ReturnType<typeof createServiceClient>,
  surveyLinkId: string,
): Promise<
  | { ok: true; target: Target }
  | { ok: false; code: RegenerateDeviceTokenErrorCode; status: number }
> {
  const { data: surveyLink, error } = await supabase
    .from("survey_links")
    .select("id, restaurant_id, branch_id, zone_id, device_id, type, status")
    .eq("id", surveyLinkId)
    .maybeSingle<SurveyLink>();

  if (error) return { ok: false, code: "server_error", status: 500 };
  if (!surveyLink) return { ok: false, code: "survey_link_not_found", status: 404 };
  if (surveyLink.type !== "device" || !surveyLink.device_id) {
    return { ok: false, code: "invalid_payload", status: 400 };
  }

  const deviceResult = await getDevice(supabase, surveyLink.device_id);
  if (!deviceResult.ok) return deviceResult;

  const device = deviceResult.device;
  if (
    surveyLink.restaurant_id !== device.restaurant_id ||
    surveyLink.branch_id !== device.branch_id ||
    surveyLink.zone_id !== device.zone_id
  ) {
    return { ok: false, code: "invalid_payload", status: 400 };
  }

  return { ok: true, target: { device, surveyLink } };
}

async function getDevice(
  supabase: ReturnType<typeof createServiceClient>,
  deviceId: string,
): Promise<
  | { ok: true; device: Device }
  | { ok: false; code: RegenerateDeviceTokenErrorCode; status: number }
> {
  const { data: device, error } = await supabase
    .from("devices")
    .select("id, restaurant_id, branch_id, zone_id, name, status")
    .eq("id", deviceId)
    .maybeSingle<Device>();

  if (error) return { ok: false, code: "server_error", status: 500 };
  if (!device) return { ok: false, code: "device_not_found", status: 404 };
  return { ok: true, device };
}

function canRegenerateDeviceToken(profile: UserProfile, restaurantId: string): boolean {
  if (profile.role === "platform_admin") return true;
  if (profile.role !== "restaurant_admin") return false;
  return profile.restaurant_id === restaurantId;
}

async function updateDeviceSurveyLink(
  supabase: ReturnType<typeof createServiceClient>,
  surveyLinkId: string,
  tokenSecret: { tokenHash: string; tokenLast4: string },
  now: string,
): Promise<{ ok: boolean }> {
  const { error } = await supabase
    .from("survey_links")
    .update({
      token_hash: tokenSecret.tokenHash,
      token_last4: tokenSecret.tokenLast4,
      status: "active",
      regenerated_at: now,
      revoked_at: null,
      updated_at: now,
    })
    .eq("id", surveyLinkId);

  return { ok: !error };
}

async function createDeviceSurveyLink(
  supabase: ReturnType<typeof createServiceClient>,
  device: Device,
  userId: string,
  tokenSecret: { tokenHash: string; tokenLast4: string },
  now: string,
): Promise<{ ok: boolean }> {
  const { error } = await supabase
    .from("survey_links")
    .insert({
      restaurant_id: device.restaurant_id,
      branch_id: device.branch_id,
      zone_id: device.zone_id,
      device_id: device.id,
      type: "device",
      name: device.name,
      status: "active",
      created_by: userId,
      token_hash: tokenSecret.tokenHash,
      token_last4: tokenSecret.tokenLast4,
      regenerated_at: now,
      revoked_at: null,
      updated_at: now,
    });

  return { ok: !error };
}

function selectDeviceSurveyLink(surveyLinks: SurveyLink[]): SurveyLink | null {
  return surveyLinks.find((link) => link.status === "active") ?? surveyLinks[0] ?? null;
}

function buildSurveyDeviceUrl(token: string): string {
  const baseUrl = (Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000")
    .trim()
    .replace(/\/+$/, "");

  return `${baseUrl}/d/${encodeURIComponent(token)}`;
}

type RegenerateDeviceTokenErrorCode =
  | "invalid_method"
  | "invalid_payload"
  | "unauthorized"
  | "forbidden"
  | "device_not_found"
  | "survey_link_not_found"
  | "server_error";

function controlledError(code: RegenerateDeviceTokenErrorCode, status: number): Response {
  return jsonResponse({ ok: false, error: { code, message: code } }, status);
}
