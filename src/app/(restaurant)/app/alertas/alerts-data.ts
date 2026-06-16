import type { AlertStatus, FeedbackSource } from "@/types/domain";
import type { Tables } from "@/types/supabase";

export type AlertsBranch = Pick<Tables<"branches">, "id" | "name" | "status">;
export type AlertsZone = Pick<Tables<"zones">, "id" | "branch_id" | "name" | "status">;

export type AlertRow = Pick<
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

export type AlertResponseRow = Pick<
  Tables<"feedback_responses">,
  "id" | "comment" | "customer_phone" | "consent_to_contact"
>;

export type AlertProfileRow = Pick<Tables<"user_profiles">, "id" | "full_name" | "email">;

export type DateRangeValue = {
  startDate: string;
  endDate: string;
};

export type AlertStatusFilter = "all" | AlertStatus;
export type AlertSourceFilter = "all" | FeedbackSource;

export type AlertFilters = {
  dateRange: DateRangeValue;
  branchId: string;
  zoneId: string;
  source: AlertSourceFilter;
  status: AlertStatusFilter;
};

export type EnrichedAlert = AlertRow & {
  response: AlertResponseRow | null;
  attendedByProfile: AlertProfileRow | null;
};

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

export function getDefaultDateRange(now = new Date()): DateRangeValue {
  const endDate = toDateInputValue(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 6);

  return {
    startDate: toDateInputValue(start),
    endDate,
  };
}

export function getDefaultAlertFilters(): AlertFilters {
  return {
    dateRange: getDefaultDateRange(),
    branchId: "all",
    zoneId: "all",
    source: "all",
    status: "all",
  };
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toDateRangeIso(range: DateRangeValue) {
  const start = new Date(`${range.startDate}T00:00:00`);
  const end = new Date(`${range.endDate}T23:59:59.999`);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export function enrichAlerts(
  alerts: AlertRow[],
  responses: AlertResponseRow[],
  profiles: AlertProfileRow[],
): EnrichedAlert[] {
  const responsesById = new Map(responses.map((response) => [response.id, response]));
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  return alerts.map((alert) => ({
    ...alert,
    response: responsesById.get(alert.response_id) ?? null,
    attendedByProfile: alert.attended_by
      ? profilesById.get(alert.attended_by) ?? null
      : null,
  }));
}

export function canShowPhone(
  response: Pick<AlertResponseRow, "customer_phone" | "consent_to_contact"> | null,
) {
  return Boolean(response?.customer_phone?.trim() && response.consent_to_contact);
}

export function formatPhone(response: AlertResponseRow | null) {
  return canShowPhone(response) ? response?.customer_phone : "--";
}

export function summarizeComment(comment: string | null | undefined, maxLength = 88): string {
  const normalized = comment?.trim();

  if (!normalized) {
    return "--";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "--";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatSource(source: string): string {
  return sourceLabels[source] ?? source;
}

export function getBranchName(branches: AlertsBranch[], branchId: string): string {
  return branches.find((branch) => branch.id === branchId)?.name ?? "Sucursal no disponible";
}

export function getZoneName(zones: AlertsZone[], zoneId: string | null): string {
  if (!zoneId) {
    return "--";
  }

  return zones.find((zone) => zone.id === zoneId)?.name ?? "Zona no disponible";
}

export function getAttendedByLabel(alert: EnrichedAlert): string {
  if (!alert.attended_at) {
    return "--";
  }

  return alert.attendedByProfile?.full_name ?? alert.attendedByProfile?.email ?? "Usuario no disponible";
}

export function getAlertMetrics(alerts: EnrichedAlert[]) {
  return {
    total: alerts.length,
    pending: alerts.filter((alert) => alert.status === "pending").length,
    attended: alerts.filter((alert) => alert.status === "attended").length,
  };
}
