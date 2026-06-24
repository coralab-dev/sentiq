import assert from "node:assert/strict";
import test from "node:test";

import {
  combineRestaurantAccountSettingsData,
  getLatestOperationalActivityAt,
} from "./account-settings-data.ts";

const restaurant = {
  id: "r1",
  name: "SentiQ Demo",
  slug: "sentiq-demo",
  status: "active",
  created_at: "2026-01-10T12:00:00.000Z",
  updated_at: "2026-06-01T12:00:00.000Z",
  contact_phone: "555-0000",
};

const account = {
  restaurant_id: "r1",
  plan_code: "pilot",
  account_status: "active",
  started_at: "2026-01-15T12:00:00.000Z",
  cancelled_at: null,
  updated_at: "2026-06-02T12:00:00.000Z",
  internal_phone: "555-1111",
};

test("combina restaurante cuenta y agregados operativos", () => {
  const result = combineRestaurantAccountSettingsData({
    profile: { id: "u1", restaurant_id: "r1" },
    restaurant,
    account,
    branches: [
      { restaurant_id: "r1", status: "active" },
      { restaurant_id: "r1", status: "inactive" },
    ],
    users: [
      { restaurant_id: "r1", role: "restaurant_admin", status: "active" },
      { restaurant_id: "r1", role: "manager", status: "invited" },
      { restaurant_id: "r1", role: "manager", status: "inactive" },
    ],
    devices: [
      { restaurant_id: "r1", status: "active", last_used_at: "2026-06-03T12:00:00.000Z" },
      { restaurant_id: "r1", status: "inactive", last_used_at: "2026-06-04T12:00:00.000Z" },
    ],
    surveyLinks: [
      { restaurant_id: "r1", status: "active", updated_at: "2026-06-05T12:00:00.000Z", regenerated_at: null },
      { restaurant_id: "r1", status: "inactive", updated_at: "2026-06-06T12:00:00.000Z", regenerated_at: "2026-06-07T12:00:00.000Z" },
    ],
  });

  assert.equal(result.status, "success");
  assert.equal(result.restaurant?.name, "SentiQ Demo");
  assert.equal(result.account?.planCode, "pilot");
  assert.equal(result.aggregates.totalBranches, 2);
  assert.equal(result.aggregates.activeBranches, 1);
  assert.equal(result.aggregates.activeUsers, 1);
  assert.equal(result.aggregates.invitedUsers, 1);
  assert.equal(result.aggregates.activeDevices, 1);
  assert.equal(result.aggregates.activeSurveyLinks, 1);
  assert.equal(result.aggregates.lastOperationalActivityAt, "2026-06-05T12:00:00.000Z");
});

test("usa fallback cuando no existe restaurant_account", () => {
  const result = combineRestaurantAccountSettingsData({
    profile: { id: "u1", restaurant_id: "r1" },
    restaurant,
    account: null,
    branches: [],
    users: [],
    devices: [],
    surveyLinks: [],
  });

  assert.equal(result.status, "success");
  assert.equal(result.account, null);
  assert.equal(result.aggregates.totalBranches, 0);
  assert.equal(result.aggregates.activeBranches, 0);
});

test("no propaga telefonos ni campos sensibles", () => {
  const result = combineRestaurantAccountSettingsData({
    profile: { id: "u1", restaurant_id: "r1", customer_phone: "555-2222" },
    restaurant,
    account,
    branches: [],
    users: [],
    devices: [],
    surveyLinks: [],
  });

  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("contact_phone"), false);
  assert.equal(serialized.includes("internal_phone"), false);
  assert.equal(serialized.includes("customer_phone"), false);
  assert.equal(serialized.includes("555-"), false);
});

test("calcula ultima actividad conservadora solo desde activos", () => {
  const latest = getLatestOperationalActivityAt({
    devices: [
      { restaurant_id: "r1", status: "inactive", last_used_at: "2026-06-10T12:00:00.000Z" },
      { restaurant_id: "r1", status: "active", last_used_at: "2026-06-08T12:00:00.000Z" },
    ],
    surveyLinks: [
      { restaurant_id: "r1", status: "active", updated_at: "2026-06-09T12:00:00.000Z", regenerated_at: "2026-06-07T12:00:00.000Z" },
      { restaurant_id: "r1", status: "inactive", updated_at: "2026-06-11T12:00:00.000Z", regenerated_at: "2026-06-12T12:00:00.000Z" },
    ],
  });

  assert.equal(latest, "2026-06-09T12:00:00.000Z");
});

test("reporta missing_profile si el perfil no tiene restaurant_id", () => {
  const result = combineRestaurantAccountSettingsData({
    profile: { id: "u1", restaurant_id: null },
    restaurant: null,
    account: null,
    branches: [],
    users: [],
    devices: [],
    surveyLinks: [],
  });

  assert.equal(result.status, "missing_profile");
  assert.equal(result.restaurant, null);
});
