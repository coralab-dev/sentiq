import type { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ExportFeedbackCsvRequest } from "@/types/edge-functions";
import type { FeedbackSource } from "@/types/domain";
import type { Tables } from "@/types/supabase";

export type ExportBranch = Pick<Tables<"branches">, "id" | "name" | "status">;
export type ExportZone = Pick<Tables<"zones">, "id" | "branch_id" | "name" | "status">;

export type SourceFilter = "all" | FeedbackSource;
export type AlertFilter = "all" | "with_alert" | "without_alert";

export type ExportFilters = {
  dateFrom: string;
  dateTo: string;
  branchId: string;
  source: SourceFilter;
  alertFilter: AlertFilter;
};

type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 90;

export function getDefaultExportFilters(now = new Date()): ExportFilters {
  const endDate = toDateInputValue(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 6);

  return {
    dateFrom: toDateInputValue(start),
    dateTo: endDate,
    branchId: "all",
    source: "all",
    alertFilter: "all",
  };
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function validateExportFilters(
  filters: ExportFilters,
  visibleBranches: ExportBranch[],
): string | null {
  if (!isValidDateInput(filters.dateFrom)) {
    return "Selecciona una fecha inicial valida.";
  }

  if (!isValidDateInput(filters.dateTo)) {
    return "Selecciona una fecha final valida.";
  }

  const startDate = new Date(`${filters.dateFrom}T00:00:00.000`);
  const endDate = new Date(`${filters.dateTo}T00:00:00.000`);

  if (startDate.getTime() > endDate.getTime()) {
    return "La fecha inicial no puede ser posterior a la fecha final.";
  }

  const rangeDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;

  if (rangeDays > MAX_RANGE_DAYS) {
    return "El rango máximo de exportación es de 90 días.";
  }

  if (
    filters.branchId !== "all" &&
    (!UUID_PATTERN.test(filters.branchId) ||
      !visibleBranches.some((branch) => branch.id === filters.branchId))
  ) {
    return "Selecciona una sucursal valida.";
  }

  if (filters.source !== "all" && filters.source !== "qr" && filters.source !== "device") {
    return "Selecciona un origen valido.";
  }

  if (
    filters.alertFilter !== "all" &&
    filters.alertFilter !== "with_alert" &&
    filters.alertFilter !== "without_alert"
  ) {
    return "Selecciona un filtro de alerta valido.";
  }

  return null;
}

export function buildExportRequest(filters: ExportFilters): ExportFeedbackCsvRequest {
  return {
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
    branch_id: filters.branchId === "all" ? undefined : filters.branchId,
    source: filters.source === "all" ? undefined : filters.source,
    has_alert:
      filters.alertFilter === "all"
        ? undefined
        : filters.alertFilter === "with_alert",
  };
}

export async function loadExportFiltersData(supabase: SupabaseBrowserClient) {
  const [branchesResult, zonesResult] = await Promise.all([
    supabase
      .from("branches")
      .select("id, name, status")
      .eq("status", "active")
      .order("name", { ascending: true })
      .returns<ExportBranch[]>(),
    supabase
      .from("zones")
      .select("id, branch_id, name, status")
      .eq("status", "active")
      .order("name", { ascending: true })
      .returns<ExportZone[]>(),
  ]);

  if (branchesResult.error) throw branchesResult.error;
  if (zonesResult.error) throw zonesResult.error;

  return {
    branches: branchesResult.data ?? [],
    zones: zonesResult.data ?? [],
  };
}

export function downloadCsvFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function isValidDateInput(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000`);
  return !Number.isNaN(date.getTime()) && toDateInputValue(date) === value;
}
