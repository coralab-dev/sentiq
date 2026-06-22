import type { CreateRestaurantAdminRequest, CreateRestaurantRequest } from "@/types/edge-functions";

export type NewRestaurantDraft = {
  restaurantName: string; legalName: string; contactName: string; contactEmail: string; contactPhone: string;
  planCode: "demo" | "basico" | "pro" | "custom"; accountStatus: "demo" | "pilot" | "active"; createInitialQr: boolean;
  branchName: string; branchSlug: string; branchAddress: string; branchInternalPhone: string; branchNotes: string;
  adminFullName: string; adminEmail: string;
};
export type NewRestaurantErrors = Partial<Record<keyof NewRestaurantDraft, string>>;
export const EMPTY_DRAFT: NewRestaurantDraft = { restaurantName: "", legalName: "", contactName: "", contactEmail: "", contactPhone: "", planCode: "demo", accountStatus: "demo", createInitialQr: true, branchName: "", branchSlug: "", branchAddress: "", branchInternalPhone: "", branchNotes: "", adminFullName: "", adminEmail: "" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[+\d][\d\s().-]{6,24}$/;
const RESTAURANT_ERRORS: Record<string, string> = { invalid_payload: "Revisa los datos del restaurante y sucursal.", unauthorized: "Tu sesion expiro.", forbidden: "No tienes permiso para crear restaurantes.", slug_conflict: "Ya existe un restaurante con ese nombre.", server_error: "No pudimos crear el restaurante." };
const ADMIN_ERRORS: Record<string, string> = { invalid_payload: "Revisa nombre y email del administrador.", unauthorized: "Tu sesion expiro.", forbidden: "No tienes permiso para crear administradores.", restaurant_not_found: "El restaurante creado no esta disponible.", email_conflict: "Ese email ya pertenece a otro usuario o rol.", admin_exists: "Este restaurante ya tiene administrador.", server_error: "No pudimos crear el administrador." };

export function validateNewRestaurantDraft(draft: NewRestaurantDraft): NewRestaurantErrors {
  const errors: NewRestaurantErrors = {};
  if (draft.restaurantName.trim().length < 2 || draft.restaurantName.trim().length > 120) errors.restaurantName = "El nombre debe tener entre 2 y 120 caracteres.";
  if (!draft.branchName.trim()) errors.branchName = "Ingresa el nombre de la primera sucursal.";
  else if (draft.branchName.trim().length > 120) errors.branchName = "El nombre no puede superar 120 caracteres.";
  if (draft.adminFullName.trim().length < 2 || draft.adminFullName.trim().length > 120) errors.adminFullName = "El nombre debe tener entre 2 y 120 caracteres.";
  for (const key of ["contactEmail", "adminEmail"] as const) { const value = draft[key].trim(); if ((key === "adminEmail" || value) && !EMAIL.test(value)) errors[key] = "Ingresa un email valido."; }
  for (const key of ["contactPhone", "branchInternalPhone"] as const) { const value = draft[key].trim(); if (value && !PHONE.test(value)) errors[key] = "Ingresa un telefono valido."; }
  return errors;
}
const optional = (value: string) => value.trim() || null;
export function buildRestaurantPayload(draft: NewRestaurantDraft): CreateRestaurantRequest { return { restaurant_name: draft.restaurantName.trim(), legal_name: optional(draft.legalName), contact_name: optional(draft.contactName), contact_email: optional(draft.contactEmail)?.toLowerCase() ?? null, contact_phone: optional(draft.contactPhone), plan_code: draft.planCode, account_status: draft.accountStatus, create_initial_qr: draft.createInitialQr, branch_name: draft.branchName.trim(), branch_slug: optional(draft.branchSlug), branch_address: optional(draft.branchAddress), branch_internal_phone: optional(draft.branchInternalPhone), branch_notes: optional(draft.branchNotes) }; }
export function buildAdminPayload(draft: NewRestaurantDraft, restaurantId: string): CreateRestaurantAdminRequest { return { restaurant_id: restaurantId, full_name: draft.adminFullName.trim(), email: draft.adminEmail.trim().toLowerCase() }; }
export function getFunctionErrorMessage(scope: "restaurant" | "admin", code: string) { const errors = scope === "restaurant" ? RESTAURANT_ERRORS : ADMIN_ERRORS; return errors[code] ?? errors.server_error; }
