import assert from "node:assert/strict";
import test from "node:test";

import { buildManagerPayload, combineUsersSettingsData, getManagerStatusLabel, validateManagerDraft } from "./users-settings-data.ts";

const branches = [{ id: "b1", name: "Centro", status: "active", restaurant_id: "r1" }, { id: "b2", name: "Norte", status: "inactive", restaurant_id: "r1" }];
const managers = [
  { id: "m1", restaurant_id: "r1", full_name: "Ana", email: "ana@example.com", role: "manager", status: "active", created_at: null, updated_at: null },
  { id: "a1", restaurant_id: "r1", full_name: "Admin", email: "admin@example.com", role: "restaurant_admin", status: "active", created_at: null, updated_at: null },
];

test("combina solo gerentes con asignaciones y fallback de sucursal", () => {
  const result = combineUsersSettingsData({ managers, branches, assignments: [
    { id: "x1", restaurant_id: "r1", manager_user_id: "m1", branch_id: "b1", status: "active" },
    { id: "x2", restaurant_id: "r1", manager_user_id: "m1", branch_id: "missing", status: "inactive" },
  ] });
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].activeBranchIds, ["b1"]);
  assert.equal(result[0].assignedBranches[1].name, "Sucursal no disponible");
});

test("valida nombre email y sucursales activas", () => {
  assert.deepEqual(validateManagerDraft({ fullName: "x", email: "bad", branchIds: ["b2"] }, branches), {
    fullName: "El nombre debe tener entre 2 y 120 caracteres.", email: "Ingresa un email válido.", branchIds: "Selecciona al menos una sucursal activa.",
  });
});

test("normaliza payload y conserva email bloqueado en edicion", () => {
  assert.deepEqual(buildManagerPayload({ fullName: "  Ana Pérez ", email: " NEW@EXAMPLE.COM ", branchIds: ["b1"] }), { full_name: "Ana Pérez", email: "new@example.com", branch_ids: ["b1"] });
  assert.equal(buildManagerPayload({ fullName: "Ana", email: "changed@example.com", branchIds: ["b1"] }, "original@example.com").email, "original@example.com");
});

test("expone labels de estados soportados", () => {
  assert.equal(getManagerStatusLabel("active"), "Activo");
  assert.equal(getManagerStatusLabel("invited"), "Invitado");
  assert.equal(getManagerStatusLabel("inactive"), "Inactivo");
});
