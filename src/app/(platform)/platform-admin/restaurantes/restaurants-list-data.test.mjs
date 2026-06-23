import assert from "node:assert/strict";
import test from "node:test";

import { combineRestaurantsListData, getRestaurantsSummary } from "./restaurants-list-data.ts";

const restaurants = [
  { id: "r-old", name: "Antiguo", slug: "antiguo", contact_email: null, status: "inactive", created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-02T00:00:00Z" },
  { id: "r-new", name: "Nuevo", slug: "nuevo", contact_email: "admin@example.com", status: "active", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
];

test("agrega cuentas, sucursales y usuarios sin propagar campos sensibles", () => {
  const result = combineRestaurantsListData({
    restaurants,
    accounts: [{ restaurant_id: "r-new", plan_code: "pro", account_status: "active", updated_at: "2026-01-03T00:00:00Z" }],
    branches: [{ restaurant_id: "r-new", status: "active" }, { restaurant_id: "r-new", status: "inactive" }],
    users: [{ restaurant_id: "r-new", role: "restaurant_admin", status: "active", updated_at: "2026-01-04T00:00:00Z", customer_phone: "NO-DEBE-SALIR" }],
  });
  assert.equal(result[0].branchCount, 2);
  assert.equal(result[0].activeBranchCount, 1);
  assert.equal(result[0].userCount, 1);
  assert.equal(result[0].planCode, "pro");
  assert.equal(result[0].lastActivityAt, "2026-01-04T00:00:00Z");
  assert.equal("customer_phone" in result[0], false);
});

test("ordena restaurantes por fecha de alta descendente", () => {
  const result = combineRestaurantsListData({ restaurants, accounts: [], branches: [], users: [] });
  assert.deepEqual(result.map((item) => item.id), ["r-new", "r-old"]);
});

test("usa fallbacks cuando no hay cuenta ni actividad adicional", () => {
  const result = combineRestaurantsListData({ restaurants: [restaurants[0]], accounts: [], branches: [], users: [] });
  assert.equal(result[0].planCode, null);
  assert.equal(result[0].accountStatus, null);
  assert.equal(result[0].lastActivityAt, "2025-01-02T00:00:00Z");
});

test("resume totales por estado de restaurante y cuenta", () => {
  const items = combineRestaurantsListData({ restaurants, accounts: [{ restaurant_id: "r-new", plan_code: "demo", account_status: "demo", updated_at: null }], branches: [], users: [] });
  assert.deepEqual(getRestaurantsSummary(items), { total: 2, active: 1, demoPilot: 1, inactiveSuspended: 1 });
});
