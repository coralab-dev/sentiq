import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const functionPath = new URL("./index.ts", import.meta.url);

async function source() {
  return readFile(functionPath, "utf8");
}

test("accepts exactly one valid device or survey link UUID", async () => {
  const code = await source();

  assert.match(code, /Boolean\(deviceId\) === Boolean\(surveyLinkId\)/);
  assert.match(code, /UUID_PATTERN\.test\(id\)/);
  assert.match(code, /kind: "device" \| "survey_link"/);
});

test("authenticates the caller and only authorizes platform or matching restaurant admins", async () => {
  const code = await source();

  assert.match(code, /supabase\.auth\.getUser\(jwt\)/);
  assert.match(code, /profile\.status !== "active"/);
  assert.match(code, /profile\.role === "platform_admin"/);
  assert.match(code, /profile\.role !== "restaurant_admin"/);
  assert.match(code, /profile\.restaurant_id === restaurantId/);
  assert.doesNotMatch(code, /ALLOWED_ROLES[\s\S]*manager/);
});

test("resolves only device links and validates device relationship consistency", async () => {
  const code = await source();

  assert.match(code, /\.eq\("type", "device"\)/);
  assert.match(code, /surveyLink\.type !== "device"/);
  assert.match(code, /!surveyLink\.device_id/);
  assert.match(code, /surveyLink\.restaurant_id !== device\.restaurant_id/);
  assert.match(code, /surveyLink\.branch_id !== device\.branch_id/);
  assert.match(code, /surveyLink\.zone_id !== device\.zone_id/);
});

test("persists only the hash and last four characters and returns a one-time device URL", async () => {
  const code = await source();

  assert.match(code, /token_hash: tokenSecret\.tokenHash/);
  assert.match(code, /token_last4: tokenSecret\.tokenLast4/);
  assert.match(code, /type: "device"/);
  assert.match(code, /return `\$\{baseUrl\}\/d\/\$\{encodeURIComponent\(token\)\}`/);
  assert.doesNotMatch(code, /token:\s*tokenSecret\.token/);
  assert.doesNotMatch(code, /console\.(?:log|info|warn|error)/);
});
