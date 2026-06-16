import { existsSync, readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "QA_ALLOWED_ALERT_ID",
  "QA_FORBIDDEN_ALERT_ID",
];

loadEnvFile(".env");
loadEnvFile(".env.local");

let env;
let supabase;

async function main() {
  env = readEnv();
  supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  validateDistinctAlertIds();

  const admin = await signIn({
    email: env.QA_ADMIN_EMAIL,
    password: env.QA_ADMIN_PASSWORD,
    label: "admin",
  });

  const allowedBefore = await getVisibleAlertStatus(env.QA_ALLOWED_ALERT_ID, "allowed alert before admin update");

  if (allowedBefore !== "pending") {
    throw new Error(
      `QA_ALLOWED_ALERT_ID must point to a pending alert. Current visible status: ${allowedBefore ?? "not_visible"}.`,
    );
  }

  const adminResult = await invokeUpdateAlertStatus({
    accessToken: admin.session.access_token,
    body: {
      alert_id: env.QA_ALLOWED_ALERT_ID,
      status: "attended",
      internal_note: "QA T-013 admin",
    },
  });

  assertFunctionOk(adminResult, env.QA_ALLOWED_ALERT_ID, "admin allowed update");

  const allowedAfter = await getVisibleAlertStatus(env.QA_ALLOWED_ALERT_ID, "allowed alert after admin update");

  if (allowedAfter !== "attended") {
    throw new Error(`Admin update did not persist attended status. Current status: ${allowedAfter ?? "not_visible"}.`);
  }

  const forbiddenBefore = await getVisibleAlertStatus(
    env.QA_FORBIDDEN_ALERT_ID,
    "forbidden alert before manager update",
  );

  if (!forbiddenBefore) {
    throw new Error("QA_FORBIDDEN_ALERT_ID is not visible to admin. Choose a safe demo alert in the same restaurant.");
  }

  await signOut();

  const manager = await signIn({
    email: env.QA_MANAGER_EMAIL,
    password: env.QA_MANAGER_PASSWORD,
    label: "manager",
  });

  const managerForbiddenResult = await invokeUpdateAlertStatus({
    accessToken: manager.session.access_token,
    body: {
      alert_id: env.QA_FORBIDDEN_ALERT_ID,
      status: "attended",
      internal_note: "QA T-013 manager forbidden",
    },
  });

  assertFunctionError(managerForbiddenResult, 404, "not_found_or_forbidden", "manager forbidden update");

  const invalidPayloadResult = await invokeUpdateAlertStatus({
    accessToken: manager.session.access_token,
    body: {
      alert_id: "bad-id",
      status: "attended",
    },
  });

  assertFunctionError(invalidPayloadResult, 400, "invalid_payload", "invalid payload");

  const invalidStatusResult = await invokeUpdateAlertStatus({
    accessToken: manager.session.access_token,
    body: {
      alert_id: env.QA_FORBIDDEN_ALERT_ID,
      status: "pending",
    },
  });

  assertFunctionError(invalidStatusResult, 400, "invalid_payload", "invalid status");

  await signOut();

  await signIn({
    email: env.QA_ADMIN_EMAIL,
    password: env.QA_ADMIN_PASSWORD,
    label: "admin status verification",
  });

  const forbiddenAfter = await getVisibleAlertStatus(
    env.QA_FORBIDDEN_ALERT_ID,
    "forbidden alert after manager update",
  );

  if (forbiddenAfter !== forbiddenBefore) {
    throw new Error(
      `Manager forbidden update changed alert status from ${forbiddenBefore} to ${forbiddenAfter ?? "not_visible"}.`,
    );
  }

  console.log("QA update_alert_status completed.");
  console.log(`- admin allowed alert: ${env.QA_ALLOWED_ALERT_ID} -> attended`);
  console.log(`- manager forbidden alert: ${env.QA_FORBIDDEN_ALERT_ID} -> unchanged (${forbiddenAfter})`);
  console.log("- invalid payload: 400 invalid_payload");
  console.log("- invalid status: 400 invalid_payload");
}

async function signIn({ email, password, label }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    throw new Error(`Could not sign in ${label}. Check QA credentials.`);
  }

  console.log(`Signed in ${label}: ${email}`);
  return data;
}

async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("Could not sign out QA user.");
  }
}

async function invokeUpdateAlertStatus({ accessToken, body }) {
  const { data, error } = await supabase.functions.invoke("update_alert_status", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body,
  });

  const errorBody = await readFunctionErrorBody(error);

  return {
    data: data ?? errorBody,
    error,
    status: error?.context?.status ?? 200,
  };
}

async function readFunctionErrorBody(error) {
  if (!error?.context || typeof error.context.json !== "function") {
    return null;
  }

  try {
    return await error.context.json();
  } catch {
    return null;
  }
}

async function getVisibleAlertStatus(alertId, label) {
  const { data, error } = await supabase
    .from("feedback_alerts")
    .select("id, status")
    .eq("id", alertId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not read ${label}.`);
  }

  return data?.status ?? null;
}

function assertFunctionOk(result, alertId, label) {
  if (result.error) {
    throw new Error(`${label} failed with status ${result.status}.`);
  }

  if (result.data?.ok !== true || result.data?.alert_id !== alertId || result.data?.status !== "attended") {
    throw new Error(`${label} returned an unexpected response.`);
  }

  console.log(`${label}: ok`);
}

function assertFunctionError(result, expectedStatus, expectedCode, label) {
  if (result.status !== expectedStatus || result.data?.error !== expectedCode) {
    throw new Error(`${label} expected ${expectedStatus} ${expectedCode}, got ${result.status}.`);
  }

  console.log(`${label}: ${expectedStatus} ${expectedCode}`);
}

function validateDistinctAlertIds() {
  if (env.QA_ALLOWED_ALERT_ID === env.QA_FORBIDDEN_ALERT_ID) {
    throw new Error("QA_ALLOWED_ALERT_ID and QA_FORBIDDEN_ALERT_ID must be different alerts.");
  }
}

function readEnv() {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());

  const adminEmail = process.env.QA_ADMIN_EMAIL?.trim() || process.env.DEMO_RESTAURANT_ADMIN_EMAIL?.trim();
  const adminPassword = process.env.QA_ADMIN_PASSWORD?.trim() || process.env.DEMO_RESTAURANT_ADMIN_PASSWORD?.trim();
  const managerEmail = process.env.QA_MANAGER_EMAIL?.trim() || process.env.DEMO_MANAGER_EMAIL?.trim();
  const managerPassword = process.env.QA_MANAGER_PASSWORD?.trim() || process.env.DEMO_MANAGER_PASSWORD?.trim();

  if (!adminEmail) missing.push("QA_ADMIN_EMAIL or DEMO_RESTAURANT_ADMIN_EMAIL");
  if (!adminPassword) missing.push("QA_ADMIN_PASSWORD or DEMO_RESTAURANT_ADMIN_PASSWORD");
  if (!managerEmail) missing.push("QA_MANAGER_EMAIL or DEMO_MANAGER_EMAIL");
  if (!managerPassword) missing.push("QA_MANAGER_PASSWORD or DEMO_MANAGER_PASSWORD");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL.trim(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim(),
    QA_ADMIN_EMAIL: adminEmail,
    QA_ADMIN_PASSWORD: adminPassword,
    QA_MANAGER_EMAIL: managerEmail,
    QA_MANAGER_PASSWORD: managerPassword,
    QA_ALLOWED_ALERT_ID: process.env.QA_ALLOWED_ALERT_ID.trim(),
    QA_FORBIDDEN_ALERT_ID: process.env.QA_FORBIDDEN_ALERT_ID.trim(),
  };
}

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  const contents = readFileSync(path, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
