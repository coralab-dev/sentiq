import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse, readJsonBody } from "../_shared/http.ts";
import { createServiceClient } from "../_shared/supabase-admin.ts";

type RequestPayload = {
  date_from?: unknown;
  date_to?: unknown;
  branch_id?: unknown;
  source?: unknown;
  has_alert?: unknown;
};

type ValidPayload = {
  date_from: string;
  date_to: string;
  startIso: string;
  endIso: string;
  branch_id: string | null;
  source: "qr" | "device" | null;
  has_alert: boolean | null;
};

type UserProfile = {
  id: string;
  restaurant_id: string | null;
  role: string;
  status: string;
};

type Branch = {
  id: string;
  name: string;
  restaurant_id?: string;
};

type Restaurant = {
  id: string;
  name: string;
};

type Zone = {
  id: string;
  name: string;
};

type Device = {
  id: string;
  name: string;
};

type FeedbackResponse = {
  id: string;
  restaurant_id: string;
  branch_id: string;
  zone_id: string | null;
  device_id: string | null;
  source: string;
  general_experience: number;
  service_attention: number;
  food_quality: number;
  service_speed: number;
  comment: string | null;
  customer_phone: string | null;
  consent_to_contact: boolean;
  has_alert: boolean;
  created_at: string | null;
};

type FeedbackAlert = {
  response_id: string;
  status: string;
};

type ExportFeedbackCsvErrorCode =
  | "invalid_payload"
  | "unauthorized"
  | "not_found"
  | "invalid_method"
  | "server_error";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 90;
const CSV_COLUMNS = [
  "fecha",
  "restaurante",
  "sucursal",
  "fuente",
  "zona",
  "dispositivo",
  "experiencia_general",
  "atencion",
  "calidad_alimentos_bebidas",
  "rapidez",
  "comentario",
  "telefono",
  "tiene_alerta",
  "estado_alerta",
];

Deno.serve(async (req: Request) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  if (req.method !== "POST") {
    return controlledError("invalid_method", 405);
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

    const branchScopeResult = await resolveBranchScope(
      supabase,
      profileResult.profile,
      input.value.branch_id,
    );

    if (!branchScopeResult.ok) {
      return controlledError(branchScopeResult.code, branchScopeResult.status);
    }

    const responses = await loadResponses(
      supabase,
      profileResult.profile.restaurant_id,
      input.value,
      branchScopeResult.branchIds,
    );

    const related = await loadRelatedData(
      supabase,
      profileResult.profile.restaurant_id,
      responses,
    );

    return jsonResponse({
      ok: true,
      filename: `feedback-export-${input.value.date_from}_${input.value.date_to}.csv`,
      content: buildCsv(responses, related),
    });
  } catch {
    return controlledError("server_error", 500);
  }
});

function validateRequestPayload(body: RequestPayload | null):
  | { ok: true; value: ValidPayload }
  | { ok: false } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false };
  }

  const dateFrom = typeof body.date_from === "string" ? body.date_from.trim() : "";
  const dateTo = typeof body.date_to === "string" ? body.date_to.trim() : "";

  if (!isValidDateInput(dateFrom) || !isValidDateInput(dateTo)) {
    return { ok: false };
  }

  const startDate = new Date(`${dateFrom}T00:00:00.000Z`);
  const endDate = new Date(`${dateTo}T23:59:59.999Z`);

  if (startDate.getTime() > endDate.getTime()) {
    return { ok: false };
  }

  const rangeDays = Math.floor(
    (Date.parse(`${dateTo}T00:00:00.000Z`) - startDate.getTime()) / 86_400_000,
  ) + 1;

  if (rangeDays > MAX_RANGE_DAYS) {
    return { ok: false };
  }

  const branchId = body.branch_id === undefined || body.branch_id === null
    ? null
    : typeof body.branch_id === "string"
    ? body.branch_id.trim()
    : "";

  if (branchId !== null && !UUID_PATTERN.test(branchId)) {
    return { ok: false };
  }

  const source = body.source === undefined || body.source === null
    ? null
    : typeof body.source === "string"
    ? body.source.trim()
    : "";

  if (source !== null && source !== "qr" && source !== "device") {
    return { ok: false };
  }

  if (
    body.has_alert !== undefined &&
    body.has_alert !== null &&
    typeof body.has_alert !== "boolean"
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      date_from: dateFrom,
      date_to: dateTo,
      startIso: startDate.toISOString(),
      endIso: endDate.toISOString(),
      branch_id: branchId,
      source,
      has_alert: typeof body.has_alert === "boolean" ? body.has_alert : null,
    },
  };
}

function isValidDateInput(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
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
  | { ok: true; profile: UserProfile & { restaurant_id: string } }
  | { ok: false; code: ExportFeedbackCsvErrorCode; status: number }
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
    return { ok: false, code: "not_found", status: 404 };
  }

  if (!profile.restaurant_id) {
    return { ok: false, code: "not_found", status: 404 };
  }

  return { ok: true, profile: profile as UserProfile & { restaurant_id: string } };
}

async function resolveBranchScope(
  supabase: ReturnType<typeof createServiceClient>,
  profile: UserProfile & { restaurant_id: string },
  requestedBranchId: string | null,
): Promise<
  | { ok: true; branchIds: string[] | null }
  | { ok: false; code: ExportFeedbackCsvErrorCode; status: number }
> {
  if (profile.role === "restaurant_admin") {
    if (!requestedBranchId) {
      return { ok: true, branchIds: null };
    }

    const { data: branch, error } = await supabase
      .from("branches")
      .select("id, restaurant_id")
      .eq("id", requestedBranchId)
      .eq("restaurant_id", profile.restaurant_id)
      .maybeSingle<{ id: string; restaurant_id: string }>();

    if (error) {
      return { ok: false, code: "server_error", status: 500 };
    }

    if (!branch) {
      return { ok: false, code: "not_found", status: 404 };
    }

    return { ok: true, branchIds: [requestedBranchId] };
  }

  const assignmentsQuery = supabase
    .from("manager_branch_assignments")
    .select("branch_id")
    .eq("manager_user_id", profile.id)
    .eq("restaurant_id", profile.restaurant_id)
    .eq("status", "active");

  const { data: assignments, error } = requestedBranchId
    ? await assignmentsQuery.eq("branch_id", requestedBranchId)
    : await assignmentsQuery;

  if (error) {
    return { ok: false, code: "server_error", status: 500 };
  }

  const branchIds = Array.from(
    new Set((assignments ?? []).map((assignment: { branch_id: string }) => assignment.branch_id)),
  );

  if (requestedBranchId && branchIds.length === 0) {
    return { ok: false, code: "not_found", status: 404 };
  }

  return { ok: true, branchIds };
}

async function loadResponses(
  supabase: ReturnType<typeof createServiceClient>,
  restaurantId: string,
  input: ValidPayload,
  branchIds: string[] | null,
): Promise<FeedbackResponse[]> {
  if (branchIds && branchIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("feedback_responses")
    .select(
      "id, restaurant_id, branch_id, zone_id, device_id, source, general_experience, service_attention, food_quality, service_speed, comment, customer_phone, consent_to_contact, has_alert, created_at",
    )
    .eq("restaurant_id", restaurantId)
    .gte("created_at", input.startIso)
    .lte("created_at", input.endIso)
    .order("created_at", { ascending: true });

  if (branchIds) {
    query = query.in("branch_id", branchIds);
  }

  if (input.source) {
    query = query.eq("source", input.source);
  }

  if (input.has_alert !== null) {
    query = query.eq("has_alert", input.has_alert);
  }

  const { data, error } = await query.returns<FeedbackResponse[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function loadRelatedData(
  supabase: ReturnType<typeof createServiceClient>,
  restaurantId: string,
  responses: FeedbackResponse[],
) {
  const branchIds = uniqueValues(responses.map((response) => response.branch_id));
  const zoneIds = uniqueValues(responses.map((response) => response.zone_id));
  const deviceIds = uniqueValues(responses.map((response) => response.device_id));
  const responseIds = uniqueValues(responses.map((response) => response.id));

  const restaurantRequest = supabase
    .from("restaurants")
    .select("id, name")
    .eq("id", restaurantId)
    .maybeSingle<Restaurant>();

  const branchesRequest = branchIds.length > 0
    ? supabase
        .from("branches")
        .select("id, name")
        .eq("restaurant_id", restaurantId)
        .in("id", branchIds)
        .returns<Branch[]>()
    : Promise.resolve({ data: [], error: null });

  const zonesRequest = zoneIds.length > 0
    ? supabase
        .from("zones")
        .select("id, name")
        .eq("restaurant_id", restaurantId)
        .in("id", zoneIds)
        .returns<Zone[]>()
    : Promise.resolve({ data: [], error: null });

  const devicesRequest = deviceIds.length > 0
    ? supabase
        .from("devices")
        .select("id, name")
        .eq("restaurant_id", restaurantId)
        .in("id", deviceIds)
        .returns<Device[]>()
    : Promise.resolve({ data: [], error: null });

  const alertsRequest = responseIds.length > 0
    ? supabase
        .from("feedback_alerts")
        .select("response_id, status")
        .eq("restaurant_id", restaurantId)
        .in("response_id", responseIds)
        .returns<FeedbackAlert[]>()
    : Promise.resolve({ data: [], error: null });

  const [restaurantResult, branchesResult, zonesResult, devicesResult, alertsResult] =
    await Promise.all([
      restaurantRequest,
      branchesRequest,
      zonesRequest,
      devicesRequest,
      alertsRequest,
    ]);

  if (restaurantResult.error || !restaurantResult.data) {
    throw restaurantResult.error ?? new Error("Restaurant not found");
  }

  if (branchesResult.error) throw branchesResult.error;
  if (zonesResult.error) throw zonesResult.error;
  if (devicesResult.error) throw devicesResult.error;
  if (alertsResult.error) throw alertsResult.error;

  return {
    restaurant: restaurantResult.data,
    branchesById: new Map((branchesResult.data ?? []).map((branch) => [branch.id, branch])),
    zonesById: new Map((zonesResult.data ?? []).map((zone) => [zone.id, zone])),
    devicesById: new Map((devicesResult.data ?? []).map((device) => [device.id, device])),
    alertsByResponseId: new Map(
      (alertsResult.data ?? []).map((alert) => [alert.response_id, alert]),
    ),
  };
}

function buildCsv(
  responses: FeedbackResponse[],
  related: Awaited<ReturnType<typeof loadRelatedData>>,
): string {
  const rows = responses.map((response) => {
    const alert = related.alertsByResponseId.get(response.id);
    const phone = response.customer_phone?.trim() && response.consent_to_contact
      ? response.customer_phone
      : "";

    return [
      response.created_at,
      related.restaurant.name,
      related.branchesById.get(response.branch_id)?.name ?? "",
      response.source,
      response.zone_id ? related.zonesById.get(response.zone_id)?.name ?? "" : "",
      response.device_id ? related.devicesById.get(response.device_id)?.name ?? "" : "",
      response.general_experience,
      response.service_attention,
      response.food_quality,
      response.service_speed,
      response.comment,
      phone,
      response.has_alert ? "si" : "no",
      alert?.status ?? "",
    ];
  });

  return [CSV_COLUMNS, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  const escaped = text.replaceAll('"', '""');

  if (/[",\n\r]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
}

function uniqueValues(values: Array<string | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function controlledError(code: ExportFeedbackCsvErrorCode, status: number): Response {
  return jsonResponse({ ok: false, error: code }, status);
}
