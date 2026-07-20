"use client";

import {
  AlertTriangle,
  Download,
  FileDown,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { FilterField, PageHeader, SectionCard } from "@/components/panel";
import { EmptyState, LoadingState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ExportFeedbackCsvResponse } from "@/types/edge-functions";

import {
  buildExportRequest,
  downloadCsvFile,
  getDefaultExportFilters,
  loadExportFiltersData,
  validateExportFilters,
  type AlertFilter,
  type ExportBranch,
  type ExportFilters,
  type ExportZone,
  type SourceFilter,
} from "./export-data";

type LoadStatus = "loading" | "success" | "error";

type ExportDataState = {
  branches: ExportBranch[];
  zones: ExportZone[];
};

const inputClassName =
  "h-11 w-full rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 text-sm text-[var(--sq-ink)] outline-none transition focus:border-[var(--sq-coral)] focus:ring-2 focus:ring-[var(--sq-coral)]/15 disabled:bg-[var(--sq-soft)] disabled:text-[var(--sq-muted)]";

export function ExportClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [data, setData] = useState<ExportDataState>({ branches: [], zones: [] });
  const [filters, setFilters] = useState<ExportFilters>(() => getDefaultExportFilters());
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const nextData = await loadExportFiltersData(supabase);
      setData(nextData);
      setLoadStatus("success");
      setFilters((current) => ({
        ...current,
        branchId:
          current.branchId === "all" ||
          nextData.branches.some((branch) => branch.id === current.branchId)
            ? current.branchId
            : "all",
      }));
    } catch {
      setData({ branches: [], zones: [] });
      setLoadStatus("error");
    } finally {
      setIsRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const canExport = loadStatus === "success" && data.branches.length > 0 && !isExporting;
  const selectedBranchName = filters.branchId === "all"
    ? "Todas las sucursales"
    : data.branches.find((branch) => branch.id === filters.branchId)?.name ?? "Sucursal no disponible";

  function updateFilters(nextFilters: Partial<ExportFilters>) {
    setValidationMessage(null);
    setActionMessage(null);
    setActionError(null);
    setFilters((current) => ({
      ...current,
      ...nextFilters,
    }));
  }

  async function exportCsv() {
    const validationError = validateExportFilters(filters, data.branches);

    setActionMessage(null);
    setActionError(null);
    setValidationMessage(validationError);

    if (validationError) {
      return;
    }

    setIsExporting(true);

    try {
      const { data: result, error } =
        await supabase.functions.invoke<ExportFeedbackCsvResponse>("export_feedback_csv", {
          body: buildExportRequest(filters),
        });

      if (error || result?.ok !== true || !result.content || !result.filename) {
        throw error ?? new Error("Unexpected export response");
      }

      downloadCsvFile(result.filename, result.content);
      setActionMessage("Archivo CSV generado correctamente.");
    } catch (error) {
      setActionError(getExportErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  }

  if (loadStatus === "loading") {
    return (
      <LoadingState
        title="Cargando exportación"
        description="Estamos consultando las sucursales visibles para tu usuario."
      />
    );
  }

  if (loadStatus === "error") {
    return (
      <EmptyState
        title="No se pudieron cargar los filtros"
        description="Intenta actualizar en unos momentos."
        icon={<AlertTriangle className="size-6" aria-hidden="true" />}
        action={
          <Button type="button" onClick={() => void loadData()}>
            Reintentar
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Datos"
        title="Exportar"
        description="Prepara un archivo CSV con las respuestas que coincidan con el periodo y alcance seleccionados."
        actions={
          <Button
            type="button"
            onClick={() => void loadData()}
            disabled={isRefreshing || isExporting}
            variant="outline"
            size="lg"
            className="px-4"
          >
            <RefreshCw
              className={cn("size-4", isRefreshing && "animate-spin")}
              aria-hidden="true"
            />
            Actualizar
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <SectionCard title="Filtros del archivo" description="Define qué respuestas quieres incluir.">
          <div className="grid gap-5 sm:grid-cols-2">
            <FilterField label="Desde">
              <input type="date" value={filters.dateFrom} onChange={(event) => updateFilters({ dateFrom: event.target.value })} disabled={isExporting} className={inputClassName} />
            </FilterField>
            <FilterField label="Hasta">
              <input type="date" value={filters.dateTo} onChange={(event) => updateFilters({ dateTo: event.target.value })} disabled={isExporting} className={inputClassName} />
            </FilterField>
            <FilterField label="Sucursal">
              <select value={filters.branchId} onChange={(event) => updateFilters({ branchId: event.target.value })} disabled={isExporting || data.branches.length === 0} className={inputClassName}>
                <option value="all">Todas las sucursales</option>
                {data.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
            </FilterField>
            <FilterField label="Origen">
              <select value={filters.source} onChange={(event) => updateFilters({ source: event.target.value as SourceFilter })} disabled={isExporting} className={inputClassName}>
                <option value="all">Todos</option><option value="qr">QR</option><option value="device">Dispositivo</option>
              </select>
            </FilterField>
            <FilterField label="Alerta">
              <select value={filters.alertFilter} onChange={(event) => updateFilters({ alertFilter: event.target.value as AlertFilter })} disabled={isExporting} className={inputClassName}>
                <option value="all">Todas</option><option value="with_alert">Con alerta</option><option value="without_alert">Sin alerta</option>
              </select>
            </FilterField>
          </div>
        </SectionCard>

        <SectionCard title="Resumen del archivo" description="Confirma el alcance antes de generar el CSV.">
          <div className="space-y-5">
            <dl className="divide-y divide-[var(--sq-line)] border-y border-[var(--sq-line)]">
              <ExportSummaryRow label="Periodo" value={`${filters.dateFrom} – ${filters.dateTo}`} />
              <ExportSummaryRow label="Sucursal" value={selectedBranchName} />
              <ExportSummaryRow label="Origen" value={filters.source === "all" ? "Todos" : filters.source === "qr" ? "QR" : "Dispositivo"} />
              <ExportSummaryRow label="Alertas" value={filters.alertFilter === "all" ? "Todas" : filters.alertFilter === "with_alert" ? "Con alerta" : "Sin alerta"} />
            </dl>

            <div className="rounded-xl bg-[var(--sq-soft)] p-4">
              <div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--sq-olive)]" aria-hidden="true" /><div><p className="text-sm font-semibold text-[var(--sq-ink)]">Privacidad del archivo</p><p className="mt-1 text-sm leading-6 text-[var(--sq-muted)]">Solo se incluyen teléfonos cuando existe consentimiento. Comparte el archivo únicamente con el equipo autorizado.</p></div></div>
            </div>

            {validationMessage ? <MessageBox tone="error" message={validationMessage} /> : null}
            {actionError ? <MessageBox tone="error" message={actionError} /> : null}
            {actionMessage ? <MessageBox tone="success" message={actionMessage} /> : null}

            <Button type="button" onClick={() => void exportCsv()} disabled={!canExport} className="w-full bg-[var(--sq-coral)] px-4 text-white hover:bg-[#e94b3a]" size="lg">
              {isExporting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
              {isExporting ? "Generando..." : "Generar CSV"}
            </Button>
          </div>
        </SectionCard>
      </div>

      {data.branches.length === 0 ? (
        <EmptyState
          title="Sin sucursales visibles"
          description="No hay sucursales activas disponibles para tu usuario. La exportación no se puede generar sin alcance visible."
          icon={<FileDown className="size-6" aria-hidden="true" />}
        />
      ) : null}
    </div>
  );
}

function MessageBox({ tone, message }: { tone: "success" | "error"; message: string }) {
  const isSuccess = tone === "success";

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm font-medium",
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800",
      )}
    >
      {message}
    </div>
  );
}

function getExportErrorMessage(error: unknown): string {
  const context = error && typeof error === "object" && "context" in error
    ? (error as { context?: { status?: number } }).context
    : undefined;

  if (context?.status === 400) {
    return "Los filtros enviados no son válidos. Revisa el rango y vuelve a intentar.";
  }

  if (context?.status === 401) {
    return "Tu sesión no está autorizada. Vuelve a iniciar sesión.";
  }

  if (context?.status === 404) {
    return "No tienes permiso para exportar esos datos o el alcance no existe.";
  }

  return "No pudimos generar el CSV. Intenta de nuevo en unos momentos.";
}



function ExportSummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 py-3 text-sm"><dt className="text-[var(--sq-muted)]">{label}</dt><dd className="text-right font-semibold text-[var(--sq-ink)]">{value}</dd></div>;
}
