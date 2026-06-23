import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

loadEnv(".env"); loadEnv(".env.local");
const url = required("NEXT_PUBLIC_SUPABASE_URL"), key = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const platformEmail = value("QA_PLATFORM_ADMIN_EMAIL", "DEMO_PLATFORM_ADMIN_EMAIL"), platformPassword = value("QA_PLATFORM_ADMIN_PASSWORD", "DEMO_PLATFORM_ADMIN_PASSWORD");
const otherEmail = value("QA_ADMIN_EMAIL", "DEMO_RESTAURANT_ADMIN_EMAIL"), otherPassword = value("QA_ADMIN_PASSWORD", "DEMO_RESTAURANT_ADMIN_PASSWORD");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const noJwt = await invoke(null, {});
assertError(noJwt, 401, "unauthorized");
const platform = await login(platformEmail, platformPassword);
const invalid = await invoke(platform.access_token, { restaurant_id: "bad", plan_code: "pro", account_status: "active" });
assertError(invalid, 400, "invalid_payload");
const missing = await invoke(platform.access_token, { restaurant_id: randomUUID(), plan_code: "pro", account_status: "active" });
assertError(missing, 404, "restaurant_not_found");
await client.auth.signOut();
const other = await login(otherEmail, otherPassword);
const forbidden = await invoke(other.access_token, { restaurant_id: randomUUID(), plan_code: "pro", account_status: "active" });
assertError(forbidden, 403, "forbidden");

await client.auth.signOut();
const admin = await login(platformEmail, platformPassword);
const restaurantId = await createRestaurant(admin.access_token, `QA Account Restaurant ${Date.now()}`);
const updated = await invoke(admin.access_token, { restaurant_id: restaurantId, plan_code: "pro", account_status: "active" });
assert(updated.status === 200 && updated.body?.ok === true && updated.body.plan_code === "pro" && updated.body.account_status === "active" && updated.body.started_at, `update fallo: ${updated.status} ${JSON.stringify(updated.body)}`);
const cancelled = await invoke(admin.access_token, { restaurant_id: restaurantId, plan_code: "custom", account_status: "cancelled" });
assert(cancelled.status === 200 && cancelled.body?.cancelled_at, "cancelled_at no se seteo");
const reactivated = await invoke(admin.access_token, { restaurant_id: restaurantId, plan_code: "basico", account_status: "pilot" });
assert(reactivated.status === 200 && reactivated.body?.cancelled_at === null, "cancelled_at no se limpio");
console.log("QA update_restaurant_account completed: auth, payload, rol, update y fechas OK.");

async function createRestaurant(token, name) { const response = await fetch(`${url}/functions/v1/create_restaurant`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", apikey: key }, body: JSON.stringify({ restaurant_name: name, plan_code: "demo", account_status: "demo", branch_name: "Sucursal QA", create_initial_qr: false }) }); const body = await response.json(); assert(response.status === 200 && body?.restaurant_id, `no se pudo crear restaurante QA: ${response.status} ${JSON.stringify(body)}`); return body.restaurant_id; }
async function login(email, password) { const { data, error } = await client.auth.signInWithPassword({ email, password }); if (error || !data.session) throw new Error(`No se pudo iniciar sesion: ${email}`); return data.session; }
async function invoke(token, body) { const response = await fetch(`${url}/functions/v1/update_restaurant_account`, { method: "POST", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json", apikey: key }, body: JSON.stringify(body) }); let responseBody = null; try { responseBody = await response.json(); } catch {} return { status: response.status, body: responseBody }; }
function assertError(result, status, code) { assert(result.status === status && result.body?.error?.code === code, `${code}: esperado ${status}, recibido ${result.status} ${JSON.stringify(result.body)}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function required(name) { const result = process.env[name]?.trim(); if (!result) throw new Error(`Falta ${name}`); return result; }
function value(primary, fallback) { return process.env[primary]?.trim() || required(fallback); }
function loadEnv(path) { if (!existsSync(path)) return; for (const line of readFileSync(path, "utf8").split(/\r?\n/)) { const match = line.match(/^\s*([^#=]+)=(.*)$/); if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, ""); } }
