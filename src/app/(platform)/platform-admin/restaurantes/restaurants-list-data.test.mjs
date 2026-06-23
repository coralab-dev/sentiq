import assert from "node:assert/strict";
import test from "node:test";

import { combineRestaurantsListData, getRestaurantsSummary, mergePlatformActivitySummary } from "./restaurants-list-data.ts";

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

test("enriquece restaurantes con actividad agregada segura", () => {
  const items = combineRestaurantsListData({ restaurants: [restaurants[1]], accounts: [], branches: [], users: [] });
  const result = mergePlatformActivitySummary(items, [{
    restaurant_id: "r-new",
    response_count: 12,
    alert_count: 3,
    pending_alert_count: 2,
    attended_alert_count: 1,
    avg_general_experience: 4.25,
    last_response_at: "2026-02-01T00:00:00Z",
    last_alert_at: "2026-02-02T00:00:00Z",
    comment: "NO-DEBE-SALIR",
    customer_phone: "NO-DEBE-SALIR",
    response_id: "NO-DEBE-SALIR",
  }]);

  assert.equal(result[0].activityAvailable, true);
  assert.equal(result[0].responseCount, 12);
  assert.equal(result[0].alertCount, 3);
  assert.equal(result[0].pendingAlertCount, 2);
  assert.equal(result[0].attendedAlertCount, 1);
  assert.equal(result[0].avgGeneralExperience, 4.25);
  assert.equal(result[0].lastActivityAt, "2026-02-02T00:00:00Z");
  assert.equal(JSON.stringify(result).includes("NO-DEBE-SALIR"), false);
});

test("usa fallback de actividad cuando la funcion agregada no devuelve item", () => {
  const items = combineRestaurantsListData({ restaurants: [restaurants[1]], accounts: [], branches: [], users: [] });
  const result = mergePlatformActivitySummary(items, []);

  assert.equal(result[0].activityAvailable, false);
  assert.equal(result[0].responseCount, null);
  assert.equal(result[0].alertCount, null);
  assert.equal(result[0].lastActivityAt, "2026-01-02T00:00:00Z");
});
