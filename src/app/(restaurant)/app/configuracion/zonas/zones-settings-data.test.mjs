import assert from "node:assert/strict";
import test from "node:test";

import {
  buildZoneInsertPayload,
  buildZoneUpdatePayload,
  combineZoneSettingsData,
  getManagersEmptyLabel,
  validateZoneDraft,
} from "./zones-settings-data.ts";

const branches = [
  {
    id: "branch-a",
    restaurant_id: "restaurant-a",
    name: "Centro",
    slug: "centro",
    address: "Av. Uno",
    status: "active",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "branch-b",
    restaurant_id: "restaurant-a",
    name: "Norte",
    slug: "norte",
    address: null,
    status: "inactive",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
];

const zones = [
  {
    id: "zone-a",
    restaurant_id: "restaurant-a",
    branch_id: "branch-a",
    name: "Terraza",
    description: "Exterior",
    status: "active",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
];

const devices = [
  {
    id: "device-a",
    branch_id: "branch-a",
    zone_id: "zone-a",
    name: "Tablet terraza",
    status: "active",
    last_used_at: null,
  },
  {
    id: "device-b",
    branch_id: "branch-a",
    zone_id: null,
    name: "Tablet libre",
    status: "inactive",
    last_used_at: null,
  },
];

test("combina resumen, zonas, dispositivos, QR y gerentes por sucursal", () => {
  const result = combineZoneSettingsData({
    branches,
    zones,
    devices,
    links: [
      {
        id: "qr-a",
        branch_id: "branch-a",
        device_id: null,
        type: "qr",
        status: "active",
        token_last4: "1234",
        regenerated_at: null,
        last_used_at: null,
      },
      {
        id: "device-link",
        branch_id: "branch-a",
        device_id: "device-a",
        type: "device",
        status: "active",
        token_last4: "9999",
        regenerated_at: null,
        last_used_at: null,
      },
    ],
    assignments: [
      { id: "assignment-a", branch_id: "branch-a", manager_user_id: "manager-a", status: "active" },
    ],
    profiles: [
      { id: "manager-a", full_name: "Ana Admin", email: "ana@example.com" },
    ],
    managersAvailable: true,
  });

  assert.equal(result[0].zoneCount, 1);
  assert.equal(result[0].deviceCount, 2);
  assert.equal(result[0].qrStatus, "active");
  assert.equal(result[0].qrTokenLast4, "1234");
  assert.deepEqual(result[0].managers, [
    { id: "manager-a", fullName: "Ana Admin", email: "ana@example.com" },
  ]);
  assert.equal(result[0].zones[0].devices[0].name, "Tablet terraza");
  assert.equal(result[1].zones.length, 0);
});

test("marca gerentes como no disponibles sin afectar sucursales", () => {
  const result = combineZoneSettingsData({
    branches,
    zones,
    devices,
    links: [],
    assignments: [],
    profiles: [],
    managersAvailable: false,
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].managersAvailable, false);
  assert.deepEqual(result[0].managers, []);
});

test("distingue consulta de gerentes fallida de una asignación vacía", () => {
  assert.equal(getManagersEmptyLabel(false, 0), "Información no disponible");
  assert.equal(getManagersEmptyLabel(true, 0), "Sin gerentes asignados");
  assert.equal(getManagersEmptyLabel(true, 1), null);
});

test("valida nombre y sucursal visible", () => {
  assert.deepEqual(validateZoneDraft({ name: " ", branchId: "missing", description: "" }, branches), {
    name: "El nombre es obligatorio.",
    branchId: "Selecciona una sucursal válida.",
  });
});

test("construye payload de creación normalizado y deriva restaurant_id", () => {
  assert.deepEqual(
    buildZoneInsertPayload(
      { name: "  Terraza  ", branchId: "branch-a", description: "  Área exterior  " },
      branches,
    ),
    {
      restaurant_id: "restaurant-a",
      branch_id: "branch-a",
      name: "Terraza",
      description: "Área exterior",
      status: "active",
    },
  );
});

test("construye payload de edición sin permitir cambiar sucursal", () => {
  const payload = buildZoneUpdatePayload({
    name: "  Barra  ",
    branchId: "branch-b",
    description: "   ",
  }, "2026-06-20T12:00:00.000Z");

  assert.deepEqual(payload, {
    name: "Barra",
    description: null,
    updated_at: "2026-06-20T12:00:00.000Z",
  });
  assert.equal("branch_id" in payload, false);
});
