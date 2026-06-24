import type { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type WaiterBranch = Pick<
  Tables<"branches">,
  "id" | "restaurant_id" | "name" | "slug" | "status"
>;

export type WaiterRecord = Pick<
  Tables<"waiters">,
  | "id"
  | "restaurant_id"
  | "branch_id"
  | "name"
  | "internal_code"
  | "status"
  | "created_at"
  | "updated_at"
>;

export type WaiterSettingsRow = {
  waiter: WaiterRecord;
  branch: WaiterBranch | null;
};

export type WaitersSettingsData = {
  branches: WaiterBranch[];
  rows: WaiterSettingsRow[];
};

export type WaiterDraft = {
  name: string;
  internalCode: string;
  branchId: string;
};

export type WaiterDraftErrors = Partial<Record<keyof WaiterDraft, string>>;
export type WaiterStatus = "active" | "inactive";

type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>;

export function combineWaitersSettingsData(input: {
  branches: WaiterBranch[];
  waiters: WaiterRecord[];
}): WaitersSettingsData {
  const branchesById = new Map(input.branches.map((branch) => [branch.id, branch]));

  return {
    branches: input.branches,
    rows: input.waiters.map((waiter) => ({
      waiter: {
        id: waiter.id,
        restaurant_id: waiter.restaurant_id,
        branch_id: waiter.branch_id,
        name: waiter.name,
        internal_code: waiter.internal_code,
        status: waiter.status,
        created_at: waiter.created_at,
        updated_at: waiter.updated_at,
      },
      branch: branchesById.get(waiter.branch_id) ?? null,
    })),
  };
}

export function filterWaiterRowsByBranch(
  rows: WaiterSettingsRow[],
  branchId: string,
): WaiterSettingsRow[] {
  if (branchId === "all") {
    return rows;
  }

  return rows.filter((row) => row.waiter.branch_id === branchId);
}

export function getWaitersSummary(rows: WaiterSettingsRow[]) {
  return {
    total: rows.length,
    active: rows.filter((row) => row.waiter.status === "active").length,
    inactive: rows.filter((row) => row.waiter.status !== "active").length,
  };
}

export function validateWaiterDraft(
  draft: WaiterDraft,
  branches: WaiterBranch[],
): WaiterDraftErrors {
  const errors: WaiterDraftErrors = {};
  const name = draft.name.trim();
  const internalCode = draft.internalCode.trim();

  if (!name) {
    errors.name = "El nombre es obligatorio.";
  } else if (name.length > 120) {
    errors.name = "El nombre debe tener maximo 120 caracteres.";
  }

  if (internalCode.length > 50) {
    errors.internalCode = "El codigo interno debe tener maximo 50 caracteres.";
  }

  if (!branches.some((branch) => branch.id === draft.branchId)) {
    errors.branchId = "Selecciona una sucursal visible.";
  }

  return errors;
}

export function buildWaiterPayload(
  draft: WaiterDraft,
  branches: WaiterBranch[],
): TablesInsert<"waiters"> {
  const errors = validateWaiterDraft(draft, branches);
  if (Object.keys(errors).length > 0) {
    throw new Error("invalid_waiter_draft");
  }

  const branch = branches.find((item) => item.id === draft.branchId);
  if (!branch) {
    throw new Error("branch_not_found");
  }

  return {
    restaurant_id: branch.restaurant_id,
    branch_id: branch.id,
    name: draft.name.trim(),
    internal_code: draft.internalCode.trim() || null,
    status: "active",
  };
}

export function buildWaiterUpdatePayload(
  draft: WaiterDraft,
  branches: WaiterBranch[],
): TablesUpdate<"waiters"> {
  const payload = buildWaiterPayload(draft, branches);

  return {
    branch_id: payload.branch_id,
    name: payload.name,
    internal_code: payload.internal_code,
    updated_at: new Date().toISOString(),
  };
}

export async function loadWaitersSettingsData(
  supabase: SupabaseBrowserClient,
): Promise<WaitersSettingsData> {
  const [branchesResult, waitersResult] = await Promise.all([
    supabase
      .from("branches")
      .select("id, restaurant_id, name, slug, status")
      .order("name", { ascending: true }),
    supabase
      .from("waiters")
      .select("id, restaurant_id, branch_id, name, internal_code, status, created_at, updated_at")
      .order("name", { ascending: true }),
  ]);

  const error = branchesResult.error ?? waitersResult.error;
  if (error) {
    throw error;
  }

  return combineWaitersSettingsData({
    branches: branchesResult.data ?? [],
    waiters: waitersResult.data ?? [],
  });
}

export async function createWaiter(
  supabase: SupabaseBrowserClient,
  draft: WaiterDraft,
  branches: WaiterBranch[],
): Promise<WaiterRecord> {
  const payload = buildWaiterPayload(draft, branches);
  const { data, error } = await supabase
    .from("waiters")
    .insert(payload)
    .select("id, restaurant_id, branch_id, name, internal_code, status, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateWaiter(
  supabase: SupabaseBrowserClient,
  waiterId: string,
  draft: WaiterDraft,
  branches: WaiterBranch[],
): Promise<WaiterRecord> {
  const payload = buildWaiterUpdatePayload(draft, branches);
  const { data, error } = await supabase
    .from("waiters")
    .update(payload)
    .eq("id", waiterId)
    .select("id, restaurant_id, branch_id, name, internal_code, status, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateWaiterStatus(
  supabase: SupabaseBrowserClient,
  waiterId: string,
  status: WaiterStatus,
): Promise<void> {
  const { error } = await supabase
    .from("waiters")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", waiterId);

  if (error) {
    throw error;
  }
}
