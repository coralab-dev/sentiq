import type { Tables } from "@/types/supabase";

export type ResponsesBranch = Pick<Tables<"branches">, "id" | "name" | "status">;
export type ResponsesZone = Pick<Tables<"zones">, "id" | "branch_id" | "name" | "status">;

export type FeedbackResponseRow = Pick<
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
  | "customer_phone"
  | "consent_to_contact"
  | "has_alert"
  | "created_at"
>;

export type DateRangeValue = {
  startDate: string;
  endDate: string;
};

export type SourceFilter = "all" | "qr" | "device";
export type LowRatingFilter = "all" | "lte3" | "lte2";
export type CommentFilter = "all" | "with_comment" | "without_comment";
export type PhoneFilter = "all" | "with_phone" | "without_phone";
export type AlertFilter = "all" | "with_alert" | "without_alert";

export type ResponseFilters = {
  dateRange: DateRangeValue;
  branchId: string;
  zoneId: string;
  source: SourceFilter;
  lowRating: LowRatingFilter;
  comment: CommentFilter;
  phone: PhoneFilter;
  alert: AlertFilter;
};

export const pageSizeOptions = [10, 20] as const;
export type PageSize = (typeof pageSizeOptions)[number];

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

export function getDefaultResponseFilters(): ResponseFilters {
  return {
    dateRange: getDefaultDateRange(),
    branchId: "all",
    zoneId: "all",
    source: "all",
    lowRating: "all",
    comment: "all",
    phone: "all",
    alert: "all",
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

export function filterResponses(
  responses: FeedbackResponseRow[],
  filters: ResponseFilters,
): FeedbackResponseRow[] {
  return responses.filter((response) => {
    if (filters.branchId !== "all" && response.branch_id !== filters.branchId) {
      return false;
    }

    if (filters.zoneId !== "all" && response.zone_id !== filters.zoneId) {
      return false;
    }

    if (filters.source !== "all" && response.source !== filters.source) {
      return false;
    }

    if (filters.lowRating === "lte3" && response.general_experience > 3) {
      return false;
    }

    if (filters.lowRating === "lte2" && response.general_experience > 2) {
      return false;
    }

    if (filters.comment === "with_comment" && !hasComment(response)) {
      return false;
    }

    if (filters.comment === "without_comment" && hasComment(response)) {
      return false;
    }

    if (filters.phone === "with_phone" && !canShowPhone(response)) {
      return false;
    }

    if (filters.phone === "without_phone" && canShowPhone(response)) {
      return false;
    }

    if (filters.alert === "with_alert" && !response.has_alert) {
      return false;
    }

    if (filters.alert === "without_alert" && response.has_alert) {
      return false;
    }

    return true;
  });
}

export function paginateResponses(
  responses: FeedbackResponseRow[],
  page: number,
  pageSize: PageSize,
) {
  const totalPages = Math.max(1, Math.ceil(responses.length / pageSize));
  const normalizedPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (normalizedPage - 1) * pageSize;

  return {
    page: normalizedPage,
    totalPages,
    rows: responses.slice(startIndex, startIndex + pageSize),
    startItem: responses.length === 0 ? 0 : startIndex + 1,
    endItem: Math.min(startIndex + pageSize, responses.length),
  };
}

export function canShowPhone(response: Pick<FeedbackResponseRow, "customer_phone" | "consent_to_contact">) {
  return Boolean(response.customer_phone?.trim() && response.consent_to_contact);
}

export function formatPhone(response: Pick<FeedbackResponseRow, "customer_phone" | "consent_to_contact">) {
  return canShowPhone(response) ? response.customer_phone : "--";
}

export function hasComment(response: Pick<FeedbackResponseRow, "comment">) {
  return Boolean(response.comment?.trim());
}

export function summarizeComment(comment: string | null, maxLength = 88): string {
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

export function getBranchName(
  branches: ResponsesBranch[],
  branchId: string,
): string {
  return branches.find((branch) => branch.id === branchId)?.name ?? "Sucursal no disponible";
}

export function getZoneName(
  zones: ResponsesZone[],
  zoneId: string | null,
): string {
  if (!zoneId) {
    return "--";
  }

  return zones.find((zone) => zone.id === zoneId)?.name ?? "Zona no disponible";
}

export function clampRating(value: number): 1 | 2 | 3 | 4 | 5 {
  if (value <= 1) return 1;
  if (value >= 5) return 5;

  return Math.round(value) as 1 | 2 | 3 | 4 | 5;
}
