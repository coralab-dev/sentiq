"use client";

import {
  AlertTriangle,
  Bell,
  CalendarDays,
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
import { EmptyState, LoadingState, StatusBadge } from "@/components/shared";
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
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:bg-slate-50 disabled:text-slate-400";

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
  const recentComments = data.responses
    .filter((response) => Boolean(response.comment?.trim()))
    .slice(0, 4);

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
        title="Resumen general"
        description="Monitorea la experiencia de clientes con datos filtrados por tu sesion y permisos."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={ROUTES.APP_EXPORT}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Download className="size-4" aria-hidden="true" />
              Exportar
            </Link>
            <Button
              type="button"
              onClick={() => void loadDashboard({ mode: "manual" })}
              disabled={isRefreshing}
              className="bg-teal-700 text-white hover:bg-teal-800"
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
                Ultima actualizacion: {formatDateTime(data.lastUpdatedAt.toISOString())}
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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
              label="Atencion recibida"
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

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <SectionCard
              title="Ultimas respuestas"
              description="Feedback reciente dentro del rango seleccionado."
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
                ]}
                rows={recentResponses.map((response) => ({
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
                  },
                  actions: response.has_alert ? (
                    <StatusBadge status="pending" label="Con alerta" />
                  ) : (
                    <StatusBadge status="completed" label="Sin alerta" />
                  ),
                }))}
                actionsHeader="Estado"
                emptyState={
                  <EmptyState
                    title="No hay respuestas en este rango"
                    description="Cambia las fechas o la sucursal para consultar otra ventana."
                    className="rounded-none border-0"
                  />
                }
                className="rounded-none border-0 shadow-none"
              />
            </SectionCard>

            <div className="space-y-6">
              <SectionCard
                title="Comentarios recientes"
                description="Solo respuestas con comentario. No se muestran telefonos ni nombres."
                contentClassName="p-0"
              >
                {recentComments.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {recentComments.map((response) => (
                      <article key={response.id} className="space-y-2 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-950">
                              {getBranchName(data.branches, response.branch_id)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {getZoneName(data.zones, response.zone_id)} ·{" "}
                              {formatSource(response.source)}
                            </p>
                          </div>
                          <RatingScore
                            value={clampRating(response.general_experience)}
                          />
                        </div>
                        <p className="text-sm leading-6 text-slate-700">
                          {summarizeComment(response.comment, 140)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatRelativeDate(response.created_at)}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Sin comentarios recientes"
                    description="Las respuestas con comentario apareceran aqui."
                    className="rounded-none border-0"
                  />
                )}
              </SectionCard>

              <SectionCard title="Alertas pendientes">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-3xl font-semibold text-slate-950">
                        {metrics.pendingAlerts}
                      </p>
                      <p className="text-sm text-slate-500">
                        Pendientes en el periodo
                      </p>
                    </div>
                    <div className="flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                      <AlertTriangle className="size-6" aria-hidden="true" />
                    </div>
                  </div>
                  <Link
                    href={ROUTES.APP_ALERTS}
                    className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Ir a alertas
                  </Link>
                </div>
              </SectionCard>
            </div>
          </div>

          {showEmptyResponsesState ? (
            <EmptyState
              title="No hay respuestas para estos filtros"
              description="Las metricas se mostraran cuando existan respuestas visibles en el rango seleccionado."
              icon={<CalendarDays className="size-6" aria-hidden="true" />}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
