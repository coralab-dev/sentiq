import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const FUNCTIONS = [
  "get_public_survey_config",
  "submit_feedback",
  "create_restaurant",
  "create_restaurant_admin",
  "get_platform_activity_summary",
  "update_restaurant_account",
  "create_manager_user",
  "regenerate_qr_token",
  "regenerate_device_token",
  "update_alert_status",
  "export_feedback_csv",
];

const PROTECTED_FUNCTIONS = [
  "create_restaurant",
  "create_restaurant_admin",
  "get_platform_activity_summary",
  "update_restaurant_account",
  "create_manager_user",
  "regenerate_qr_token",
  "regenerate_device_token",
  "update_alert_status",
  "export_feedback_csv",
];

const PUBLIC_FUNCTIONS = ["get_public_survey_config", "submit_feedback"];
const SENSITIVE_KEYS = new Set([
  "service_role",
  "service_role_key",
  "token_hash",
  "token",
  "customer_phone",
  "comment",
  "response_id",
  "feedback_response_id",
  "raw_ip",
  "ip_address",
]);

const ALLOWED_SENSITIVE_KEYS_BY_FUNCTION = {
  submit_feedback: new Set(["response_id"]),
};

const TECHNICAL_LEAK_PATTERNS = [
  /\bstack\b/i,
  /stacktrace/i,
  /\btrace\b/i,
  /PostgrestError/i,
  /postgres/i,
  /\brelation\b/i,
  /\bschema\b/i,
  /\bcolumn\b/i,
  /\bpolicy\b/i,
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /service_role/i,
  /token_hash/i,
  /source_mismatch/i,
  /token_required/i,
  /invalid_source/i,
  /invalid_general_experience/i,
  /invalid_service_attention/i,
  /invalid_food_quality/i,
  /invalid_service_speed/i,
  /comment_too_long/i,
  /phone_too_long/i,
  /customer_phone_requires_consent/i,
  /get_public_survey_config/i,
  /submit_feedback/i,
  /create_restaurant/i,
  /create_restaurant_admin/i,
  /get_platform_activity_summary/i,
  /update_restaurant_account/i,
  /create_manager_user/i,
  /regenerate_qr_token/i,
  /regenerate_device_token/i,
  /update_alert_status/i,
  /export_feedback_csv/i,
];

const ALLOWED_ERROR_CODES = new Set([
  "invalid_method",
  "invalid_payload",
  "invalid_token",
  "inactive_link",
  "inactive_restaurant",
  "inactive_branch",
  "inactive_device",
  "rate_limited",
  "unauthorized",
  "forbidden",
  "not_found",
  "server_error",
  "slug_conflict",
  "restaurant_not_found",
  "email_conflict",
  "admin_exists",
  "branch_not_found",
]);

loadEnv(".env");
loadEnv(".env.local");

const env = {
  url: required("NEXT_PUBLIC_SUPABASE_URL"),
  anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  platformEmail: value("QA_PLATFORM_ADMIN_EMAIL", "DEMO_PLATFORM_ADMIN_EMAIL"),
  platformPassword: value("QA_PLATFORM_ADMIN_PASSWORD", "DEMO_PLATFORM_ADMIN_PASSWORD"),
  adminEmail: value("QA_ADMIN_EMAIL", "DEMO_RESTAURANT_ADMIN_EMAIL"),
  adminPassword: value("QA_ADMIN_PASSWORD", "DEMO_RESTAURANT_ADMIN_PASSWORD"),
  managerEmail: optional("QA_MANAGER_EMAIL") || optional("DEMO_MANAGER_EMAIL"),
  managerPassword: optional("QA_MANAGER_PASSWORD") || optional("DEMO_MANAGER_PASSWORD"),
  allowedAlertId: optional("QA_ALLOWED_ALERT_ID"),
  forbiddenAlertId: optional("QA_FORBIDDEN_ALERT_ID"),
};

const client = createClient(env.url, env.anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = [];
const created = {
  restaurants: [],
  branches: [],
  qrLinks: [],
  managers: [],
  responses: [],
};

let sessions = {};
let fixture = null;

class SkipError extends Error {}

await main();

async function main() {
  await step("environment", "required env is present", async () => {
    assert(env.url.startsWith("http"), "NEXT_PUBLIC_SUPABASE_URL is invalid");
    assert(env.anonKey.length > 20, "NEXT_PUBLIC_SUPABASE_ANON_KEY is invalid");
  });

  await step("auth", "platform_admin credentials work", async () => {
    sessions.platform = await login(env.platformEmail, env.platformPassword, "platform_admin");
  });

  await step("auth", "restaurant_admin credentials work", async () => {
    sessions.admin = await login(env.adminEmail, env.adminPassword, "restaurant_admin");
  });

  await step("auth", "manager credentials are optional", async () => {
    if (!env.managerEmail || !env.managerPassword) {
      skip("QA_MANAGER_EMAIL/QA_MANAGER_PASSWORD not configured");
    }
    sessions.manager = await login(env.managerEmail, env.managerPassword, "manager");
  });

  await step("global", "all registered functions handle OPTIONS", async () => {
    for (const functionName of FUNCTIONS) {
      const result = await invoke(functionName, { method: "OPTIONS" });
      assert([200, 204].includes(result.status), `${functionName} OPTIONS returned ${result.status}`);
    }
  });

  await step("global", "all registered functions reject GET with controlled response", async () => {
    for (const functionName of FUNCTIONS) {
      const result = await invoke(functionName, { method: "GET" });
      assert(result.status === 405 || result.status === 401, `${functionName} GET returned ${result.status}`);
      assertNoTechnicalLeak(functionName, result.body);
    }
  });

  await step("global", "protected functions require JWT", async () => {
    for (const functionName of PROTECTED_FUNCTIONS) {
      const result = await invoke(functionName, { body: noJwtPayload(functionName) });
      assert(result.status === 401, `${functionName} without JWT returned ${result.status}`);
      assertControlledError(result.body);
      assertAllowedErrorCode(functionName, result.body);
      assertNoSensitiveKeys(functionName, result.body);
    }
  });

  await step("global", "public functions do not require user session for invalid payload checks", async () => {
    for (const functionName of PUBLIC_FUNCTIONS) {
      const result = await invoke(functionName, { body: {} });
      assert([400, 404].includes(result.status), `${functionName} public invalid call returned ${result.status}`);
      assertControlledError(result.body);
      assertAllowedErrorCode(functionName, result.body);
      assertNoSensitiveKeys(functionName, result.body);
    }
  });

  await step("fixture", "create isolated QA T057 restaurant with QR", async () => {
    const stamp = Date.now();
    const result = await invoke("create_restaurant", {
      token: sessions.platform.access_token,
      body: {
        restaurant_name: `QA T057 Restaurant ${stamp}`,
        plan_code: "demo",
        account_status: "demo",
        branch_name: "QA T057 Branch",
        create_initial_qr: true,
      },
    });
    assertOk(result, "create_restaurant fixture");
    assert(result.body.qr_url, "fixture QR url missing");
    assertNoSensitiveKeys("create_restaurant", result.body);
    fixture = {
      restaurantId: result.body.restaurant_id,
      branchId: result.body.branch_id,
      qrLinkId: result.body.qr_link_id,
      qrUrl: result.body.qr_url,
      qrToken: tokenFromUrl(result.body.qr_url),
    };
    created.restaurants.push(fixture.restaurantId);
    created.branches.push(fixture.branchId);
    created.qrLinks.push(fixture.qrLinkId);
  });

  await runGetPublicSurveyConfigChecks();
  await runSubmitFeedbackChecks();
  await runCreateRestaurantChecks();
  await runCreateRestaurantAdminChecks();
  await runCreateManagerUserChecks();
  await runRegenerateQrTokenChecks();
  await runRegenerateDeviceTokenChecks();
  await runPlatformSummaryChecks();
  await runUpdateRestaurantAccountChecks();
  await runUpdateAlertStatusChecks();
  await runExportFeedbackCsvChecks();

  printSummary();

  if (results.some((result) => result.status === "FAIL")) {
    process.exitCode = 1;
  }
}

async function runGetPublicSurveyConfigChecks() {
  await step("get_public_survey_config", "rejects missing token with controlled error", async () => {
    const result = await invoke("get_public_survey_config", { body: {} });
    assertStatus(result, 400);
    assertControlledError(result.body);
    assertNoSensitiveKeys("get_public_survey_config", result.body);
  });

  await step("get_public_survey_config", "rejects invalid token with controlled error", async () => {
    const result = await invoke("get_public_survey_config", { body: { token: "invalid-token" } });
    assertStatus(result, 404);
    assertControlledError(result.body);
    assertNoSensitiveKeys("get_public_survey_config", result.body);
  });

  await step("get_public_survey_config", "loads public QR config without user session", async () => {
    const result = await invoke("get_public_survey_config", { body: { token: fixture.qrToken } });
    assertStatus(result, 200);
    assert(result.body.restaurant_name && result.body.branch_name, "public config missing public names");
    assert(result.body.source === "qr", "public QR source mismatch");
    assertNoSensitiveKeys("get_public_survey_config", result.body);
    for (const internalKey of ["restaurant_id", "branch_id", "account_status", "plan_code", "users"]) {
      assert(!(internalKey in result.body), `public config exposes ${internalKey}`);
    }
  });
}

async function runSubmitFeedbackChecks() {
  await step("submit_feedback", "rejects invalid token with controlled error", async () => {
    const result = await invoke("submit_feedback", { body: validFeedback("invalid-token", "qr") });
    assertStatus(result, 404);
    assertControlledError(result.body);
    assertNoSensitiveKeys("submit_feedback", result.body);
  });

  await step("submit_feedback", "rejects score outside 1..5", async () => {
    const result = await invoke("submit_feedback", {
      body: { ...validFeedback(fixture.qrToken, "qr"), general_experience: 6 },
    });
    assertStatus(result, 400);
    assertControlledError(result.body);
    assertNoSensitiveKeys("submit_feedback", result.body);
  });

  await step("submit_feedback", "rejects phone without consent", async () => {
    const result = await invoke("submit_feedback", {
      body: { ...validFeedback(fixture.qrToken, "qr"), customer_phone: "+52 55 1000 1000", consent_to_contact: false },
    });
    assertStatus(result, 400);
    assertControlledError(result.body);
    assertNoSensitiveKeys("submit_feedback", result.body);
  });

  await step("submit_feedback", "rejects long comment", async () => {
    const result = await invoke("submit_feedback", {
      body: { ...validFeedback(fixture.qrToken, "qr"), comment: "x".repeat(1001) },
    });
    assertStatus(result, 400);
    assertControlledError(result.body);
    assertNoSensitiveKeys("submit_feedback", result.body);
  });

  await step("submit_feedback", "rejects source mismatch with generic invalid payload", async () => {
    const result = await invoke("submit_feedback", {
      body: { ...validFeedback(fixture.qrToken, "device"), comment: "QA T063 source mismatch" },
    });
    assertErrorCode(result, 400, "invalid_payload");
    assertNoSensitiveKeys("submit_feedback", result.body);
  });

  await step("submit_feedback", "accepts valid QR feedback and returns minimal response", async () => {
    const result = await invoke("submit_feedback", { body: validFeedback(fixture.qrToken, "qr") });
    assertStatus(result, 200);
    assert(result.body.ok === true, "valid QR feedback did not return ok");
    assertNoSensitiveKeys("submit_feedback", result.body);
    if (result.body.response_id) created.responses.push(result.body.response_id);
  });

  await step("submit_feedback", "creates alert when general_experience <= 3", async () => {
    const result = await invoke("submit_feedback", {
      body: { ...validFeedback(fixture.qrToken, "qr"), general_experience: 3 },
    });
    assertStatus(result, 200);
    assert(result.body.has_alert === true, "low score did not report has_alert");
    if (result.body.response_id) created.responses.push(result.body.response_id);
  });

  await step("submit_feedback", "rate limits QR submissions for same public token", async () => {
    let limited = false;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const result = await invoke("submit_feedback", {
        body: { ...validFeedback(fixture.qrToken, "qr"), comment: `QA T057 rate ${attempt}` },
      });
      if (result.status === 429) {
        limited = true;
        assertControlledError(result.body);
        break;
      }
      if (result.body?.response_id) created.responses.push(result.body.response_id);
    }
    assert(limited, "QR rate limit was not reached after repeated submissions");
  });
}

async function runCreateRestaurantChecks() {
  await step("create_restaurant", "non-platform user is forbidden", async () => {
    const result = await invoke("create_restaurant", {
      token: sessions.admin.access_token,
      body: {
        restaurant_name: `QA T057 Forbidden ${Date.now()}`,
        plan_code: "demo",
        account_status: "demo",
        branch_name: "QA Forbidden",
      },
    });
    assertErrorCode(result, 403, "forbidden");
  });

  await step("create_restaurant", "invalid payload is rejected", async () => {
    const result = await invoke("create_restaurant", {
      token: sessions.platform.access_token,
      body: { restaurant_name: "x" },
    });
    assertErrorCode(result, 400, "invalid_payload");
  });
}

async function runCreateRestaurantAdminChecks() {
  await step("create_restaurant_admin", "invalid payload is rejected", async () => {
    const result = await invoke("create_restaurant_admin", {
      token: sessions.platform.access_token,
      body: { restaurant_id: "bad", full_name: "x", email: "bad" },
    });
    assertErrorCode(result, 400, "invalid_payload");
  });

  await step("create_restaurant_admin", "non-platform user is forbidden", async () => {
    const result = await invoke("create_restaurant_admin", {
      token: sessions.admin.access_token,
      body: { restaurant_id: fixture.restaurantId, full_name: "QA Admin", email: `qa-t057-${Date.now()}@example.com` },
    });
    assertErrorCode(result, 403, "forbidden");
  });
}

async function runCreateManagerUserChecks() {
  await step("create_manager_user", "invalid payload is rejected", async () => {
    const result = await invoke("create_manager_user", {
      token: sessions.admin.access_token,
      body: { full_name: "x", email: "bad", branch_ids: [] },
    });
    assertErrorCode(result, 400, "invalid_payload");
  });

  await step("create_manager_user", "manager cannot create managers", async () => {
    if (!sessions.manager) skip("manager credentials not configured");
    const branchIds = await visibleAdminBranchIds();
    if (branchIds.length === 0) skip("no branch visible to restaurant_admin");
    const result = await invoke("create_manager_user", {
      token: sessions.manager.access_token,
      body: { full_name: "QA T057 Manager Forbidden", email: `qa-t057-manager-forbidden-${Date.now()}@example.com`, branch_ids: [branchIds[0]] },
    });
    assertErrorCode(result, 403, "forbidden");
  });

  await step("create_manager_user", "restaurant_admin creates isolated manager with branch assignments", async () => {
    const branchIds = await visibleAdminBranchIds();
    if (branchIds.length === 0) skip("no branch visible to restaurant_admin");
    const email = `qa-t057-manager-${Date.now()}@example.com`;
    const result = await invoke("create_manager_user", {
      token: sessions.admin.access_token,
      body: { full_name: "QA T057 Manager", email, branch_ids: [branchIds[0]] },
    });
    assertStatus(result, 200);
    assert(result.body.ok === true && result.body.user_id && result.body.email === email, "manager create response mismatch");
    assertNoSensitiveKeys("create_manager_user", result.body);
    created.managers.push(result.body.user_id);
  });
}

async function runRegenerateQrTokenChecks() {
  await step("regenerate_qr_token", "rejects invalid and ambiguous payloads", async () => {
    const invalid = await invoke("regenerate_qr_token", {
      token: sessions.platform.access_token,
      body: { branch_id: "bad" },
    });
    assertErrorCode(invalid, 400, "invalid_payload");
    const ambiguous = await invoke("regenerate_qr_token", {
      token: sessions.platform.access_token,
      body: { branch_id: fixture.branchId, survey_link_id: fixture.qrLinkId },
    });
    assertErrorCode(ambiguous, 400, "invalid_payload");
  });

  await step("regenerate_qr_token", "manager is blocked", async () => {
    if (!sessions.manager) skip("manager credentials not configured");
    const result = await invoke("regenerate_qr_token", {
      token: sessions.manager.access_token,
      body: { branch_id: fixture.branchId },
    });
    assertErrorCode(result, 403, "forbidden");
  });

  await step("regenerate_qr_token", "new QR token works and previous token stops working", async () => {
    const previousToken = fixture.qrToken;
    const result = await invoke("regenerate_qr_token", {
      token: sessions.platform.access_token,
      body: { survey_link_id: fixture.qrLinkId },
    });
    assertStatus(result, 200);
    assert(result.body.ok === true && result.body.url && result.body.token_last4, "regenerate QR response mismatch");
    assertNoSensitiveKeys("regenerate_qr_token", result.body);
    const nextToken = tokenFromUrl(result.body.url);
    const previous = await invoke("get_public_survey_config", { body: { token: previousToken } });
    assertStatus(previous, 404);
    const next = await invoke("get_public_survey_config", { body: { token: nextToken } });
    assertStatus(next, 200);
    fixture.qrToken = nextToken;
    fixture.qrUrl = result.body.url;
  });
}

async function runRegenerateDeviceTokenChecks() {
  await step("regenerate_device_token", "rejects invalid payload", async () => {
    const result = await invoke("regenerate_device_token", {
      token: sessions.platform.access_token,
      body: { device_id: "bad" },
    });
    assertErrorCode(result, 400, "invalid_payload");
  });

  await step("regenerate_device_token", "manager is blocked for a visible device when available", async () => {
    if (!sessions.manager) skip("manager credentials not configured");
    const device = await findVisibleDevice();
    if (!device) skip("no active device visible to restaurant_admin");
    const result = await invoke("regenerate_device_token", {
      token: sessions.manager.access_token,
      body: { device_id: device.id },
    });
    assertErrorCode(result, 403, "forbidden");
  });

  await step("regenerate_device_token", "regenerates existing visible device when available", async () => {
    const device = await findVisibleDevice();
    if (!device) skip("no active device visible to restaurant_admin");
    const result = await invoke("regenerate_device_token", {
      token: sessions.admin.access_token,
      body: { device_id: device.id },
    });
    assertStatus(result, 200);
    assert(result.body.ok === true && result.body.url && result.body.token_last4, "regenerate device response mismatch");
    assertNoSensitiveKeys("regenerate_device_token", result.body);
    const token = tokenFromUrl(result.body.url);
    const config = await invoke("get_public_survey_config", { body: { token } });
    assertStatus(config, 200);
    assert(config.body.source === "device", "device token did not load device survey config");
  });
}

async function runPlatformSummaryChecks() {
  await step("get_platform_activity_summary", "non-platform user is forbidden", async () => {
    const result = await invoke("get_platform_activity_summary", {
      token: sessions.admin.access_token,
      body: {},
    });
    assertErrorCode(result, 403, "forbidden");
  });

  await step("get_platform_activity_summary", "platform response contains only aggregates", async () => {
    const result = await invoke("get_platform_activity_summary", {
      token: sessions.platform.access_token,
      body: {},
    });
    assertStatus(result, 200);
    assert(Array.isArray(result.body.items), "summary items missing");
    assertNoSensitiveKeys("get_platform_activity_summary", result.body);
  });
}

async function runUpdateRestaurantAccountChecks() {
  await step("update_restaurant_account", "non-platform user is forbidden", async () => {
    const result = await invoke("update_restaurant_account", {
      token: sessions.admin.access_token,
      body: { restaurant_id: fixture.restaurantId, plan_code: "pro", account_status: "active" },
    });
    assertErrorCode(result, 403, "forbidden");
  });

  await step("update_restaurant_account", "platform updates manual plan/status with minimal response", async () => {
    const result = await invoke("update_restaurant_account", {
      token: sessions.platform.access_token,
      body: { restaurant_id: fixture.restaurantId, plan_code: "pro", account_status: "active" },
    });
    assertStatus(result, 200);
    assert(result.body.ok === true && result.body.plan_code === "pro" && result.body.account_status === "active", "account update response mismatch");
    assertNoSensitiveKeys("update_restaurant_account", result.body);
  });
}

async function runUpdateAlertStatusChecks() {
  await step("update_alert_status", "invalid payload is rejected", async () => {
    const result = await invoke("update_alert_status", {
      token: sessions.admin.access_token,
      body: { alert_id: "bad", status: "attended" },
    });
    assertStatus(result, 400);
    assertNoSensitiveKeys("update_alert_status", result.body);
  });

  await step("update_alert_status", "manager forbidden fixture is unchanged when configured", async () => {
    if (!sessions.manager) skip("manager credentials not configured");
    if (!env.forbiddenAlertId) skip("QA_FORBIDDEN_ALERT_ID not configured");
    const before = await readAlertStatus(env.forbiddenAlertId);
    const result = await invoke("update_alert_status", {
      token: sessions.manager.access_token,
      body: { alert_id: env.forbiddenAlertId, status: "attended", internal_note: "QA T057 forbidden" },
    });
    assertStatus(result, 404);
    const after = await readAlertStatus(env.forbiddenAlertId);
    assert(before === after, "manager forbidden alert status changed");
  });

  await step("update_alert_status", "admin attends configured pending alert when available", async () => {
    if (!env.allowedAlertId) skip("QA_ALLOWED_ALERT_ID not configured");
    const before = await readAlertStatus(env.allowedAlertId);
    if (before !== "pending") skip(`QA_ALLOWED_ALERT_ID is not pending (current: ${before ?? "not visible"})`);
    const result = await invoke("update_alert_status", {
      token: sessions.admin.access_token,
      body: { alert_id: env.allowedAlertId, status: "attended", internal_note: "QA T057 allowed" },
    });
    assertStatus(result, 200);
    assert(result.body.ok === true && result.body.status === "attended", "alert update response mismatch");
    assertNoSensitiveKeys("update_alert_status", result.body);
  });
}

async function runExportFeedbackCsvChecks() {
  await step("export_feedback_csv", "invalid payload is rejected", async () => {
    const result = await invoke("export_feedback_csv", {
      token: sessions.admin.access_token,
      body: { date_from: "bad", date_to: "bad" },
    });
    assertStatus(result, 400);
    assertNoSensitiveKeys("export_feedback_csv", result.body);
  });

  await step("export_feedback_csv", "platform_admin is blocked by default", async () => {
    const result = await invoke("export_feedback_csv", {
      token: sessions.platform.access_token,
      body: todayRange(),
    });
    assertStatus(result, 404);
    assertNoSensitiveKeys("export_feedback_csv", result.body);
  });

  await step("export_feedback_csv", "restaurant_admin exports scoped CSV", async () => {
    const result = await invoke("export_feedback_csv", {
      token: sessions.admin.access_token,
      body: todayRange(),
    });
    assertStatus(result, 200);
    assert(result.body.ok === true && typeof result.body.content === "string", "CSV export response mismatch");
    assert(result.body.content.startsWith("fecha,restaurante,sucursal"), "CSV header mismatch");
    assertNoSensitiveKeys("export_feedback_csv", { ...result.body, content: undefined });
  });
}

async function step(functionName, name, run) {
  try {
    await run();
    recordPass(functionName, name);
  } catch (error) {
    if (error instanceof SkipError) {
      recordSkipped(functionName, name, error.message);
      return;
    }
    recordFail(functionName, name, error.message);
  }
}

async function login(email, password, label) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Could not sign in ${label}: ${email}`);
  }
  return data.session;
}

async function invoke(functionName, { method = "POST", token = null, body = undefined } = {}) {
  const headers = { apikey: env.anonKey };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${env.url}/functions/v1/${functionName}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let responseBody = null;
  const text = await response.text();
  if (text) {
    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = text;
    }
  }
  return { status: response.status, body: responseBody };
}

function validFeedback(token, source) {
  return {
    token,
    source,
    general_experience: 5,
    service_attention: 5,
    food_quality: 5,
    service_speed: 5,
    comment: null,
    customer_phone: null,
    consent_to_contact: false,
  };
}

async function visibleAdminBranchIds() {
  await client.auth.setSession({ access_token: sessions.admin.access_token, refresh_token: sessions.admin.refresh_token });
  const { data, error } = await client.from("branches").select("id").eq("status", "active").order("created_at");
  if (error) throw new Error("Could not load visible admin branches");
  return (data ?? []).map((branch) => branch.id);
}

async function findVisibleDevice() {
  await client.auth.setSession({ access_token: sessions.admin.access_token, refresh_token: sessions.admin.refresh_token });
  const { data, error } = await client
    .from("devices")
    .select("id,status")
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Could not load visible device");
  return data ?? null;
}

async function readAlertStatus(alertId) {
  await client.auth.setSession({ access_token: sessions.admin.access_token, refresh_token: sessions.admin.refresh_token });
  const { data, error } = await client.from("feedback_alerts").select("id,status").eq("id", alertId).maybeSingle();
  if (error) throw new Error(`Could not read alert ${alertId}`);
  return data?.status ?? null;
}

function todayRange() {
  const today = new Date().toISOString().slice(0, 10);
  return { date_from: today, date_to: today };
}

function noJwtPayload(functionName) {
  const id = randomUUID();
  const payloads = {
    create_restaurant: {
      restaurant_name: `QA T057 No JWT ${Date.now()}`,
      plan_code: "demo",
      account_status: "demo",
      branch_name: "QA T057 No JWT",
    },
    create_restaurant_admin: {
      restaurant_id: id,
      full_name: "QA T057 No JWT",
      email: `qa-t057-no-jwt-${Date.now()}@example.com`,
    },
    get_platform_activity_summary: {},
    update_restaurant_account: {
      restaurant_id: id,
      plan_code: "demo",
      account_status: "demo",
    },
    create_manager_user: {
      full_name: "QA T057 No JWT",
      email: `qa-t057-manager-no-jwt-${Date.now()}@example.com`,
      branch_ids: [id],
    },
    regenerate_qr_token: { branch_id: id },
    regenerate_device_token: { device_id: id },
    update_alert_status: { alert_id: id, status: "attended" },
    export_feedback_csv: todayRange(),
  };
  return payloads[functionName] ?? {};
}

function tokenFromUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  const parts = parsed.pathname.split("/").filter(Boolean);
  return decodeURIComponent(parts.at(-1) ?? "");
}

function assertStatus(result, status) {
  assert(result.status === status, `expected status ${status}, got ${result.status}: ${JSON.stringify(result.body)}`);
}

function assertErrorCode(result, status, code) {
  assertStatus(result, status);
  const actual = typeof result.body?.error === "string" ? result.body.error : result.body?.error?.code;
  assert(actual === code, `expected error ${code}, got ${actual ?? JSON.stringify(result.body)}`);
  assertNoTechnicalLeak("error", result.body);
}

function assertOk(result, label) {
  assertStatus(result, 200);
  assert(result.body?.ok === true, `${label} did not return ok`);
}

function assertControlledError(body) {
  assert(body && typeof body === "object" && "error" in body, `missing controlled error body: ${JSON.stringify(body)}`);
  assertAllowedErrorCode("error", body);
  assertNoTechnicalLeak("error", body);
}

function assertAllowedErrorCode(functionName, body) {
  const code = typeof body?.error === "string" ? body.error : body?.error?.code;
  assert(ALLOWED_ERROR_CODES.has(code), `${functionName} returned uncontrolled error code ${code ?? JSON.stringify(body)}`);
}

function assertNoSensitiveKeys(functionName, value) {
  const allowed = ALLOWED_SENSITIVE_KEYS_BY_FUNCTION[functionName] ?? new Set();
  const offenders = [];
  collectSensitiveKeys(value, allowed, offenders);
  assert(offenders.length === 0, `${functionName} exposed sensitive keys: ${offenders.join(", ")}`);
}

function collectSensitiveKeys(value, allowed, offenders, path = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectSensitiveKeys(item, allowed, offenders, `${path}[${index}]`));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key;
    if (SENSITIVE_KEYS.has(key) && !allowed.has(key)) offenders.push(nextPath);
    collectSensitiveKeys(nested, allowed, offenders, nextPath);
  }
}

function assertNoTechnicalLeak(functionName, body) {
  const serialized = typeof body === "string" ? body : JSON.stringify(body ?? "");
  for (const pattern of TECHNICAL_LEAK_PATTERNS) {
    assert(!pattern.test(serialized), `${functionName} leaked technical marker ${pattern.source}`);
  }
}

function recordPass(functionName, name) {
  results.push({ status: "PASS", functionName, name });
  console.log(`PASS ${functionName} - ${name}`);
}

function recordFail(functionName, name, message) {
  results.push({ status: "FAIL", functionName, name, message });
  console.error(`FAIL ${functionName} - ${name}: ${message}`);
}

function recordSkipped(functionName, name, reason) {
  results.push({ status: "SKIPPED", functionName, name, reason });
  console.log(`SKIPPED ${functionName} - ${name}: ${reason}`);
}

function printSummary() {
  const counts = results.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log("\nT-057 Edge Functions privacy checklist summary");
  console.log(`PASS: ${counts.PASS ?? 0}`);
  console.log(`FAIL: ${counts.FAIL ?? 0}`);
  console.log(`SKIPPED: ${counts.SKIPPED ?? 0}`);
  console.log(`Created restaurants: ${created.restaurants.join(", ") || "none"}`);
  console.log(`Created branches: ${created.branches.join(", ") || "none"}`);
  console.log(`Created QR links: ${created.qrLinks.join(", ") || "none"}`);
  console.log(`Created managers: ${created.managers.join(", ") || "none"}`);
  console.log(`Created responses: ${created.responses.join(", ") || "none"}`);
  if (results.some((result) => result.status === "FAIL")) {
    console.log("\nFailures:");
    for (const result of results.filter((item) => item.status === "FAIL")) {
      console.log(`- ${result.functionName}: ${result.name}: ${result.message}`);
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function skip(reason) {
  throw new SkipError(reason);
}

function required(name) {
  const result = process.env[name]?.trim();
  if (!result) throw new Error(`Missing ${name}`);
  return result;
}

function optional(name) {
  return process.env[name]?.trim() || null;
}

function value(primary, fallback) {
  return optional(primary) || required(fallback);
}

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (match && process.env[match[1].trim()] === undefined) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}
