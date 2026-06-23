import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

loadEnv(".env"); loadEnv(".env.local");
const url = required("NEXT_PUBLIC_SUPABASE_URL"), key = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const platformEmail = value("QA_PLATFORM_ADMIN_EMAIL", "DEMO_PLATFORM_ADMIN_EMAIL"), platformPassword = value("QA_PLATFORM_ADMIN_PASSWORD", "DEMO_PLATFORM_ADMIN_PASSWORD");
const otherEmail = value("QA_ADMIN_EMAIL", "DEMO_RESTAURANT_ADMIN_EMAIL"), otherPassword = value("QA_ADMIN_PASSWORD", "DEMO_RESTAURANT_ADMIN_PASSWORD");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const noJwt = await invoke(null, {});
assertError(noJwt, 401, "unauthorized");
const platform = await login(platformEmail, platformPassword);
const invalid = await invoke(platform.access_token, { restaurant_id: "bad" });
assertError(invalid, 400, "invalid_payload");
const ok = await invoke(platform.access_token, {});
assert(ok.status === 200 && ok.body?.ok === true && Array.isArray(ok.body.items), `platform_admin fallo: ${ok.status} ${JSON.stringify(ok.body)}`);
const serialized = JSON.stringify(ok.body);
for (const forbidden of ["comment", "customer_phone", "response_id", "metadata", "internal_note", "consent_text_snapshot"]) assert(!serialized.includes(forbidden), `campo sensible expuesto: ${forbidden}`);
await client.auth.signOut();
const other = await login(otherEmail, otherPassword);
const forbidden = await invoke(other.access_token, {});
assertError(forbidden, 403, "forbidden");
console.log("QA get_platform_activity_summary completed: auth, payload, rol y privacidad OK.");

async function login(email, password) { const { data, error } = await client.auth.signInWithPassword({ email, password }); if (error || !data.session) throw new Error(`No se pudo iniciar sesion: ${email}`); return data.session; }
async function invoke(token, body) { const response = await fetch(`${url}/functions/v1/get_platform_activity_summary`, { method: "POST", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json", apikey: key }, body: JSON.stringify(body) }); let responseBody = null; try { responseBody = await response.json(); } catch {} return { status: response.status, body: responseBody }; }
function assertError(result, status, code) { assert(result.status === status && result.body?.error?.code === code, `${code}: esperado ${status}, recibido ${result.status} ${JSON.stringify(result.body)}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function required(name) { const result = process.env[name]?.trim(); if (!result) throw new Error(`Falta ${name}`); return result; }
function value(primary, fallback) { return process.env[primary]?.trim() || required(fallback); }
function loadEnv(path) { if (!existsSync(path)) return; for (const line of readFileSync(path, "utf8").split(/\r?\n/)) { const match = line.match(/^\s*([^#=]+)=(.*)$/); if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, ""); } }
