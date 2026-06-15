"use client";

import {
  AlertTriangle,
  CalendarDays,
  Eye,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DataTable,
  FilterBar,
  FilterField,
  MetricCard,
  PageHeader,
  RatingScore,
  SectionCard,
} from "@/components/panel";
import { EmptyState, LoadingState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import {
  clampRating,
  filterResponses,
  formatDateTime,
  formatPhone,
  formatSource,
  getBranchName,
  getDefaultResponseFilters,
  getZoneName,
  pageSizeOptions,
  paginateResponses,
  summarizeComment,
  toDateRangeIso,
  type FeedbackResponseRow,
  type PageSize,
  type ResponseFilters,
  type ResponsesBranch,
  type ResponsesZone,
} from "./responses-data";

const inputClassName =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:bg-slate-50 disabled:text-slate-400";

type ResponsesLoadState = {
  branches: ResponsesBranch[];
  zones: ResponsesZone[];
  responses: FeedbackResponseRow[];
  lastUpdatedAt: Date | null;
};

const initialData: ResponsesLoadState = {
  branches: [],
  zones: [],
  responses: [],
  lastUpdatedAt: null,
};

export function ResponsesClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [filters, setFilters] = useState<ResponseFilters>(() =>
    getDefaultResponseFilters(),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [data, setData] = useState<ResponsesLoadState>(initialData);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadResponses = useCallback(async () => {
    setErrorMessage(null);
    setIsRefreshing(true);

    try {
      const { startIso, endIso } = toDateRangeIso(filters.dateRange);

      const branchesRequest = supabase
        .from("branches")
        .select("id, name, status")
        .eq("status", "active")
        .order("name", { ascending: true });

      const zonesRequest = supabase
        .from("zones")
        .select("id, branch_id, name, status")
        .eq("status", "active")
        .order("name", { ascending: true });

      let responsesRequest = supabase
        .from("feedback_responses")
        .select(
          "id, branch_id, zone_id, source, general_experience, service_attention, food_quality, service_speed, comment, customer_phone, consent_to_contact, has_alert, created_at",
        )
        .gte("created_at", startIso)
        .lte("created_at", endIso)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (filters.branchId !== "all") {
        responsesRequest = responsesRequest.eq("branch_id", filters.branchId);
      }

      if (filters.zoneId !== "all") {
        responsesRequest = responsesRequest.eq("zone_id", filters.zoneId);
      }

      if (filters.source !== "all") {
        responsesRequest = responsesRequest.eq("source", filters.source);
      }

      if (filters.lowRating === "lte3") {
        responsesRequest = responsesRequest.lte("general_experience", 3);
      }

      if (filters.lowRating === "lte2") {
        responsesRequest = responsesRequest.lte("general_experience", 2);
      }

      if (filters.alert === "with_alert") {
        responsesRequest = responsesRequest.eq("has_alert", true);
      }

      if (filters.alert === "without_alert") {
        responsesRequest = responsesRequest.eq("has_alert", false);
      }

      const [branchesResult, zonesResult, responsesResult] = await Promise.all([
        branchesRequest,
        zonesRequest,
        responsesRequest,
      ]);

      if (branchesResult.error) throw branchesResult.error;
      if (zonesResult.error) throw zonesResult.error;
      if (responsesResult.error) throw responsesResult.error;

      const visibleBranches = branchesResult.data ?? [];
      const selectedBranchIsVisible =
        filters.branchId === "all" ||
        visibleBranches.some((branch) => branch.id === filters.branchId);

      if (!selectedBranchIsVisible) {
        setFilters((current) => ({
          ...current,
          branchId: "all",
          zoneId: "all",
        }));
      }

      setData({
        branches: visibleBranches,
        zones: zonesResult.data ?? [],
        responses: responsesResult.data ?? [],
        lastUpdatedAt: new Date(),
      });
      setPage(1);
    } catch {
      setErrorMessage(
        "No pudimos cargar las respuestas. Intenta actualizar en unos momentos.",
      );
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [filters.alert, filters.branchId, filters.dateRange, filters.lowRating, filters.source, filters.zoneId, supabase]);

  useEffect(() => {
    void loadResponses();
  }, [loadResponses]);

  useEffect(() => {
    setPage(1);
  }, [filters.comment, filters.phone, pageSize]);

  const filteredResponses = useMemo(
    () => filterResponses(data.responses, filters),
    [data.responses, filters],
  );

  const pagination = useMemo(
    () => paginateResponses(filteredResponses, page, pageSize),
    [filteredResponses, page, pageSize],
  );

  const visibleZones = useMemo(() => {
    if (filters.branchId === "all") {
      return data.zones;
    }

    return data.zones.filter((zone) => zone.branch_id === filters.branchId);
  }, [data.zones, filters.branchId]);

  const branchSelectDisabled = data.branches.length <= 1 || isRefreshing;
  const showNoBranchesState = !isInitialLoading && !errorMessage && data.branches.length === 0;
  const showEmptyState =
    !isInitialLoading &&
    !errorMessage &&
    data.branches.length > 0 &&
    filteredResponses.length === 0;

  function updateFilters(nextFilters: Partial<ResponseFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
    }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(getDefaultResponseFilters());
    setPage(1);
  }

  if (isInitialLoading) {
    return (
      <LoadingState
        title="Cargando respuestas"
        description="Estamos consultando respuestas y sucursales visibles."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Respuestas"
        description="Listado real de feedback visible para tu usuario, filtrado por RLS y permisos."
        actions={
          <Button
            type="button"
            onClick={() => void loadResponses()}
            disabled={isRefreshing}
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            <RefreshCw
              className={cn("size-4", isRefreshing && "animate-spin")}
              aria-hidden="true"
            />
            Actualizar
          </Button>
        }
      />

      <FilterBar
        className="[&>div:first-child]:lg:grid-cols-4 xl:[&>div:first-child]:grid-cols-8"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {data.lastUpdatedAt ? (
              <p className="text-xs text-slate-500">
                Ultima actualizacion: {formatDateTime(data.lastUpdatedAt.toISOString())}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              disabled={isRefreshing}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Limpiar
            </Button>
          </div>
        }
      >
        <FilterField label="Desde">
          <input
            type="date"
            value={filters.dateRange.startDate}
            max={filters.dateRange.endDate}
            disabled={isRefreshing}
            onChange={(event) =>
              updateFilters({
                dateRange: {
                  ...filters.dateRange,
                  startDate: event.target.value,
                },
              })
            }
            className={inputClassName}
          />
        </FilterField>
        <FilterField label="Hasta">
          <input
            type="date"
            value={filters.dateRange.endDate}
            min={filters.dateRange.startDate}
            disabled={isRefreshing}
            onChange={(event) =>
              updateFilters({
                dateRange: {
                  ...filters.dateRange,
                  endDate: event.target.value,
                },
              })
            }
            className={inputClassName}
          />
        </FilterField>
        <FilterField label="Sucursal">
          <select
            value={data.branches.length === 1 ? data.branches[0]?.id : filters.branchId}
            disabled={branchSelectDisabled}
            onChange={(event) =>
              updateFilters({
                branchId: event.target.value,
                zoneId: "all",
              })
            }
            className={inputClassName}
          >
            {data.branches.length > 1 ? (
              <option value="all">Todas</option>
            ) : null}
            {data.branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Zona">
          <select
            value={filters.zoneId}
            disabled={visibleZones.length === 0 || isRefreshing}
            onChange={(event) => updateFilters({ zoneId: event.target.value })}
            className={inputClassName}
          >
            <option value="all">Todas</option>
            {visibleZones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Origen">
          <select
            value={filters.source}
            disabled={isRefreshing}
            onChange={(event) =>
              updateFilters({ source: event.target.value as ResponseFilters["source"] })
            }
            className={inputClassName}
          >
            <option value="all">Todos</option>
            <option value="qr">QR</option>
            <option value="device">Dispositivo</option>
          </select>
        </FilterField>
        <FilterField label="Calificacion">
          <select
            value={filters.lowRating}
            disabled={isRefreshing}
            onChange={(event) =>
              updateFilters({ lowRating: event.target.value as ResponseFilters["lowRating"] })
            }
            className={inputClassName}
          >
            <option value="all">Todas</option>
            <option value="lte3">Experiencia &lt;= 3</option>
            <option value="lte2">Experiencia &lt;= 2</option>
          </select>
        </FilterField>
        <FilterField label="Comentario">
          <select
            value={filters.comment}
            disabled={isRefreshing}
            onChange={(event) =>
              updateFilters({ comment: event.target.value as ResponseFilters["comment"] })
            }
            className={inputClassName}
          >
            <option value="all">Todos</option>
            <option value="with_comment">Con comentario</option>
            <option value="without_comment">Sin comentario</option>
          </select>
        </FilterField>
        <FilterField label="Telefono">
          <select
            value={filters.phone}
            disabled={isRefreshing}
            onChange={(event) =>
              updateFilters({ phone: event.target.value as ResponseFilters["phone"] })
            }
            className={inputClassName}
          >
            <option value="all">Todos</option>
            <option value="with_phone">Con telefono consentido</option>
            <option value="without_phone">Sin telefono</option>
          </select>
        </FilterField>
      </FilterBar>

      <FilterBar className="[&>div:first-child]:lg:grid-cols-3">
        <FilterField label="Alerta">
          <select
            value={filters.alert}
            disabled={isRefreshing}
            onChange={(event) =>
              updateFilters({ alert: event.target.value as ResponseFilters["alert"] })
            }
            className={inputClassName}
          >
            <option value="all">Todas</option>
            <option value="with_alert">Con alerta</option>
            <option value="without_alert">Sin alerta</option>
          </select>
        </FilterField>
        <FilterField label="Filas">
          <select
            value={pageSize}
            disabled={isRefreshing}
            onChange={(event) => setPageSize(Number(event.target.value) as PageSize)}
            className={inputClassName}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} por pagina
              </option>
            ))}
          </select>
        </FilterField>
      </FilterBar>

      {errorMessage ? (
        <EmptyState
          title="No se pudieron cargar las respuestas"
          description={errorMessage}
          icon={<AlertTriangle className="size-6" aria-hidden="true" />}
          action={
            <Button type="button" onClick={() => void loadResponses()}>
              Reintentar
            </Button>
          }
        />
      ) : null}

      {showNoBranchesState ? (
        <EmptyState
          title="No hay sucursales visibles"
          description="Tu usuario no tiene sucursales disponibles para consultar respuestas."
          icon={<Store className="size-6" aria-hidden="true" />}
        />
      ) : null}

      {!errorMessage && data.branches.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Respuestas filtradas"
              value={filteredResponses.length}
              helper={`De ${data.responses.length} cargadas`}
              variant="success"
              icon={<MessageSquareText className="size-5" aria-hidden="true" />}
            />
            <MetricCard
              label="Con alerta"
              value={filteredResponses.filter((response) => response.has_alert).length}
              helper="Dentro de filtros actuales"
              variant="warning"
              icon={<AlertTriangle className="size-5" aria-hidden="true" />}
            />
            <MetricCard
              label="Rango"
              value={`${filters.dateRange.startDate}`}
              helper={`Hasta ${filters.dateRange.endDate}`}
              variant="neutral"
              icon={<CalendarDays className="size-5" aria-hidden="true" />}
            />
          </div>

          <SectionCard
            title="Respuestas recientes"
            description="No se muestran nombres, emails ni telefonos sin consentimiento."
            contentClassName="p-0"
          >
            <DataTable
              columns={[
                { key: "fecha", header: "Fecha" },
                { key: "sucursal", header: "Sucursal" },
                { key: "zona", header: "Zona" },
                { key: "origen", header: "Origen" },
                { key: "general", header: "Experiencia" },
                { key: "atencion", header: "Atencion" },
                { key: "alimentos", header: "Alimentos" },
                { key: "rapidez", header: "Rapidez" },
                { key: "comentario", header: "Comentario" },
                { key: "telefono", header: "Telefono" },
                { key: "alerta", header: "Alerta" },
              ]}
              rows={pagination.rows.map((response) => ({
                id: response.id,
                cells: {
                  fecha: formatDateTime(response.created_at),
                  sucursal: getBranchName(data.branches, response.branch_id),
                  zona: getZoneName(data.zones, response.zone_id),
                  origen: formatSource(response.source),
                  general: <RatingScore value={clampRating(response.general_experience)} />,
                  atencion: <RatingScore value={clampRating(response.service_attention)} />,
                  alimentos: <RatingScore value={clampRating(response.food_quality)} />,
                  rapidez: <RatingScore value={clampRating(response.service_speed)} />,
                  comentario: (
                    <span className="block max-w-56 whitespace-normal">
                      {summarizeComment(response.comment)}
                    </span>
                  ),
                  telefono: formatPhone(response),
                  alerta: response.has_alert ? (
                    <StatusBadge status="pending" label="Con alerta" />
                  ) : (
                    <StatusBadge status="completed" label="Sin alerta" />
                  ),
                },
                actions: (
                  <Link
                    href={`${ROUTES.APP_RESPONSES}/${response.id}`}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Eye className="size-3.5" aria-hidden="true" />
                    Ver detalle
                  </Link>
                ),
              }))}
              actionsHeader="Accion"
              emptyState={
                <EmptyState
                  title="No hay respuestas para estos filtros"
                  description="Ajusta el rango, sucursal u otros filtros para consultar otra vista."
                  className="rounded-none border-0"
                />
              }
              className="rounded-none border-0 shadow-none"
            />
          </SectionCard>

          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Mostrando {pagination.startItem}-{pagination.endItem} de{" "}
              {filteredResponses.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm font-medium text-slate-700">
                Pagina {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPage((current) => Math.min(pagination.totalPages, current + 1))
                }
              >
                Siguiente
              </Button>
            </div>
          </div>

          {showEmptyState ? (
            <EmptyState
              title="Sin resultados"
              description="No hay respuestas visibles que coincidan con los filtros activos."
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
