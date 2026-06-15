import type { Tables } from "@/types/supabase";

export type DashboardBranch = Pick<Tables<"branches">, "id" | "name" | "status">;
export type DashboardZone = Pick<Tables<"zones">, "id" | "branch_id" | "name" | "status">;

export type DashboardResponse = Pick<
  Tables<"feedback_responses">,
  | "id"
  | "branch_id"
  | "zone_id"
  | "source"
  | "general_experience"
  | "service_attention"
  | "food_quality"
  | "service_speed"
  | "comment"
  | "created_at"
  | "has_alert"
>;

export type DashboardAlert = Pick<
  Tables<"feedback_alerts">,
  | "id"
  | "branch_id"
  | "zone_id"
  | "source"
  | "general_experience"
  | "status"
  | "created_at"
>;

export type DashboardMetrics = {
  totalResponses: number;
  generalExperience: number | null;
  serviceAttention: number | null;
  foodQuality: number | null;
  serviceSpeed: number | null;
  pendingAlerts: number;
};

export type DateRangeValue = {
  startDate: string;
  endDate: string;
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const relativeFormatter = new Intl.RelativeTimeFormat("es-MX", {
  numeric: "auto",
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

export function calculateDashboardMetrics(
  responses: DashboardResponse[],
  alerts: DashboardAlert[],
): DashboardMetrics {
  return {
    totalResponses: responses.length,
    generalExperience: average(responses.map((row) => row.general_experience)),
    serviceAttention: average(responses.map((row) => row.service_attention)),
    foodQuality: average(responses.map((row) => row.food_quality)),
    serviceSpeed: average(responses.map((row) => row.service_speed)),
    pendingAlerts: alerts.filter((alert) => alert.status === "pending").length,
  };
}

export function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
}

export function formatMetricAverage(value: number | null): string {
  return value === null ? "--" : value.toFixed(1);
}

export function formatDate(value: string | null): string {
  if (!value) {
    return "--";
  }

  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "--";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatRelativeDate(value: string | null, now = new Date()): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(diffMinutes, "minute");
  }

  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, "hour");
  }

  return relativeFormatter.format(diffDays, "day");
}

export function formatSource(source: string): string {
  return sourceLabels[source] ?? source;
}

export function getBranchName(
  branches: DashboardBranch[],
  branchId: string,
): string {
  return branches.find((branch) => branch.id === branchId)?.name ?? "Sucursal no disponible";
}

export function getZoneName(
  zones: DashboardZone[],
  zoneId: string | null,
): string {
  if (!zoneId) {
    return "--";
  }

  return zones.find((zone) => zone.id === zoneId)?.name ?? "Zona no disponible";
}

export function summarizeComment(comment: string | null, maxLength = 96): string {
  const normalized = comment?.trim();

  if (!normalized) {
    return "--";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

export function clampRating(value: number): 1 | 2 | 3 | 4 | 5 {
  if (value <= 1) return 1;
  if (value >= 5) return 5;

  return Math.round(value) as 1 | 2 | 3 | 4 | 5;
}
