import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDeviceInsertPayload,
  combineDeviceSettingsRows,
  validateDeviceDraft,
} from "./devices-settings-data.ts";

const branches = [
  { id: "branch-a", restaurant_id: "restaurant-a", name: "Centro", status: "active" },
];

const zones = [
  { id: "zone-a", restaurant_id: "restaurant-a", branch_id: "branch-a", name: "Terraza", status: "active" },
  { id: "zone-b", restaurant_id: "restaurant-a", branch_id: "branch-b", name: "Barra", status: "active" },
];

test("prioriza el enlace activo y conserva el orden de dispositivos", () => {
  const devices = [
    {
      id: "device-a",
      restaurant_id: "restaurant-a",
      branch_id: "branch-a",
      zone_id: null,
      name: "Tablet",
      description: null,
      status: "active",
      last_used_at: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    },
  ];
  const links = [
    {
      id: "newer-inactive",
      device_id: "device-a",
      status: "inactive",
      token_last4: "1111",
      regenerated_at: "2026-02-01",
      last_used_at: null,
      created_at: "2026-02-01",
      updated_at: "2026-02-01",
    },
    {
      id: "older-active",
      device_id: "device-a",
      status: "active",
      token_last4: "2222",
      regenerated_at: "2026-01-01",
      last_used_at: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    },
  ];

  const rows = combineDeviceSettingsRows(devices, branches, zones, links);

  assert.equal(rows[0].link?.id, "older-active");
  assert.equal(rows[0].branch?.name, "Centro");
  assert.equal(rows[0].zone, null);
});

test("valida nombre, sucursal y pertenencia de zona", () => {
  assert.deepEqual(
    validateDeviceDraft(
      { name: " ", branchId: "", zoneId: "zone-b", description: "" },
      branches,
      zones,
    ),
    {
      name: "El nombre es obligatorio.",
      branchId: "Selecciona una sucursal.",
      zoneId: "La zona no pertenece a la sucursal seleccionada.",
    },
  );
});

test("construye payload normalizado con zona opcional", () => {
  assert.deepEqual(
    buildDeviceInsertPayload(
      {
        name: "  Tablet recepción ",
        branchId: "branch-a",
        zoneId: "",
        description: "  Encuesta de salida  ",
      },
      branches,
      zones,
    ),
    {
      restaurant_id: "restaurant-a",
      branch_id: "branch-a",
      zone_id: null,
      name: "Tablet recepción",
      description: "Encuesta de salida",
      status: "active",
    },
  );
});
