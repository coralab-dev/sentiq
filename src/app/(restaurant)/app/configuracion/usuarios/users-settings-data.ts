import type { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CreateManagerUserRequest } from "@/types/edge-functions";

export type BranchOption = { id: string; name: string; status: string; restaurant_id: string };
export type ManagerProfileRow = { id: string; restaurant_id: string | null; full_name: string; email: string; role: string; status: string; created_at: string | null; updated_at: string | null };
export type ManagerAssignmentRow = { id: string; restaurant_id: string; manager_user_id: string; branch_id: string; status: string };
export type ManagerStatus = "active" | "invited" | "inactive";
export type ManagerUserItem = { id: string; fullName: string; email: string; role: "manager"; status: ManagerStatus; branchIds: string[]; activeBranchIds: string[]; assignedBranches: BranchOption[]; createdAt: string | null; updatedAt: string | null };
export type ManagerDraft = { fullName: string; email: string; branchIds: string[] };
export type ManagerDraftErrors = Partial<Record<keyof ManagerDraft, string>>;
type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>;

export function combineUsersSettingsData(input: { managers: ManagerProfileRow[]; assignments: ManagerAssignmentRow[]; branches: BranchOption[] }): ManagerUserItem[] {
  const branchesById = new Map(input.branches.map((branch) => [branch.id, branch]));
  return input.managers.filter((profile) => profile.role === "manager").map((profile) => {
    const assignments = input.assignments.filter((item) => item.manager_user_id === profile.id);
    return {
      id: profile.id, fullName: profile.full_name, email: profile.email, role: "manager" as const,
      status: normalizeStatus(profile.status), branchIds: assignments.map((item) => item.branch_id),
      activeBranchIds: assignments.filter((item) => item.status === "active").map((item) => item.branch_id),
      assignedBranches: assignments.map((item) => branchesById.get(item.branch_id) ?? { id: item.branch_id, name: "Sucursal no disponible", status: "inactive", restaurant_id: profile.restaurant_id ?? "" }),
      createdAt: profile.created_at, updatedAt: profile.updated_at,
    };
  });
}

export function validateManagerDraft(draft: ManagerDraft, branches: BranchOption[]): ManagerDraftErrors {
  const errors: ManagerDraftErrors = {}; const name = draft.fullName.trim();
  if (name.length < 2 || name.length > 120) errors.fullName = "El nombre debe tener entre 2 y 120 caracteres.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = "Ingresa un email válido.";
  const activeIds = new Set(branches.filter((branch) => branch.status === "active").map((branch) => branch.id));
  if (!draft.branchIds.length || draft.branchIds.some((id) => !activeIds.has(id))) errors.branchIds = "Selecciona al menos una sucursal activa.";
  return errors;
}

export function buildManagerPayload(draft: ManagerDraft, lockedEmail?: string): CreateManagerUserRequest {
  return { full_name: draft.fullName.trim(), email: (lockedEmail ?? draft.email).trim().toLowerCase(), branch_ids: [...new Set(draft.branchIds)] };
}
export function getManagerStatusLabel(status: ManagerStatus) { return status === "active" ? "Activo" : status === "invited" ? "Invitado" : "Inactivo"; }
function normalizeStatus(status: string): ManagerStatus { return status === "active" || status === "invited" ? status : "inactive"; }

export async function loadUsersSettingsData(supabase: SupabaseBrowserClient) {
  const [managersResult, assignmentsResult, branchesResult] = await Promise.all([
    supabase.from("user_profiles").select("id, restaurant_id, full_name, email, role, status, created_at, updated_at").eq("role", "manager").order("full_name"),
    supabase.from("manager_branch_assignments").select("id, restaurant_id, manager_user_id, branch_id, status"),
    supabase.from("branches").select("id, name, status, restaurant_id").order("name"),
  ]);
  const error = managersResult.error ?? assignmentsResult.error ?? branchesResult.error; if (error) throw error;
  const branches = branchesResult.data ?? [];
  return { branches, managers: combineUsersSettingsData({ managers: managersResult.data ?? [], assignments: assignmentsResult.data ?? [], branches }) };
}

export async function updateManagerStatus(supabase: SupabaseBrowserClient, managerId: string, status: "active" | "inactive") {
  const { error } = await supabase.from("user_profiles").update({ status, updated_at: new Date().toISOString() }).eq("id", managerId).eq("role", "manager");
  if (error) throw error;
}
