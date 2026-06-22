import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminPayload,
  buildRestaurantPayload,
  getFunctionErrorMessage,
  validateNewRestaurantDraft,
} from "./new-restaurant-data.ts";

const validDraft = {
  restaurantName: " Restaurante Centro ", legalName: " Centro SA ", contactName: " Ana ", contactEmail: " CONTACTO@EXAMPLE.COM ", contactPhone: " +52 55 1234 5678 ",
  planCode: "demo", accountStatus: "demo", createInitialQr: true,
  branchName: " Matriz ", branchSlug: " centro-matriz ", branchAddress: " Reforma 1 ", branchInternalPhone: " +52 55 9999 0000 ", branchNotes: " Acceso lateral ",
  adminFullName: " Laura Admin ", adminEmail: " LAURA@EXAMPLE.COM ",
};

test("valida los campos requeridos y formatos del alta", () => {
  const errors = validateNewRestaurantDraft({ ...validDraft, restaurantName: "x", branchName: "", contactEmail: "bad", adminFullName: "x", adminEmail: "bad" });
  assert.equal(errors.restaurantName, "El nombre debe tener entre 2 y 120 caracteres.");
  assert.equal(errors.branchName, "Ingresa el nombre de la primera sucursal.");
  assert.equal(errors.contactEmail, "Ingresa un email valido.");
  assert.equal(errors.adminFullName, "El nombre debe tener entre 2 y 120 caracteres.");
  assert.equal(errors.adminEmail, "Ingresa un email valido.");
});

test("normaliza los payloads de restaurante y administrador", () => {
  assert.deepEqual(buildRestaurantPayload(validDraft), {
    restaurant_name: "Restaurante Centro", legal_name: "Centro SA", contact_name: "Ana", contact_email: "contacto@example.com", contact_phone: "+52 55 1234 5678",
    plan_code: "demo", account_status: "demo", create_initial_qr: true,
    branch_name: "Matriz", branch_slug: "centro-matriz", branch_address: "Reforma 1", branch_internal_phone: "+52 55 9999 0000", branch_notes: "Acceso lateral",
  });
  assert.deepEqual(buildAdminPayload(validDraft, "restaurant-id"), { restaurant_id: "restaurant-id", full_name: "Laura Admin", email: "laura@example.com" });
});

test("mapea errores publicos de ambas Edge Functions", () => {
  assert.equal(getFunctionErrorMessage("restaurant", "slug_conflict"), "Ya existe un restaurante con ese nombre.");
  assert.equal(getFunctionErrorMessage("admin", "email_conflict"), "Ese email ya pertenece a otro usuario o rol.");
  assert.equal(getFunctionErrorMessage("admin", "unknown"), "No pudimos crear el administrador.");
});
