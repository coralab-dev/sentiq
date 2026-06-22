import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
loadEnv(".env"); loadEnv(".env.local");
const url = required("NEXT_PUBLIC_SUPABASE_URL"), key = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const platformEmail = value("QA_PLATFORM_ADMIN_EMAIL", "DEMO_PLATFORM_ADMIN_EMAIL"), platformPassword = value("QA_PLATFORM_ADMIN_PASSWORD", "DEMO_PLATFORM_ADMIN_PASSWORD");
const otherEmail = value("QA_ADMIN_EMAIL", "DEMO_RESTAURANT_ADMIN_EMAIL"), otherPassword = value("QA_ADMIN_PASSWORD", "DEMO_RESTAURANT_ADMIN_PASSWORD");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const noJwt = await invoke(null, {}); assertError(noJwt, 401, "unauthorized");
const platform = await login(platformEmail, platformPassword);
const invalid = await invoke(platform.access_token, { restaurant_name: "x" }); assertError(invalid, 400, "invalid_payload");
await client.auth.signOut(); const other = await login(otherEmail, otherPassword);
const forbidden = await invoke(other.access_token, validPayload(`Forbidden ${Date.now()}`, false)); assertError(forbidden, 403, "forbidden");
await client.auth.signOut(); const admin = await login(platformEmail, platformPassword);
const stamp = Date.now(); const created = await invoke(admin.access_token, validPayload(`QA Restaurante ${stamp}`, true));
assert(created.status === 200 && created.body?.ok && created.body.qr_url && created.body.token_last4, `creación QR falló: ${created.status} ${JSON.stringify(created.body)}`);
const duplicate = await invoke(admin.access_token, validPayload(`QA Restaurante ${stamp}`, true)); assertError(duplicate, 409, "slug_conflict");
await verifyCreated(created.body, true);
const withoutQr = await invoke(admin.access_token, validPayload(`QA Sin QR ${stamp}`, false));
assert(withoutQr.status === 200 && withoutQr.body?.ok && !withoutQr.body.qr_link_id && !withoutQr.body.qr_url, "creación sin QR falló");
await verifyCreated(withoutQr.body, false);
console.log("QA create_restaurant completed: auth, payload, rol, slug, estructura y QR OK.");
function validPayload(name, qr) { return { restaurant_name: name, legal_name: `  ${name} SA  `, contact_name: " QA Contacto ", contact_email: "QA@EXAMPLE.COM", contact_phone: "+52 55 1234 5678", plan_code: "demo", account_status: "demo", branch_name: "Sucursal Centro", branch_address: "Dirección QA", create_initial_qr: qr }; }
async function verifyCreated(body, withQr) { for (const [table, id] of [["restaurants", body.restaurant_id], ["restaurant_accounts", body.account_id], ["restaurant_settings", body.settings_id], ["branches", body.branch_id]]) { const { data, error } = await client.from(table).select("id").eq("id", id).maybeSingle(); assert(!error && data, `registro faltante en ${table}`); } const { data: links, error } = await client.from("survey_links").select("id,token_hash,token_last4").eq("restaurant_id", body.restaurant_id); assert(!error && (withQr ? links?.length === 1 && links[0].token_hash && !("token" in links[0]) : links?.length === 0), "verificación QR falló"); }
async function login(email, password) { const { data, error } = await client.auth.signInWithPassword({ email, password }); if (error || !data.session) throw new Error(`No se pudo iniciar sesión: ${email}`); return data.session; }
async function invoke(token, body) { const response = await fetch(`${url}/functions/v1/create_restaurant`, { method: "POST", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json", apikey: key }, body: JSON.stringify(body) }); let responseBody = null; try { responseBody = await response.json(); } catch {} return { status: response.status, body: responseBody }; }
function assertError(result, status, code) { assert(result.status === status && result.body?.error?.code === code, `${code}: esperado ${status}, recibido ${result.status}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function required(name) { const result = process.env[name]?.trim(); if (!result) throw new Error(`Falta ${name}`); return result; }
function value(primary, fallback) { return process.env[primary]?.trim() || required(fallback); }
function loadEnv(path) { if (!existsSync(path)) return; for (const line of readFileSync(path, "utf8").split(/\r?\n/)) { const match = line.match(/^\s*([^#=]+)=(.*)$/); if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, ""); } }
