import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWaiterPayload,
  combineWaitersSettingsData,
  filterWaiterRowsByBranch,
  getWaitersSummary,
  validateWaiterDraft,
} from "./waiters-settings-data.ts";

const branches = [
  { id: "b1", restaurant_id: "r1", name: "Centro", slug: "centro", status: "active" },
  { id: "b2", restaurant_id: "r1", name: "Norte", slug: "norte", status: "inactive" },
];

const waiters = [
  {
    id: "w1",
    restaurant_id: "r1",
    branch_id: "b1",
    name: "Ana",
    internal_code: "A-01",
    status: "active",
    created_at: "2026-01-01T12:00:00.000Z",
    updated_at: "2026-01-02T12:00:00.000Z",
    customer_phone: "555-0000",
  },
  {
    id: "w2",
    restaurant_id: "r1",
    branch_id: "b2",
    name: "Luis",
    internal_code: null,
    status: "inactive",
    created_at: "2026-01-03T12:00:00.000Z",
    updated_at: "2026-01-04T12:00:00.000Z",
    comment: "sensitive",
  },
];

test("combina sucursales y meseros visibles", () => {
  const data = combineWaitersSettingsData({ branches, waiters });

  assert.equal(data.rows.length, 2);
  assert.equal(data.rows[0].waiter.name, "Ana");
  assert.equal(data.rows[0].branch?.name, "Centro");
  assert.equal(data.rows[1].branch?.name, "Norte");
});

test("filtra meseros por sucursal", () => {
  const data = combineWaitersSettingsData({ branches, waiters });

  assert.equal(filterWaiterRowsByBranch(data.rows, "all").length, 2);
  assert.deepEqual(filterWaiterRowsByBranch(data.rows, "b1").map((row) => row.waiter.id), ["w1"]);
});

test("valida draft correcto y construye payload normalizado", () => {
  const draft = { name: "  Maria Lopez  ", internalCode: " M-02 ", branchId: "b1" };

  assert.deepEqual(validateWaiterDraft(draft, branches), {});
  assert.deepEqual(buildWaiterPayload(draft, branches), {
    restaurant_id: "r1",
    branch_id: "b1",
    name: "Maria Lopez",
    internal_code: "M-02",
    status: "active",
  });
});

test("rechaza nombre vacio, largos invalidos y branch ajeno", () => {
  const errors = validateWaiterDraft(
    { name: " ", internalCode: "x".repeat(51), branchId: "missing" },
    branches,
  );

  assert.equal(errors.name, "El nombre es obligatorio.");
  assert.equal(errors.internalCode, "El codigo interno debe tener maximo 50 caracteres.");
  assert.equal(errors.branchId, "Selecciona una sucursal visible.");
});

test("no propaga campos sensibles", () => {
  const data = combineWaitersSettingsData({ branches, waiters });
  const serialized = JSON.stringify(data);

  assert.equal(serialized.includes("customer_phone"), false);
  assert.equal(serialized.includes("comment"), false);
  assert.equal(serialized.includes("555-"), false);
  assert.equal(serialized.includes("sensitive"), false);
});

test("calcula conteos activos e inactivos", () => {
  const data = combineWaitersSettingsData({ branches, waiters });

  assert.deepEqual(getWaitersSummary(data.rows), {
    total: 2,
    active: 1,
    inactive: 1,
  });
});
