"use client";

import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronRight,
  Download,
  MessageSquareText,
  RefreshCw,
  Star,
  Store,
  Utensils,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DataTable,
  FilterBar,
  FilterField,
  MetricCard,
  PageHeader,
  RatingScore,
  SectionCard,
} from "@/components/panel";
import { EmptyState, LoadingState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import {
  calculateDashboardMetrics,
  clampRating,
  formatDateTime,
  formatMetricAverage,
  formatRelativeDate,
  formatSource,
  getBranchName,
  getDefaultDateRange,
  getZoneName,
  summarizeComment,
  toDateRangeIso,
  type DashboardAlert,
  type DashboardBranch,
  type DashboardResponse,
  type DashboardZone,
} from "./dashboard-data";
import {
  DASHBOARD_POLLING_INTERVAL_MS,
  getRealtimeStatusLabel,
  type DashboardLoadMode,
  type RealtimeStatus,
} from "./dashboard-refresh";

const inputClassName =
  "h-11 w-full rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 text-sm text-[var(--sq-ink)] outline-none transition focus:border-[var(--sq-coral)] focus:ring-2 focus:ring-[var(--sq-coral)]/15 disabled:bg-[var(--sq-soft)] disabled:text-[var(--sq-muted)]";

type DashboardLoadState = {
  branches: DashboardBranch[];
  zones: DashboardZone[];
  responses: DashboardResponse[];
  alerts: DashboardAlert[];
  lastUpdatedAt: Date | null;
};

const initialData: DashboardLoadState = {
  branches: [],
  zones: [],
  responses: [],
  alerts: [],
  lastUpdatedAt: null,
};

export function DashboardClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [dateRange, setDateRange] = useState(() => getDefaultDateRange());
  const [selectedBranchId, setSelectedBranchId] = useState("all");
  const [data, setData] = useState<DashboardLoadState>(initialData);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  const loadDashboard = useCallback(async ({ mode }: { mode: DashboardLoadMode }) => {
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;

    if (mode === "manual") {
      setIsRefreshing(true);
    }

    try {
      const { startIso, endIso } = toDateRangeIso(dateRange);

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
          "id, branch_id, zone_id, source, general_experience, service_attention, food_quality, service_speed, comment, created_at, has_alert",
        )
        .gte("created_at", startIso)
        .lte("created_at", endIso)
        .order("created_at", { ascending: false })
        .limit(1000);

      let alertsRequest = supabase
        .from("feedback_alerts")
        .select(
          "id, branch_id, zone_id, source, general_experience, status, created_at",
        )
        .gte("created_at", startIso)
        .lte("created_at", endIso)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (selectedBranchId !== "all") {
        responsesRequest = responsesRequest.eq("branch_id", selectedBranchId);
        alertsRequest = alertsRequest.eq("branch_id", selectedBranchId);
      }

      const [branchesResult, zonesResult, responsesResult, alertsResult] =
        await Promise.all([
          branchesRequest,
          zonesRequest,
          responsesRequest,
          alertsRequest,
        ]);

      if (branchesResult.error) throw branchesResult.error;
      if (zonesResult.error) throw zonesResult.error;
      if (responsesResult.error) throw responsesResult.error;
      if (alertsResult.error) throw alertsResult.error;

      const visibleBranches = branchesResult.data ?? [];
      const nextSelectedBranchIsVisible =
        selectedBranchId === "all" ||
        visibleBranches.some((branch) => branch.id === selectedBranchId);

      if (!nextSelectedBranchIsVisible) {
        setSelectedBranchId("all");
      }

      setData({
        branches: visibleBranches,
        zones: zonesResult.data ?? [],
        responses: responsesResult.data ?? [],
        alerts: alertsResult.data ?? [],
        lastUpdatedAt: new Date(),
      });
      hasLoadedOnceRef.current = true;
      setErrorMessage(null);
    } catch {
      if (mode === "manual" || !hasLoadedOnceRef.current) {
        setErrorMessage(
          "No pudimos cargar el dashboard. Intenta actualizar en unos momentos.",
        );
      }
    } finally {
      isLoadingRef.current = false;
      setIsInitialLoading(false);
      if (mode === "manual") {
        setIsRefreshing(false);
      }
    }
  }, [dateRange, selectedBranchId, supabase]);

  useEffect(() => {
    void loadDashboard({ mode: "manual" });
  }, [loadDashboard]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadDashboard({ mode: "auto" });
    }, DASHBOARD_POLLING_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [loadDashboard]);

  useEffect(() => {
    setRealtimeStatus("idle");

    const channel = supabase
      .channel("dashboard-pending-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feedback_alerts",
          filter: "status=eq.pending",
        },
        () => {
          void loadDashboard({ mode: "realtime" });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "feedback_alerts",
          filter: "status=eq.pending",
        },
        () => {
          void loadDashboard({ mode: "realtime" });
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeStatus("error");
          return;
        }

        if (status === "CLOSED") {
          setRealtimeStatus("disconnected");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadDashboard, supabase]);

  const metrics = useMemo(
    () => calculateDashboardMetrics(data.responses, data.alerts),
    [data.alerts, data.responses],
  );

  const recentResponses = data.responses.slice(0, 8);
  const pendingAlerts = data.alerts
    .filter((alert) => alert.status === "pending")
    .slice(0, 6);

  const branchSelectDisabled = data.branches.length <= 1 || isRefreshing;
  const showNoBranchesState = !isInitialLoading && !errorMessage && data.branches.length === 0;
  const showEmptyResponsesState =
    !isInitialLoading &&
    !errorMessage &&
    data.branches.length > 0 &&
    data.responses.length === 0;

  if (isInitialLoading) {
    return (
      <LoadingState
        title="Cargando dashboard"
        description="Estamos consultando respuestas, alertas y sucursales visibles."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operación"
        title="Resumen general"
        description="Revisa primero lo que necesita atención y mantén el contexto de la experiencia reciente."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={ROUTES.APP_EXPORT}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-4 text-sm font-semibold text-[var(--sq-ink)] transition hover:bg-[var(--sq-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sq-coral)]"
            >
              <Download className="size-4" aria-hidden="true" />
              Exportar
            </Link>
            <Button
              type="button"
              onClick={() => void loadDashboard({ mode: "manual" })}
              disabled={isRefreshing}
              className="bg-[var(--sq-aubergine)] px-4 text-white hover:bg-[#3c1949] focus-visible:ring-[var(--sq-coral)]/30"
            >
              <RefreshCw
                className={cn("size-4", isRefreshing && "animate-spin")}
                aria-hidden="true"
              />
              Actualizar
            </Button>
          </div>
        }
      />

      <FilterBar
        actions={
          <div className="space-y-1 text-xs text-slate-500">
            {data.lastUpdatedAt ? (
              <p>
                Última actualización: {formatDateTime(data.lastUpdatedAt.toISOString())}
              </p>
            ) : null}
            <p>{getRealtimeStatusLabel(realtimeStatus)}</p>
          </div>
        }
      >
        <FilterField label="Desde">
          <input
            type="date"
            value={dateRange.startDate}
            max={dateRange.endDate}
            disabled={isRefreshing}
            onChange={(event) =>
              setDateRange((current) => ({
                ...current,
                startDate: event.target.value,
              }))
            }
            className={inputClassName}
          />
        </FilterField>
        <FilterField label="Hasta">
          <input
            type="date"
            value={dateRange.endDate}
            min={dateRange.startDate}
            disabled={isRefreshing}
            onChange={(event) =>
              setDateRange((current) => ({
                ...current,
                endDate: event.target.value,
              }))
            }
            className={inputClassName}
          />
        </FilterField>
        <FilterField label="Sucursal">
          <select
            value={data.branches.length === 1 ? data.branches[0]?.id : selectedBranchId}
            disabled={branchSelectDisabled}
            onChange={(event) => setSelectedBranchId(event.target.value)}
            className={inputClassName}
          >
            {data.branches.length > 1 ? (
              <option value="all">Todas las sucursales</option>
            ) : null}
            {data.branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </FilterField>
      </FilterBar>

      {errorMessage ? (
        <EmptyState
          title="No se pudo cargar el dashboard"
          description={errorMessage}
          icon={<AlertTriangle className="size-6" aria-hidden="true" />}
          action={
            <Button type="button" onClick={() => void loadDashboard({ mode: "manual" })}>
              Reintentar
            </Button>
          }
        />
      ) : null}

      {showNoBranchesState ? (
        <EmptyState
          title="No hay sucursales visibles"
          description="Tu usuario no tiene sucursales disponibles para consultar en este panel."
          icon={<Store className="size-6" aria-hidden="true" />}
        />
      ) : null}

      {!errorMessage && data.branches.length > 0 ? (
        <>
          <div className="grid overflow-hidden rounded-2xl border border-[var(--sq-line)] bg-[var(--sq-surface)] sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard
              label="Total de respuestas"
              value={metrics.totalResponses}
              helper={showEmptyResponsesState ? "Sin datos en el rango" : "En el periodo seleccionado"}
              variant="success"
              icon={<MessageSquareText className="size-5" aria-hidden="true" />}
            />
            <MetricCard
              label="Experiencia general"
              value={formatMetricAverage(metrics.generalExperience)}
              helper="Promedio de 1 a 5"
              variant="neutral"
              icon={<Star className="size-5" aria-hidden="true" />}
            />
            <MetricCard
              label="Atención recibida"
              value={formatMetricAverage(metrics.serviceAttention)}
              helper="Promedio de 1 a 5"
              variant="info"
              icon={<Bell className="size-5" aria-hidden="true" />}
            />
            <MetricCard
              label="Alimentos y bebidas"
              value={formatMetricAverage(metrics.foodQuality)}
              helper="Promedio de 1 a 5"
              variant="success"
              icon={<Utensils className="size-5" aria-hidden="true" />}
            />
            <MetricCard
              label="Rapidez del servicio"
              value={formatMetricAverage(metrics.serviceSpeed)}
              helper="Promedio de 1 a 5"
              variant="info"
              icon={<Zap className="size-5" aria-hidden="true" />}
            />
            <MetricCard
              label="Alertas pendientes"
              value={metrics.pendingAlerts}
              helper={
                <Link href={ROUTES.APP_ALERTS} className="hover:underline">
                  Ver alertas
                </Link>
              }
              variant={metrics.pendingAlerts > 0 ? "warning" : "neutral"}
              icon={<AlertTriangle className="size-5" aria-hidden="true" />}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
            <SectionCard title="Requiere atención" description="Alertas pendientes dentro del periodo seleccionado." contentClassName="p-0">
              {pendingAlerts.length > 0 ? (
                <div className="divide-y divide-[var(--sq-line)]">
                  {pendingAlerts.map((alert) => (
                    <Link key={alert.id} href={`${ROUTES.APP_ALERT_DETAIL}?id=${alert.id}`} className="group flex min-h-20 items-center gap-4 px-5 py-4 transition hover:bg-[var(--sq-coral-soft)]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--sq-coral)] sm:px-6">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--sq-coral-soft)] text-[var(--sq-coral)]"><AlertTriangle className="size-5" aria-hidden="true" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[var(--sq-ink)]">{getBranchName(data.branches, alert.branch_id)}</span>
                        <span className="mt-1 block truncate text-xs text-[var(--sq-muted)]">{getZoneName(data.zones, alert.zone_id)} · {formatSource(alert.source)} · {formatRelativeDate(alert.created_at)}</span>
                      </span>
                      <RatingScore value={clampRating(alert.general_experience)} />
                      <ChevronRight className="size-4 shrink-0 text-[var(--sq-muted)] transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState title="Sin alertas pendientes" description="No hay experiencias que requieran seguimiento en este periodo." className="rounded-none border-0" />
              )}
              <div className="border-t border-[var(--sq-line)] p-4 sm:px-6">
                <Link href={ROUTES.APP_ALERTS} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--sq-aubergine)] hover:text-[var(--sq-coral)]">Ver todas las alertas<ChevronRight className="size-4" aria-hidden="true" /></Link>
              </div>
            </SectionCard>

            <SectionCard title="Respuestas recientes" description="Últimas respuestas recibidas dentro del mismo periodo." contentClassName="p-0">
              <DataTable
                columns={[{ key: "fecha", header: "Fecha" }, { key: "sucursal", header: "Sucursal" }, { key: "general", header: "Experiencia" }, { key: "comentario", header: "Comentario" }]}
                rows={recentResponses.map((response) => ({
                  id: response.id,
                  cells: {
                    fecha: formatDateTime(response.created_at),
                    sucursal: <div><p className="font-medium text-[var(--sq-ink)]">{getBranchName(data.branches, response.branch_id)}</p><p className="text-xs text-[var(--sq-muted)]">{getZoneName(data.zones, response.zone_id)} · {formatSource(response.source)}</p></div>,
                    general: <RatingScore value={clampRating(response.general_experience)} />,
                    comentario: <span className="block max-w-72 whitespace-normal text-[var(--sq-ink)]">{summarizeComment(response.comment, 110)}</span>,
                  },
                  actions: <Link href={`${ROUTES.APP_RESPONSE_DETAIL}?id=${response.id}`} className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-[var(--sq-aubergine)] hover:text-[var(--sq-coral)]">Ver<ChevronRight className="size-3.5" aria-hidden="true" /></Link>,
                }))}
                actionsHeader="Detalle"
                emptyState={<EmptyState title="No hay respuestas en este rango" description="Cambia las fechas o la sucursal para consultar otra ventana." className="rounded-none border-0" />}
                className="rounded-none border-0"
              />
            </SectionCard>
          </div>

          {showEmptyResponsesState ? (
            <EmptyState
              title="No hay respuestas para estos filtros"
              description="Las métricas se mostrarán cuando existan respuestas visibles en el rango seleccionado."
              icon={<CalendarDays className="size-6" aria-hidden="true" />}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
