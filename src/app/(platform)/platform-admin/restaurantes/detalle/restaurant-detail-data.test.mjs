import assert from "node:assert/strict";
import test from "node:test";

import {
  combineRestaurantDetailData,
  isValidRestaurantId,
} from "./restaurant-detail-data.ts";

const restaurant = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Restaurante Centro",
  slug: "restaurante-centro",
  contact_email: "admin@centro.test",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  contact_phone: "NO-DEBE-SALIR",
};

test("combina restaurante, cuenta, sucursales y usuarios", () => {
  const result = combineRestaurantDetailData({
    restaurant,
    account: { restaurant_id: restaurant.id, plan_code: "pro", account_status: "active", started_at: "2026-01-03T00:00:00Z", cancelled_at: null, updated_at: "2026-01-04T00:00:00Z" },
    branches: [{ id: "b1", restaurant_id: restaurant.id, name: "Centro", slug: "centro", status: "active", created_at: "2026-01-05T00:00:00Z", internal_phone: "NO-DEBE-SALIR" }],
    users: [{ id: "u1", restaurant_id: restaurant.id, full_name: "Admin Principal", email: "admin@centro.test", role: "restaurant_admin", status: "invited", created_at: "2026-01-06T00:00:00Z", updated_at: "2026-01-07T00:00:00Z" }],
    devices: [],
    surveyLinks: [],
  });

  assert.equal(result?.account?.planCode, "pro");
  assert.equal(result?.branches[0].name, "Centro");
  assert.equal(result?.administrators[0].fullName, "Admin Principal");
});

test("filtra administradores por role restaurant_admin", () => {
  const result = combineRestaurantDetailData({
    restaurant,
    account: null,
    branches: [],
    users: [
      { id: "u1", restaurant_id: restaurant.id, full_name: "Admin", email: "admin@test.dev", role: "restaurant_admin", status: "active", created_at: "2026-01-01T00:00:00Z", updated_at: null },
      { id: "u2", restaurant_id: restaurant.id, full_name: "Manager", email: "manager@test.dev", role: "manager", status: "active", created_at: "2026-01-01T00:00:00Z", updated_at: null },
    ],
    devices: [],
    surveyLinks: [],
  });

  assert.deepEqual(result?.administrators.map((user) => user.fullName), ["Admin"]);
  assert.equal(result?.aggregates.userCount, 2);
});

test("no propaga telefonos ni campos sensibles", () => {
  const result = combineRestaurantDetailData({ restaurant, account: null, branches: [], users: [], devices: [], surveyLinks: [] });
  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes("NO-DEBE-SALIR"), false);
  assert.equal("contact_phone" in result.restaurant, false);
});

test("maneja id invalido y restaurante no encontrado", () => {
  assert.equal(isValidRestaurantId(""), false);
  assert.equal(isValidRestaurantId("no-es-uuid"), false);
  assert.equal(isValidRestaurantId(restaurant.id), true);
  assert.equal(combineRestaurantDetailData({ restaurant: null, account: null, branches: [], users: [], devices: [], surveyLinks: [] }), null);
});

test("calcula agregados y ultima actividad conservadora", () => {
  const result = combineRestaurantDetailData({
    restaurant,
    account: { restaurant_id: restaurant.id, plan_code: "demo", account_status: "demo", started_at: null, cancelled_at: null, updated_at: "2026-01-04T00:00:00Z" },
    branches: [{ id: "b1", restaurant_id: restaurant.id, name: "Centro", slug: "centro", status: "active", created_at: "2026-01-01T00:00:00Z" }, { id: "b2", restaurant_id: restaurant.id, name: "Norte", slug: "norte", status: "inactive", created_at: "2026-01-02T00:00:00Z" }],
    users: [{ id: "u1", restaurant_id: restaurant.id, full_name: "Admin", email: "admin@test.dev", role: "restaurant_admin", status: "invited", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-05T00:00:00Z" }],
    devices: [{ restaurant_id: restaurant.id, status: "active", last_used_at: "2026-01-08T00:00:00Z" }, { restaurant_id: restaurant.id, status: "inactive", last_used_at: null }],
    surveyLinks: [{ restaurant_id: restaurant.id, status: "active", updated_at: "2026-01-06T00:00:00Z", regenerated_at: "2026-01-09T00:00:00Z" }, { restaurant_id: restaurant.id, status: "inactive", updated_at: null, regenerated_at: null }],
  });

  assert.deepEqual(result?.aggregates, { branchCount: 2, activeBranchCount: 1, userCount: 1, activeUserCount: 0, invitedUserCount: 1, deviceCount: 2, activeDeviceCount: 1, activeSurveyLinkCount: 1 });
  assert.equal(result?.lastActivityAt, "2026-01-09T00:00:00Z");
});
