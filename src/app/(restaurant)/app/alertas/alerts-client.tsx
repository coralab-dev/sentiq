"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Eye,
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
  enrichAlerts,
  formatDateTime,
  formatPhone,
  formatSource,
  getAlertMetrics,
  getAttendedByLabel,
  getBranchName,
  getDefaultAlertFilters,
  getZoneName,
  summarizeComment,
  toDateRangeIso,
  type AlertFilters,
  type AlertProfileRow,
  type AlertResponseRow,
  type AlertRow,
  type AlertsBranch,
  type AlertsZone,
} from "./alerts-data";

const inputClassName =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:bg-slate-50 disabled:text-slate-400";

type AlertsLoadState = {
  branches: AlertsBranch[];
  zones: AlertsZone[];
  alerts: AlertRow[];
  responses: AlertResponseRow[];
  profiles: AlertProfileRow[];
  lastUpdatedAt: Date | null;
};

const initialData: AlertsLoadState = {
  branches: [],
  zones: [],
  alerts: [],
  responses: [],
  profiles: [],
  lastUpdatedAt: null,
};

export function AlertsClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [filters, setFilters] = useState<AlertFilters>(() => getDefaultAlertFilters());
  const [data, setData] = useState<AlertsLoadState>(initialData);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingAlertId, setUpdatingAlertId] = useState<string | null>(null);
  const [notesByAlertId, setNotesByAlertId] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
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

      let alertsRequest = supabase
        .from("feedback_alerts")
        .select(
          "id, restaurant_id, branch_id, zone_id, device_id, response_id, source, general_experience, status, attended_by, attended_at, internal_note, created_at, updated_at",
        )
        .gte("created_at", startIso)
        .lte("created_at", endIso)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (filters.branchId !== "all") {
        alertsRequest = alertsRequest.eq("branch_id", filters.branchId);
      }

      if (filters.zoneId !== "all") {
        alertsRequest = alertsRequest.eq("zone_id", filters.zoneId);
      }

      if (filters.source !== "all") {
        alertsRequest = alertsRequest.eq("source", filters.source);
      }

      if (filters.status !== "all") {
        alertsRequest = alertsRequest.eq("status", filters.status);
      }

      const [branchesResult, zonesResult, alertsResult] = await Promise.all([
        branchesRequest,
        zonesRequest,
        alertsRequest,
      ]);

      if (branchesResult.error) throw branchesResult.error;
      if (zonesResult.error) throw zonesResult.error;
      if (alertsResult.error) throw alertsResult.error;

      const alerts = alertsResult.data ?? [];
      const responseIds = Array.from(new Set(alerts.map((alert) => alert.response_id)));
      const attendedByIds = Array.from(
        new Set(alerts.map((alert) => alert.attended_by).filter(Boolean)),
      ) as string[];

      const responsesRequest =
        responseIds.length > 0
          ? supabase
              .from("feedback_responses")
              .select("id, comment, customer_phone, consent_to_contact")
              .in("id", responseIds)
          : Promise.resolve({ data: [], error: null });

      const profilesRequest =
        attendedByIds.length > 0
          ? supabase
              .from("user_profiles")
              .select("id, full_name, email")
              .in("id", attendedByIds)
          : Promise.resolve({ data: [], error: null });

      const [responsesResult, profilesResult] = await Promise.all([
        responsesRequest,
        profilesRequest,
      ]);

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
        alerts,
        responses: responsesResult.data ?? [],
        profiles: profilesResult.error ? [] : profilesResult.data ?? [],
        lastUpdatedAt: new Date(),
      });
    } catch {
      setErrorMessage(
        "No pudimos cargar las alertas. Intenta actualizar en unos momentos.",
      );
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [filters.branchId, filters.dateRange, filters.source, filters.status, filters.zoneId, supabase]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const enrichedAlerts = useMemo(
    () => enrichAlerts(data.alerts, data.responses, data.profiles),
    [data.alerts, data.profiles, data.responses],
  );

  const metrics = useMemo(() => getAlertMetrics(enrichedAlerts), [enrichedAlerts]);

  const visibleZones = useMemo(() => {
    if (filters.branchId === "all") {
      return data.zones;
    }

    return data.zones.filter((zone) => zone.branch_id === filters.branchId);
  }, [data.zones, filters.branchId]);

  const branchSelectDisabled = data.branches.length <= 1 || isRefreshing;
  const showNoBranchesState = !isInitialLoading && !errorMessage && data.branches.length === 0;

  function updateFilters(nextFilters: Partial<AlertFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
    }));
  }

  function resetFilters() {
    setFilters(getDefaultAlertFilters());
  }

  async function markAlertAttended(alertId: string) {
    const note = notesByAlertId[alertId]?.trim() ?? "";

    setActionMessage(null);
    setUpdatingAlertId(alertId);

    try {
      const { data: result, error } = await supabase.functions.invoke("update_alert_status", {
        body: {
          alert_id: alertId,
          status: "attended",
          internal_note: note,
        },
      });

      if (error || result?.ok !== true || result?.status !== "attended") {
        throw error ?? new Error("Unexpected response");
      }

      setActionMessage("Alerta marcada como atendida.");
      setNotesByAlertId((current) => {
        const next = { ...current };
        delete next[alertId];
        return next;
      });
      await loadAlerts();
    } catch {
      setActionMessage("No pudimos actualizar la alerta. Verifica permisos e intenta de nuevo.");
    } finally {
      setUpdatingAlertId(null);
    }
  }

  if (isInitialLoading) {
    return (
      <LoadingState
        title="Cargando alertas"
        description="Estamos consultando alertas visibles para tu usuario."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas"
        description="Seguimiento de alertas visibles segun tu sesion y permisos."
        actions={
          <Button
            type="button"
            onClick={() => void loadAlerts()}
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
        className="[&>div:first-child]:lg:grid-cols-4 xl:[&>div:first-child]:grid-cols-6"
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
            {data.branches.length > 1 ? <option value="all">Todas</option> : null}
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
              updateFilters({ source: event.target.value as AlertFilters["source"] })
            }
            className={inputClassName}
          >
            <option value="all">Todos</option>
            <option value="qr">QR</option>
            <option value="device">Dispositivo</option>
          </select>
        </FilterField>
        <FilterField label="Estado">
          <select
            value={filters.status}
            disabled={isRefreshing}
            onChange={(event) =>
              updateFilters({ status: event.target.value as AlertFilters["status"] })
            }
            className={inputClassName}
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="attended">Atendidas</option>
          </select>
        </FilterField>
      </FilterBar>

      {errorMessage ? (
        <EmptyState
          title="No se pudieron cargar las alertas"
          description={errorMessage}
          icon={<AlertTriangle className="size-6" aria-hidden="true" />}
          action={
            <Button type="button" onClick={() => void loadAlerts()}>
              Reintentar
            </Button>
          }
        />
      ) : null}

      {actionMessage ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          {actionMessage}
        </div>
      ) : null}

      {showNoBranchesState ? (
        <EmptyState
          title="No hay sucursales visibles"
          description="Tu usuario no tiene sucursales disponibles para consultar alertas."
          icon={<Store className="size-6" aria-hidden="true" />}
        />
      ) : null}

      {!errorMessage && data.branches.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Pendientes"
              value={metrics.pending}
              helper="Dentro de filtros actuales"
              variant={metrics.pending > 0 ? "warning" : "neutral"}
              icon={<AlertTriangle className="size-5" aria-hidden="true" />}
            />
            <MetricCard
              label="Atendidas"
              value={metrics.attended}
              helper="Dentro de filtros actuales"
              variant="success"
              icon={<CheckCircle2 className="size-5" aria-hidden="true" />}
            />
            <MetricCard
              label="Total filtradas"
              value={metrics.total}
              helper="Alertas visibles por RLS"
              variant="info"
              icon={<Store className="size-5" aria-hidden="true" />}
            />
          </div>

          <SectionCard
            title="Alertas"
            description="No se muestran telefonos sin consentimiento. Las acciones usan la Edge Function desplegada."
            contentClassName="p-0"
          >
            <DataTable
              columns={[
                { key: "fecha", header: "Fecha" },
                { key: "sucursal", header: "Sucursal" },
                { key: "zona", header: "Zona" },
                { key: "origen", header: "Origen" },
                { key: "experiencia", header: "Experiencia" },
                { key: "comentario", header: "Comentario" },
                { key: "telefono", header: "Telefono" },
                { key: "estado", header: "Estado" },
                { key: "atendida", header: "Atendida por / fecha" },
              ]}
              rows={enrichedAlerts.map((alert) => ({
                id: alert.id,
                cells: {
                  fecha: formatDateTime(alert.created_at),
                  sucursal: getBranchName(data.branches, alert.branch_id),
                  zona: getZoneName(data.zones, alert.zone_id),
                  origen: formatSource(alert.source),
                  experiencia: <RatingScore value={alert.general_experience as 1 | 2 | 3} />,
                  comentario: (
                    <span className="block max-w-56 whitespace-normal">
                      {summarizeComment(alert.response?.comment)}
                    </span>
                  ),
                  telefono: formatPhone(alert.response),
                  estado:
                    alert.status === "attended" ? (
                      <StatusBadge status="attended" />
                    ) : (
                      <StatusBadge status="pending" />
                    ),
                  atendida:
                    alert.status === "attended" ? (
                      <span className="block min-w-40 whitespace-normal text-xs leading-5">
                        {getAttendedByLabel(alert)}
                        <br />
                        <span className="text-slate-500">
                          {formatDateTime(alert.attended_at)}
                        </span>
                      </span>
                    ) : (
                      "--"
                    ),
                },
                actions: (
                  <div className="flex flex-col items-end gap-2">
                    <Link
                      href={`${ROUTES.APP_ALERT_DETAIL}?id=${alert.id}`}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Eye className="size-3.5" aria-hidden="true" />
                      Ver detalle
                    </Link>
                    {alert.status === "pending" ? (
                      <div className="flex w-48 flex-col gap-2">
                        <input
                          type="text"
                          value={notesByAlertId[alert.id] ?? ""}
                          maxLength={500}
                          placeholder="Nota opcional"
                          disabled={Boolean(updatingAlertId)}
                          onChange={(event) =>
                            setNotesByAlertId((current) => ({
                              ...current,
                              [alert.id]: event.target.value,
                            }))
                          }
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:bg-slate-50 disabled:text-slate-400"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void markAlertAttended(alert.id)}
                          disabled={Boolean(updatingAlertId)}
                          className="bg-teal-700 text-white hover:bg-teal-800"
                        >
                          {updatingAlertId === alert.id ? "Actualizando" : "Marcar atendida"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ),
              }))}
              actionsHeader="Acciones"
              emptyState={
                <EmptyState
                  title="No hay alertas"
                  description="Las alertas visibles apareceran aqui cuando coincidan con los filtros."
                  className="rounded-none border-0"
                />
              }
              className="rounded-none border-0 shadow-none"
            />
          </SectionCard>

        </>
      ) : null}
    </div>
  );
}
