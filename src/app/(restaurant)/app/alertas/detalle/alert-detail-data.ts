import type { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/supabase";

export type AlertDetailRow = Pick<
  Tables<"feedback_alerts">,
  | "id"
  | "restaurant_id"
  | "branch_id"
  | "zone_id"
  | "device_id"
  | "response_id"
  | "source"
  | "general_experience"
  | "status"
  | "attended_by"
  | "attended_at"
  | "internal_note"
  | "created_at"
  | "updated_at"
>;

export type AlertDetailResponse = Pick<
  Tables<"feedback_responses">,
  | "id"
  | "created_at"
  | "branch_id"
  | "zone_id"
  | "source"
  | "general_experience"
  | "service_attention"
  | "food_quality"
  | "service_speed"
  | "comment"
  | "customer_phone"
  | "consent_to_contact"
  | "consent_text_snapshot"
>;

export type AlertDetailBranch = Pick<Tables<"branches">, "id" | "name">;
export type AlertDetailZone = Pick<Tables<"zones">, "id" | "name">;
export type AlertDetailDevice = Pick<Tables<"devices">, "id" | "name">;
export type AlertDetailProfile = Pick<Tables<"user_profiles">, "id" | "full_name" | "email">;

export type AlertDetail = {
  alert: AlertDetailRow;
  response: AlertDetailResponse | null;
  branch: AlertDetailBranch | null;
  zone: AlertDetailZone | null;
  device: AlertDetailDevice | null;
  attendedByProfile: AlertDetailProfile | null;
};

type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>;

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const sourceLabels: Record<string, string> = {
  qr: "QR",
  device: "Dispositivo",
};

export function isValidUuid(value: string | null): value is string {
  return Boolean(
    value?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ),
  );
}

export function canShowPhone(
  response: Pick<AlertDetailResponse, "customer_phone" | "consent_to_contact"> | null,
) {
  return Boolean(response?.customer_phone?.trim() && response.consent_to_contact);
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "No disponible";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatSource(source: string): string {
  return sourceLabels[source] ?? source;
}

export function clampRating(value: number): 1 | 2 | 3 | 4 | 5 {
  if (value <= 1) return 1;
  if (value >= 5) return 5;

  return Math.round(value) as 1 | 2 | 3 | 4 | 5;
}

export function getAttendedByLabel(detail: AlertDetail): string {
  if (!detail.alert.attended_at) {
    return "No disponible";
  }

  return (
    detail.attendedByProfile?.full_name ??
    detail.attendedByProfile?.email ??
    "Usuario no disponible"
  );
}

export async function loadAlertDetail(
  supabase: SupabaseBrowserClient,
  alertId: string,
): Promise<AlertDetail | null> {
  const { data: alert, error: alertError } = await supabase
    .from("feedback_alerts")
    .select(
      "id, restaurant_id, branch_id, zone_id, device_id, response_id, source, general_experience, status, attended_by, attended_at, internal_note, created_at, updated_at",
    )
    .eq("id", alertId)
    .maybeSingle();

  if (alertError) {
    throw alertError;
  }

  if (!alert) {
    return null;
  }

  const responseRequest = supabase
    .from("feedback_responses")
    .select(
      "id, created_at, branch_id, zone_id, source, general_experience, service_attention, food_quality, service_speed, comment, customer_phone, consent_to_contact, consent_text_snapshot",
    )
    .eq("id", alert.response_id)
    .maybeSingle();

  const branchRequest = supabase
    .from("branches")
    .select("id, name")
    .eq("id", alert.branch_id)
    .maybeSingle();

  const zoneRequest = alert.zone_id
    ? supabase.from("zones").select("id, name").eq("id", alert.zone_id).maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const deviceRequest = alert.device_id
    ? supabase.from("devices").select("id, name").eq("id", alert.device_id).maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const profileRequest = alert.attended_by
    ? supabase
        .from("user_profiles")
        .select("id, full_name, email")
        .eq("id", alert.attended_by)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [responseResult, branchResult, zoneResult, deviceResult, profileResult] =
    await Promise.all([
      responseRequest,
      branchRequest,
      zoneRequest,
      deviceRequest,
      profileRequest,
    ]);

  if (responseResult.error) throw responseResult.error;
  if (branchResult.error) throw branchResult.error;
  if (zoneResult.error) throw zoneResult.error;
  if (deviceResult.error) throw deviceResult.error;

  return {
    alert,
    response: responseResult.data,
    branch: branchResult.data,
    zone: zoneResult.data,
    device: deviceResult.data,
    attendedByProfile: profileResult.error ? null : profileResult.data,
  };
}
