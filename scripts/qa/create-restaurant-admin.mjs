import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

loadEnv(".env"); loadEnv(".env.local");
const url = required("NEXT_PUBLIC_SUPABASE_URL"), key = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const platformEmail = value("QA_PLATFORM_ADMIN_EMAIL", "DEMO_PLATFORM_ADMIN_EMAIL"), platformPassword = value("QA_PLATFORM_ADMIN_PASSWORD", "DEMO_PLATFORM_ADMIN_PASSWORD");
const otherEmail = value("QA_ADMIN_EMAIL", "DEMO_RESTAURANT_ADMIN_EMAIL"), otherPassword = value("QA_ADMIN_PASSWORD", "DEMO_RESTAURANT_ADMIN_PASSWORD");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const noJwt = await invoke(null, {}); assertError(noJwt, 401, "unauthorized");
const platform = await login(platformEmail, platformPassword);
const invalid = await invoke(platform.access_token, { restaurant_id: "bad", full_name: "x", email: "bad" }); assertError(invalid, 400, "invalid_payload");
const missing = await invoke(platform.access_token, { restaurant_id: randomUUID(), full_name: "QA Admin", email: `missing-${Date.now()}@example.com` }); assertError(missing, 404, "restaurant_not_found");
await client.auth.signOut();
const other = await login(otherEmail, otherPassword);
const forbidden = await invoke(other.access_token, { restaurant_id: randomUUID(), full_name: "QA Admin", email: `forbidden-${Date.now()}@example.com` }); assertError(forbidden, 403, "forbidden");

await client.auth.signOut();
const admin = await login(platformEmail, platformPassword);
const stamp = Date.now();
const restaurantId = await createRestaurant(admin.access_token, `QA Admin Restaurant ${stamp}`);
const email = `QA-RESTAURANT-ADMIN-${stamp}@EXAMPLE.COM`;
const created = await invoke(admin.access_token, { restaurant_id: restaurantId, full_name: "QA Restaurant Admin", email });
assert(created.status === 200 && created.body?.ok && created.body.created, `creacion inicial fallo: ${created.status} ${JSON.stringify(created.body)}`);
assert(created.body.email === email.toLowerCase() && created.body.restaurant_id === restaurantId, "respuesta normalizada incorrecta");
const { data: profile, error: profileError } = await client.from("user_profiles").select("role,restaurant_id,email,status").eq("id", created.body.user_id).single();
assert(!profileError && profile?.role === "restaurant_admin" && profile.restaurant_id === restaurantId && profile.email === email.toLowerCase(), "perfil restaurant_admin incorrecto");

const repeated = await invoke(admin.access_token, { restaurant_id: restaurantId, full_name: "QA Restaurant Admin", email });
assert(repeated.status === 200 && repeated.body?.user_id === created.body.user_id && repeated.body.created === false, "idempotencia fallo");
const second = await invoke(admin.access_token, { restaurant_id: restaurantId, full_name: "Segundo Admin", email: `second-${stamp}@example.com` });
assertError(second, 409, "admin_exists");

const conflictRestaurantId = await createRestaurant(admin.access_token, `QA Conflict Restaurant ${stamp}`);
const conflict = await invoke(admin.access_token, { restaurant_id: conflictRestaurantId, full_name: "Conflicto", email: otherEmail });
assertError(conflict, 409, "email_conflict");
console.log("QA create_restaurant_admin completed: auth, payload, rol, restaurante, creacion, perfil, idempotencia y conflictos OK.");

async function createRestaurant(token, name) { const response = await fetch(`${url}/functions/v1/create_restaurant`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", apikey: key }, body: JSON.stringify({ restaurant_name: name, plan_code: "demo", account_status: "demo", branch_name: "Sucursal QA", create_initial_qr: false }) }); const body = await response.json(); assert(response.status === 200 && body?.restaurant_id, `no se pudo crear restaurante QA: ${response.status} ${JSON.stringify(body)}`); return body.restaurant_id; }
async function login(email, password) { const { data, error } = await client.auth.signInWithPassword({ email, password }); if (error || !data.session) throw new Error(`No se pudo iniciar sesion: ${email}`); return data.session; }
async function invoke(token, body) { const response = await fetch(`${url}/functions/v1/create_restaurant_admin`, { method: "POST", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json", apikey: key }, body: JSON.stringify(body) }); let responseBody = null; try { responseBody = await response.json(); } catch {} return { status: response.status, body: responseBody }; }
function assertError(result, status, code) { assert(result.status === status && result.body?.error?.code === code, `${code}: esperado ${status}, recibido ${result.status} ${JSON.stringify(result.body)}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function required(name) { const result = process.env[name]?.trim(); if (!result) throw new Error(`Falta ${name}`); return result; }
function value(primary, fallback) { return process.env[primary]?.trim() || required(fallback); }
function loadEnv(path) { if (!existsSync(path)) return; for (const line of readFileSync(path, "utf8").split(/\r?\n/)) { const match = line.match(/^\s*([^#=]+)=(.*)$/); if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, ""); } }
