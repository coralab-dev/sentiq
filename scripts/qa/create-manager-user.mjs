import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

loadEnv(".env"); loadEnv(".env.local");
const url = required("NEXT_PUBLIC_SUPABASE_URL");
const key = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const adminEmail = value("QA_ADMIN_EMAIL", "DEMO_RESTAURANT_ADMIN_EMAIL");
const adminPassword = value("QA_ADMIN_PASSWORD", "DEMO_RESTAURANT_ADMIN_PASSWORD");
const managerEmail = value("QA_MANAGER_EMAIL", "DEMO_MANAGER_EMAIL");
const managerPassword = value("QA_MANAGER_PASSWORD", "DEMO_MANAGER_PASSWORD");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const noJwt = await fetch(`${url}/functions/v1/create_manager_user`, { method: "POST", headers: { "Content-Type": "application/json", apikey: key }, body: "{}" });
assert(noJwt.status === 401, `sin JWT: esperado 401, recibido ${noJwt.status}`);
const admin = await login(adminEmail, adminPassword);
const { data: branches, error: branchesError } = await client.from("branches").select("id").eq("status", "active").order("created_at");
if (branchesError || !branches?.length) throw new Error("QA requiere al menos una sucursal activa visible al admin.");
const invalid = await invoke(admin.access_token, { full_name: "x", email: "bad", branch_ids: [] });
assertError(invalid, 400, "invalid_payload");
await client.auth.signOut();
const manager = await login(managerEmail, managerPassword);
const forbidden = await invoke(manager.access_token, { full_name: "QA Manager", email: `qa-${Date.now()}@example.com`, branch_ids: [branches[0].id] });
assertError(forbidden, 403, "forbidden");
await client.auth.signOut();
const adminAgain = await login(adminEmail, adminPassword);
const qaEmail = `qa-manager-${Date.now()}@example.com`;
const firstIds = branches.slice(0, Math.min(2, branches.length)).map((branch) => branch.id);
const created = await invoke(adminAgain.access_token, { full_name: "QA Manager T056", email: qaEmail, branch_ids: firstIds });
assert(created.status === 200 && created.body.ok && created.body.created, `creacion inicial fallo: ${created.status} ${JSON.stringify(created.body)}`);
const repeated = await invoke(adminAgain.access_token, { full_name: "QA Manager T056", email: qaEmail, branch_ids: firstIds });
assert(repeated.status === 200 && repeated.body.user_id === created.body.user_id && !repeated.body.created, "idempotencia fallo");
const nextIds = branches.length > 1 ? [branches[1].id] : [branches[0].id];
const changed = await invoke(adminAgain.access_token, { full_name: "QA Manager T056", email: qaEmail, branch_ids: nextIds });
assert(changed.status === 200, "sincronizacion de sucursales fallo");
const { data: profile } = await client.from("user_profiles").select("role,restaurant_id,email").eq("id", created.body.user_id).single();
assert(profile?.role === "manager" && profile.email === qaEmail, "perfil manager incorrecto");
const { data: assignments } = await client.from("manager_branch_assignments").select("branch_id,status").eq("manager_user_id", created.body.user_id);
for (const row of assignments ?? []) assert(row.status === (nextIds.includes(row.branch_id) ? "active" : "inactive"), "asignaciones no sincronizadas");
const missingBranch = await invoke(adminAgain.access_token, { full_name: "QA Manager T056", email: qaEmail, branch_ids: [randomUUID()] });
assertError(missingBranch, 404, "branch_not_found");
const conflict = await invoke(adminAgain.access_token, { full_name: "Conflicto", email: adminEmail, branch_ids: nextIds });
assertError(conflict, 409, "email_conflict");
console.log("QA create_manager_user completed: auth, payload, rol, creacion, idempotencia, asignaciones y conflictos OK.");

async function login(email, password) { const { data, error } = await client.auth.signInWithPassword({ email, password }); if (error || !data.session) throw new Error(`No se pudo iniciar sesion: ${email}`); return data.session; }
async function invoke(token, body) { const response = await fetch(`${url}/functions/v1/create_manager_user`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", apikey: key }, body: JSON.stringify(body) }); return { status: response.status, body: await response.json() }; }
function assertError(result, status, code) { assert(result.status === status && result.body?.error?.code === code, `${code}: esperado ${status}, recibido ${result.status}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function required(name) { const result = process.env[name]?.trim(); if (!result) throw new Error(`Falta ${name}`); return result; }
function value(primary, fallback) { return process.env[primary]?.trim() || required(fallback); }
function loadEnv(path) { if (!existsSync(path)) return; for (const line of readFileSync(path, "utf8").split(/\r?\n/)) { const match = line.match(/^\s*([^#=]+)=(.*)$/); if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, ""); } }
