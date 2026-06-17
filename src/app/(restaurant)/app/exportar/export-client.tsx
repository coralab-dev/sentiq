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

import { FilterBar, FilterField, PageHeader, SectionCard } from "@/components/panel";
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
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:bg-slate-50 disabled:text-slate-400";

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

  const selectedBranchZones = useMemo(() => {
    if (filters.branchId === "all") {
      return data.zones;
    }

    return data.zones.filter((zone) => zone.branch_id === filters.branchId);
  }, [data.zones, filters.branchId]);

  const canExport = loadStatus === "success" && data.branches.length > 0 && !isExporting;

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
        title="Cargando exportacion"
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
        title="Exportar"
        description="Genera un CSV desde la Edge Function de exportacion, con permisos aplicados por rol."
        actions={
          <Button
            type="button"
            onClick={() => void loadData()}
            disabled={isRefreshing || isExporting}
            variant="outline"
            size="lg"
          >
            <RefreshCw
              className={cn("size-4", isRefreshing && "animate-spin")}
              aria-hidden="true"
            />
            Actualizar
          </Button>
        }
      />

      <SectionCard
        title="Filtros de exportacion"
        description="El archivo se genera en backend y solo incluye respuestas dentro de tu alcance."
        actions={
          <Button
            type="button"
            onClick={() => void exportCsv()}
            disabled={!canExport}
            className="bg-orange-600 text-white hover:bg-orange-700"
            size="lg"
          >
            {isExporting ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
            {isExporting ? "Generando" : "Generar CSV"}
          </Button>
        }
      >
        <div className="space-y-5">
          <FilterBar className="shadow-none">
            <FilterField label="Desde">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(event) => updateFilters({ dateFrom: event.target.value })}
                disabled={isExporting}
                className={inputClassName}
              />
            </FilterField>
            <FilterField label="Hasta">
              <input
                type="date"
                value={filters.dateTo}
                onChange={(event) => updateFilters({ dateTo: event.target.value })}
                disabled={isExporting}
                className={inputClassName}
              />
            </FilterField>
            <FilterField label="Sucursal">
              <select
                value={filters.branchId}
                onChange={(event) => updateFilters({ branchId: event.target.value })}
                disabled={isExporting || data.branches.length === 0}
                className={inputClassName}
              >
                <option value="all">Todas las sucursales</option>
                {data.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Zona">
              <select disabled value="all" className={inputClassName}>
                <option value="all">
                  {selectedBranchZones.length > 0
                    ? "Se habilitara en backend posterior"
                    : "Sin zonas visibles"}
                </option>
              </select>
            </FilterField>
            <FilterField label="Origen">
              <select
                value={filters.source}
                onChange={(event) =>
                  updateFilters({ source: event.target.value as SourceFilter })
                }
                disabled={isExporting}
                className={inputClassName}
              >
                <option value="all">Todos</option>
                <option value="qr">QR</option>
                <option value="device">Dispositivo</option>
              </select>
            </FilterField>
            <FilterField label="Alerta">
              <select
                value={filters.alertFilter}
                onChange={(event) =>
                  updateFilters({ alertFilter: event.target.value as AlertFilter })
                }
                disabled={isExporting}
                className={inputClassName}
              >
                <option value="all">Todas</option>
                <option value="with_alert">Con alerta</option>
                <option value="without_alert">Sin alerta</option>
              </select>
            </FilterField>
          </FilterBar>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-950">
                  Privacidad del archivo
                </p>
                <p className="text-sm leading-6 text-amber-900">
                  El CSV puede incluir telefonos solo cuando la respuesta tenga
                  consentimiento de contacto. No compartas este archivo fuera del
                  equipo autorizado del restaurante.
                </p>
              </div>
            </div>
          </div>

          {validationMessage ? (
            <MessageBox tone="error" message={validationMessage} />
          ) : null}

          {actionError ? <MessageBox tone="error" message={actionError} /> : null}

          {actionMessage ? <MessageBox tone="success" message={actionMessage} /> : null}
        </div>
      </SectionCard>

      {data.branches.length === 0 ? (
        <EmptyState
          title="Sin sucursales visibles"
          description="No hay sucursales activas disponibles para tu usuario. La exportacion no se puede generar sin alcance visible."
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
    return "Los filtros enviados no son validos. Revisa el rango y vuelve a intentar.";
  }

  if (context?.status === 401) {
    return "Tu sesion no esta autorizada. Vuelve a iniciar sesion.";
  }

  if (context?.status === 404) {
    return "No tienes permiso para exportar esos datos o el alcance no existe.";
  }

  return "No pudimos generar el CSV. Intenta de nuevo en unos momentos.";
}
