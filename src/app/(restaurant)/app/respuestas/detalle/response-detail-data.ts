import type { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/supabase";

export type ResponseDetailRow = Pick<
  Tables<"feedback_responses">,
  | "id"
  | "restaurant_id"
  | "branch_id"
  | "zone_id"
  | "device_id"
  | "survey_link_id"
  | "source"
  | "general_experience"
  | "service_attention"
  | "food_quality"
  | "service_speed"
  | "comment"
  | "customer_phone"
  | "consent_to_contact"
  | "consent_text_snapshot"
  | "has_alert"
  | "created_at"
>;

export type ResponseDetailAlert = Pick<
  Tables<"feedback_alerts">,
  | "id"
  | "status"
  | "created_at"
  | "updated_at"
  | "attended_at"
  | "internal_note"
>;

export type ResponseDetailBranch = Pick<Tables<"branches">, "id" | "name">;
export type ResponseDetailZone = Pick<Tables<"zones">, "id" | "name">;

export type ResponseDetail = {
  response: ResponseDetailRow;
  alert: ResponseDetailAlert | null;
  branch: ResponseDetailBranch | null;
  zone: ResponseDetailZone | null;
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
  response: Pick<ResponseDetailRow, "customer_phone" | "consent_to_contact">,
) {
  return Boolean(response.customer_phone?.trim() && response.consent_to_contact);
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

export async function loadResponseDetail(
  supabase: SupabaseBrowserClient,
  responseId: string,
): Promise<ResponseDetail | null> {
  const { data: response, error: responseError } = await supabase
    .from("feedback_responses")
    .select(
      "id, restaurant_id, branch_id, zone_id, device_id, survey_link_id, source, general_experience, service_attention, food_quality, service_speed, comment, customer_phone, consent_to_contact, consent_text_snapshot, has_alert, created_at",
    )
    .eq("id", responseId)
    .maybeSingle();

  if (responseError) {
    throw responseError;
  }

  if (!response) {
    return null;
  }

  const alertRequest = supabase
    .from("feedback_alerts")
    .select("id, status, created_at, updated_at, attended_at, internal_note")
    .eq("response_id", response.id)
    .maybeSingle();

  const branchRequest = supabase
    .from("branches")
    .select("id, name")
    .eq("id", response.branch_id)
    .maybeSingle();

  const zoneRequest = response.zone_id
    ? supabase
        .from("zones")
        .select("id, name")
        .eq("id", response.zone_id)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [alertResult, branchResult, zoneResult] = await Promise.all([
    alertRequest,
    branchRequest,
    zoneRequest,
  ]);

  if (alertResult.error) throw alertResult.error;
  if (branchResult.error) throw branchResult.error;
  if (zoneResult.error) throw zoneResult.error;

  return {
    response,
    alert: alertResult.data,
    branch: branchResult.data,
    zone: zoneResult.data,
  };
}
