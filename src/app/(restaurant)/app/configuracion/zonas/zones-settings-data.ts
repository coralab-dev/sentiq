import type { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type ZoneBranch = Pick<
  Tables<"branches">,
  "id" | "restaurant_id" | "name" | "slug" | "address" | "status" | "created_at" | "updated_at"
>;

export type ZoneRecord = Pick<
  Tables<"zones">,
  "id" | "restaurant_id" | "branch_id" | "name" | "description" | "status" | "created_at" | "updated_at"
>;

export type ZoneDevice = Pick<
  Tables<"devices">,
  "id" | "branch_id" | "zone_id" | "name" | "status" | "last_used_at"
>;

export type ZoneSurveyLink = Pick<
  Tables<"survey_links">,
  "id" | "branch_id" | "device_id" | "type" | "status" | "token_last4" | "regenerated_at" | "last_used_at"
>;

export type ZoneManagerAssignment = Pick<
  Tables<"manager_branch_assignments">,
  "id" | "branch_id" | "manager_user_id" | "status"
>;

export type ZoneManagerProfile = Pick<Tables<"user_profiles">, "id" | "full_name" | "email">;

export type ZoneManager = { id: string; fullName: string; email: string };
export type ZoneWithDevices = ZoneRecord & { devices: ZoneDevice[] };

export type BranchZoneSettings = {
  branch: ZoneBranch;
  zones: ZoneWithDevices[];
  zoneCount: number;
  deviceCount: number;
  qrStatus: "active" | "inactive" | "missing";
  qrTokenLast4: string | null;
  managers: ZoneManager[];
  managersAvailable: boolean;
};

export type ZoneDraft = { name: string; branchId: string; description: string };
export type ZoneDraftErrors = Partial<Record<keyof ZoneDraft, string>>;

type CombineInput = {
  branches: ZoneBranch[];
  zones: ZoneRecord[];
  devices: ZoneDevice[];
  links: ZoneSurveyLink[];
  assignments: ZoneManagerAssignment[];
  profiles: ZoneManagerProfile[];
  managersAvailable: boolean;
};

type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>;

export function combineZoneSettingsData(input: CombineInput): BranchZoneSettings[] {
  const devicesByZone = new Map<string, ZoneDevice[]>();
  const devicesByBranch = new Map<string, ZoneDevice[]>();
  const profilesById = new Map(input.profiles.map((profile) => [profile.id, profile]));

  for (const device of input.devices) {
    const branchDevices = devicesByBranch.get(device.branch_id) ?? [];
    branchDevices.push(device);
    devicesByBranch.set(device.branch_id, branchDevices);

    if (device.zone_id) {
      const zoneDevices = devicesByZone.get(device.zone_id) ?? [];
      zoneDevices.push(device);
      devicesByZone.set(device.zone_id, zoneDevices);
    }
  }

  return input.branches.map((branch) => {
    const zones = input.zones
      .filter((zone) => zone.branch_id === branch.id)
      .map((zone) => ({ ...zone, devices: devicesByZone.get(zone.id) ?? [] }));
    const qrLink = input.links.find(
      (link) => link.branch_id === branch.id && link.type === "qr" && link.status === "active",
    ) ?? input.links.find((link) => link.branch_id === branch.id && link.type === "qr");
    const managers = input.assignments
      .filter((assignment) => assignment.branch_id === branch.id && assignment.status === "active")
      .flatMap((assignment) => {
        const profile = profilesById.get(assignment.manager_user_id);
        return profile
          ? [{ id: profile.id, fullName: profile.full_name, email: profile.email }]
          : [];
      });

    return {
      branch,
      zones,
      zoneCount: zones.length,
      deviceCount: devicesByBranch.get(branch.id)?.length ?? 0,
      qrStatus: qrLink ? (qrLink.status === "active" ? "active" : "inactive") : "missing",
      qrTokenLast4: qrLink?.token_last4 ?? null,
      managers,
      managersAvailable: input.managersAvailable,
    };
  });
}

export function validateZoneDraft(draft: ZoneDraft, branches: ZoneBranch[]): ZoneDraftErrors {
  const errors: ZoneDraftErrors = {};
  if (!draft.name.trim()) errors.name = "El nombre es obligatorio.";
  if (!branches.some((branch) => branch.id === draft.branchId)) {
    errors.branchId = "Selecciona una sucursal válida.";
  }
  return errors;
}

export function buildZoneInsertPayload(
  draft: ZoneDraft,
  branches: ZoneBranch[],
): TablesInsert<"zones"> {
  const errors = validateZoneDraft(draft, branches);
  if (Object.keys(errors).length > 0) throw new Error("invalid_zone_draft");
  const branch = branches.find((item) => item.id === draft.branchId);
  if (!branch) throw new Error("branch_not_found");

  return {
    restaurant_id: branch.restaurant_id,
    branch_id: branch.id,
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    status: "active",
  };
}

export function buildZoneUpdatePayload(
  draft: ZoneDraft,
  updatedAt = new Date().toISOString(),
): TablesUpdate<"zones"> {
  if (!draft.name.trim()) throw new Error("invalid_zone_name");
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    updated_at: updatedAt,
  };
}

export async function loadZoneSettingsData(
  supabase: SupabaseBrowserClient,
): Promise<BranchZoneSettings[]> {
  const [branchesResult, zonesResult, devicesResult, linksResult] = await Promise.all([
    supabase.from("branches").select("id, restaurant_id, name, slug, address, status, created_at, updated_at").order("name"),
    supabase.from("zones").select("id, restaurant_id, branch_id, name, description, status, created_at, updated_at").order("name"),
    supabase.from("devices").select("id, branch_id, zone_id, name, status, last_used_at").order("name"),
    supabase.from("survey_links").select("id, branch_id, device_id, type, status, token_last4, regenerated_at, last_used_at").order("created_at", { ascending: false }),
  ]);
  const error = branchesResult.error ?? zonesResult.error ?? devicesResult.error ?? linksResult.error;
  if (error) throw error;

  let assignments: ZoneManagerAssignment[] = [];
  let profiles: ZoneManagerProfile[] = [];
  let managersAvailable = true;
  try {
    const [assignmentsResult, profilesResult] = await Promise.all([
      supabase.from("manager_branch_assignments").select("id, branch_id, manager_user_id, status").eq("status", "active"),
      supabase.from("user_profiles").select("id, full_name, email").eq("role", "manager"),
    ]);
    if (assignmentsResult.error || profilesResult.error) throw assignmentsResult.error ?? profilesResult.error;
    assignments = assignmentsResult.data ?? [];
    profiles = profilesResult.data ?? [];
  } catch {
    managersAvailable = false;
  }

  return combineZoneSettingsData({
    branches: branchesResult.data ?? [],
    zones: zonesResult.data ?? [],
    devices: devicesResult.data ?? [],
    links: linksResult.data ?? [],
    assignments,
    profiles,
    managersAvailable,
  });
}

export async function createZone(
  supabase: SupabaseBrowserClient,
  draft: ZoneDraft,
  branches: ZoneBranch[],
): Promise<void> {
  const { error } = await supabase.from("zones").insert(buildZoneInsertPayload(draft, branches));
  if (error) throw error;
}

export async function updateZone(
  supabase: SupabaseBrowserClient,
  zoneId: string,
  draft: ZoneDraft,
): Promise<void> {
  const { error } = await supabase.from("zones").update(buildZoneUpdatePayload(draft)).eq("id", zoneId);
  if (error) throw error;
}

export async function updateZoneStatus(
  supabase: SupabaseBrowserClient,
  zoneId: string,
  status: "active" | "inactive",
): Promise<void> {
  const { error } = await supabase
    .from("zones")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", zoneId);
  if (error) throw error;
}
