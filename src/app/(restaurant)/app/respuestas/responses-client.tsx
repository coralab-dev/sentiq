"use client";

import {
  AlertTriangle,
  CalendarDays,
  Eye,
  ListFilter,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DataTable,
  FilterBar,
  FilterField,
  MetricCard,
  PageHeader,
  RatingScore,
  ResponsiveInspector,
  SectionCard,
  getSelectedItemId,
  getVisibleFilterChips,
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
  "h-11 w-full rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 text-sm text-[var(--sq-ink)] outline-none transition focus:border-[var(--sq-coral)] focus:ring-2 focus:ring-[var(--sq-coral)]/15 disabled:bg-[var(--sq-soft)] disabled:text-[var(--sq-muted)]";

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
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

  const selectedResponseId = getSelectedItemId(
    searchParams.get("id"),
    filteredResponses.map((response) => response.id),
  );
  const selectedResponse = filteredResponses.find(
    (response) => response.id === selectedResponseId,
  ) ?? null;

  const activeFilterChips = getVisibleFilterChips(
    {
      branchId: filters.branchId,
      zoneId: filters.zoneId,
      source: filters.source,
      lowRating: filters.lowRating,
      comment: filters.comment,
      phone: filters.phone,
      alert: filters.alert,
    },
    { branchId: "all", zoneId: "all", source: "all", lowRating: "all", comment: "all", phone: "all", alert: "all" },
    {
      branchId: (value) => data.branches.find((branch) => branch.id === value)?.name ?? value,
      zoneId: (value) => data.zones.find((zone) => zone.id === value)?.name ?? value,
      source: (value) => value === "qr" ? "Origen: QR" : "Origen: dispositivo",
      lowRating: (value) => value === "lte2" ? "Experiencia de 1–2" : "Experiencia de 1–3",
      comment: (value) => value === "with_comment" ? "Con comentario" : "Sin comentario",
      phone: (value) => value === "with_phone" ? "Con teléfono consentido" : "Sin teléfono",
      alert: (value) => value === "with_alert" ? "Con alerta" : "Sin alerta",
    },
  );

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

  function selectResponse(responseId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", responseId);
    router.push(`${ROUTES.APP_RESPONSES}?${params.toString()}`, { scroll: false });
  }

  function closeInspector() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    const query = params.toString();
    router.push(query ? `${ROUTES.APP_RESPONSES}?${query}` : ROUTES.APP_RESPONSES, { scroll: false });
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
        eyebrow="Actividad"
        title="Respuestas"
        description="Consulta cada respuesta, ajusta los filtros y abre el detalle sin perder el listado."
        actions={
          <Button
            type="button"
            onClick={() => void loadResponses()}
            disabled={isRefreshing}
            className="bg-[var(--sq-aubergine)] px-4 text-white hover:bg-[#3c1949]"
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
        className="[&>div:first-child]:lg:grid-cols-3"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {data.lastUpdatedAt ? (
              <p className="text-xs text-[var(--sq-muted)]">
                Actualizado {formatDateTime(data.lastUpdatedAt.toISOString())}
              </p>
            ) : null}
            <Button type="button" variant="outline" onClick={() => setShowAdvancedFilters((visible) => !visible)} aria-expanded={showAdvancedFilters}>
              <ListFilter className="size-4" aria-hidden="true" />
              {showAdvancedFilters ? "Ocultar filtros" : "Más filtros"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              disabled={isRefreshing || activeFilterChips.length === 0}
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
        {showAdvancedFilters ? <>
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
        <FilterField label="Calificación">
          <select
            value={filters.lowRating}
            disabled={isRefreshing}
            onChange={(event) =>
              updateFilters({ lowRating: event.target.value as ResponseFilters["lowRating"] })
            }
            className={inputClassName}
          >
            <option value="all">Todas</option>
            <option value="lte3">Experiencia ≤ 3</option>
            <option value="lte2">Experiencia ≤ 2</option>
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
        <FilterField label="Teléfono">
          <select
            value={filters.phone}
            disabled={isRefreshing}
            onChange={(event) =>
              updateFilters({ phone: event.target.value as ResponseFilters["phone"] })
            }
            className={inputClassName}
          >
            <option value="all">Todos</option>
            <option value="with_phone">Con teléfono consentido</option>
            <option value="without_phone">Sin teléfono</option>
          </select>
        </FilterField>
        </> : null}
      </FilterBar>

      {showAdvancedFilters ? <FilterBar className="[&>div:first-child]:lg:grid-cols-3">
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
                {option} por página
              </option>
            ))}
          </select>
        </FilterField>
      </FilterBar> : null}

      {activeFilterChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2" aria-label="Filtros activos">
          <span className="text-xs font-semibold text-[var(--sq-muted)]">Filtros activos</span>
          {activeFilterChips.map((chip) => (
            <button key={chip.key} type="button" onClick={() => updateFilters({ [chip.key]: "all" } as Partial<ResponseFilters>)} className="inline-flex min-h-9 items-center rounded-full border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 text-xs font-semibold text-[var(--sq-ink)] transition hover:border-[var(--sq-coral)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sq-coral)]" aria-label={`Quitar filtro ${chip.label}`}>
              {chip.label}<span className="ml-2 text-[var(--sq-coral)]" aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}

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
          <div className="grid overflow-hidden rounded-2xl border border-[var(--sq-line)] bg-[var(--sq-surface)] sm:grid-cols-3">
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
            description="Los datos de contacto solo aparecen cuando existe consentimiento."
            contentClassName="p-0"
          >
            <DataTable
              columns={[
                { key: "fecha", header: "Fecha" },
                { key: "contexto", header: "Sucursal y origen" },
                { key: "general", header: "Experiencia" },
                { key: "atencion", header: "Atención" },
                { key: "alimentos", header: "Alimentos" },
                { key: "rapidez", header: "Rapidez" },
                { key: "comentario", header: "Comentario" },
                { key: "alerta", header: "Estado" },
              ]}
              rows={pagination.rows.map((response) => ({
                id: response.id,
                selected: response.id === selectedResponseId,
                onSelect: () => selectResponse(response.id),
                mobileSummary: (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--sq-ink)]">{getBranchName(data.branches, response.branch_id)}</p><p className="mt-1 text-xs text-[var(--sq-muted)]">{getZoneName(data.zones, response.zone_id)} · {formatSource(response.source)} · {formatDateTime(response.created_at)}</p></div>
                      <RatingScore value={clampRating(response.general_experience)} />
                    </div>
                    <p className="line-clamp-2 text-sm leading-6 text-[var(--sq-ink)]">{summarizeComment(response.comment, 150)}</p>
                    {response.has_alert ? <StatusBadge status="pending" label="Con alerta" /> : <StatusBadge status="completed" label="Sin alerta" />}
                  </div>
                ),
                cells: {
                  fecha: formatDateTime(response.created_at),
                  contexto: <div><p className="font-medium text-[var(--sq-ink)]">{getBranchName(data.branches, response.branch_id)}</p><p className="text-xs text-[var(--sq-muted)]">{getZoneName(data.zones, response.zone_id)} · {formatSource(response.source)}</p></div>,
                  general: <RatingScore value={clampRating(response.general_experience)} />,
                  atencion: <RatingScore value={clampRating(response.service_attention)} />,
                  alimentos: <RatingScore value={clampRating(response.food_quality)} />,
                  rapidez: <RatingScore value={clampRating(response.service_speed)} />,
                  comentario: <span className="block max-w-64 whitespace-normal text-[var(--sq-ink)]">{summarizeComment(response.comment)}</span>,
                  alerta: response.has_alert ? <StatusBadge status="pending" label="Con alerta" /> : <StatusBadge status="completed" label="Sin alerta" />,
                },
              }))}
              emptyState={<EmptyState title="No hay respuestas para estos filtros" description="Ajusta el rango, sucursal u otros filtros para consultar otra vista." className="rounded-none border-0" />}
              className="rounded-none border-0"
            />
          </SectionCard>

          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--sq-line)] bg-[var(--sq-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--sq-muted)]">
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
              <span className="text-sm font-medium text-[var(--sq-ink)]">
                Página {pagination.page} de {pagination.totalPages}
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

      <ResponsiveInspector
        open={Boolean(selectedResponse)}
        onOpenChange={(open) => { if (!open) closeInspector(); }}
        title="Detalle de respuesta"
        description={selectedResponse ? formatDateTime(selectedResponse.created_at) : undefined}
        footer={selectedResponse ? (
          <Link href={`${ROUTES.APP_RESPONSE_DETAIL}?id=${selectedResponse.id}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--sq-aubergine)] px-4 text-sm font-semibold text-white transition hover:bg-[#3c1949] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sq-coral)]">
            <Eye className="size-4" aria-hidden="true" />Abrir detalle completo
          </Link>
        ) : null}
      >
        {selectedResponse ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <InspectorRating label="Experiencia" value={selectedResponse.general_experience} />
              <InspectorRating label="Atención" value={selectedResponse.service_attention} />
              <InspectorRating label="Alimentos" value={selectedResponse.food_quality} />
              <InspectorRating label="Rapidez" value={selectedResponse.service_speed} />
            </div>
            <section className="border-y border-[var(--sq-line)] py-5">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-[var(--sq-muted)]">Comentario</p>
              <p className="mt-3 text-sm leading-7 text-[var(--sq-ink)]">{selectedResponse.comment?.trim() || "Esta respuesta no incluye comentario."}</p>
            </section>
            <dl className="space-y-4">
              <InspectorRow label="Sucursal" value={getBranchName(data.branches, selectedResponse.branch_id)} />
              <InspectorRow label="Zona" value={getZoneName(data.zones, selectedResponse.zone_id)} />
              <InspectorRow label="Origen" value={formatSource(selectedResponse.source)} />
              <InspectorRow label="Teléfono" value={formatPhone(selectedResponse) || "No disponible"} />
              <InspectorRow label="Alerta" value={selectedResponse.has_alert ? "Con alerta" : "Sin alerta"} />
            </dl>
          </div>
        ) : null}
      </ResponsiveInspector>
    </div>
  );
}



function InspectorRating({ label, value }: { label: string; value: number }) {
  return <div><p className="text-xs font-semibold text-[var(--sq-muted)]">{label}</p><div className="mt-2"><RatingScore value={clampRating(value)} /></div></div>;
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 text-sm"><dt className="text-[var(--sq-muted)]">{label}</dt><dd className="text-right font-semibold text-[var(--sq-ink)]">{value}</dd></div>;
}
