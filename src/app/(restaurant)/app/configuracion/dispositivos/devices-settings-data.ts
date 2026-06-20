import type { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert } from "@/types/supabase";

export type DeviceBranch = Pick<
  Tables<"branches">,
  "id" | "restaurant_id" | "name" | "status"
>;

export type DeviceZone = Pick<
  Tables<"zones">,
  "id" | "restaurant_id" | "branch_id" | "name" | "status"
>;

export type DeviceRecord = Pick<
  Tables<"devices">,
  | "id"
  | "restaurant_id"
  | "branch_id"
  | "zone_id"
  | "name"
  | "description"
  | "status"
  | "last_used_at"
  | "created_at"
  | "updated_at"
>;

export type DeviceSurveyLink = Pick<
  Tables<"survey_links">,
  | "id"
  | "device_id"
  | "status"
  | "token_last4"
  | "regenerated_at"
  | "last_used_at"
  | "created_at"
  | "updated_at"
>;

export type DeviceSettingsRow = {
  device: DeviceRecord;
  branch: DeviceBranch | null;
  zone: DeviceZone | null;
  link: DeviceSurveyLink | null;
};

export type DeviceSettingsData = {
  rows: DeviceSettingsRow[];
  branches: DeviceBranch[];
  zones: DeviceZone[];
};

export type DeviceDraft = {
  name: string;
  branchId: string;
  zoneId: string;
  description: string;
};

export type DeviceDraftErrors = Partial<Record<keyof DeviceDraft, string>>;

export type TemporaryDeviceLink = {
  url: string;
  tokenLast4: string;
};

type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>;

export function combineDeviceSettingsRows(
  devices: DeviceRecord[],
  branches: DeviceBranch[],
  zones: DeviceZone[],
  links: DeviceSurveyLink[],
): DeviceSettingsRow[] {
  const branchesById = new Map(branches.map((branch) => [branch.id, branch]));
  const zonesById = new Map(zones.map((zone) => [zone.id, zone]));
  const linksByDevice = new Map<string, DeviceSurveyLink>();

  for (const link of links) {
    if (!link.device_id) continue;

    const current = linksByDevice.get(link.device_id);
    if (!current || (current.status !== "active" && link.status === "active")) {
      linksByDevice.set(link.device_id, link);
    }
  }

  return devices.map((device) => ({
    device,
    branch: branchesById.get(device.branch_id) ?? null,
    zone: device.zone_id ? zonesById.get(device.zone_id) ?? null : null,
    link: linksByDevice.get(device.id) ?? null,
  }));
}

export function validateDeviceDraft(
  draft: DeviceDraft,
  branches: DeviceBranch[],
  zones: DeviceZone[],
): DeviceDraftErrors {
  const errors: DeviceDraftErrors = {};
  const branch = branches.find((item) => item.id === draft.branchId);

  if (!draft.name.trim()) {
    errors.name = "El nombre es obligatorio.";
  }

  if (!branch) {
    errors.branchId = "Selecciona una sucursal.";
  }

  if (draft.zoneId) {
    const zone = zones.find((item) => item.id === draft.zoneId);
    if (!zone || zone.branch_id !== draft.branchId) {
      errors.zoneId = "La zona no pertenece a la sucursal seleccionada.";
    }
  }

  return errors;
}

export function buildDeviceInsertPayload(
  draft: DeviceDraft,
  branches: DeviceBranch[],
  zones: DeviceZone[],
): TablesInsert<"devices"> {
  const errors = validateDeviceDraft(draft, branches, zones);
  if (Object.keys(errors).length > 0) {
    throw new Error("invalid_device_draft");
  }

  const branch = branches.find((item) => item.id === draft.branchId);
  if (!branch) throw new Error("branch_not_found");

  return {
    restaurant_id: branch.restaurant_id,
    branch_id: branch.id,
    zone_id: draft.zoneId || null,
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    status: "active",
  };
}

export async function loadDeviceSettingsData(
  supabase: SupabaseBrowserClient,
): Promise<DeviceSettingsData> {
  const [devicesResult, branchesResult, zonesResult, linksResult] = await Promise.all([
    supabase
      .from("devices")
      .select(
        "id, restaurant_id, branch_id, zone_id, name, description, status, last_used_at, created_at, updated_at",
      )
      .order("name", { ascending: true }),
    supabase
      .from("branches")
      .select("id, restaurant_id, name, status")
      .order("name", { ascending: true }),
    supabase
      .from("zones")
      .select("id, restaurant_id, branch_id, name, status")
      .order("name", { ascending: true }),
    supabase
      .from("survey_links")
      .select(
        "id, device_id, status, token_last4, regenerated_at, last_used_at, created_at, updated_at",
      )
      .eq("type", "device")
      .order("created_at", { ascending: false }),
  ]);

  const error =
    devicesResult.error ?? branchesResult.error ?? zonesResult.error ?? linksResult.error;
  if (error) throw error;

  const branches = branchesResult.data ?? [];
  const zones = zonesResult.data ?? [];

  return {
    rows: combineDeviceSettingsRows(
      devicesResult.data ?? [],
      branches,
      zones,
      linksResult.data ?? [],
    ),
    branches,
    zones,
  };
}

export async function createDevice(
  supabase: SupabaseBrowserClient,
  draft: DeviceDraft,
  branches: DeviceBranch[],
  zones: DeviceZone[],
): Promise<DeviceRecord> {
  const payload = buildDeviceInsertPayload(draft, branches, zones);
  const { data, error } = await supabase
    .from("devices")
    .insert(payload)
    .select(
      "id, restaurant_id, branch_id, zone_id, name, description, status, last_used_at, created_at, updated_at",
    )
    .single();

  if (error) throw error;
  return data;
}

export async function updateDeviceStatus(
  supabase: SupabaseBrowserClient,
  deviceId: string,
  status: "active" | "inactive",
): Promise<void> {
  const { error } = await supabase
    .from("devices")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", deviceId);

  if (error) throw error;
}
