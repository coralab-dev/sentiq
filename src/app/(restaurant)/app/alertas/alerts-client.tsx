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
  "h-11 w-full rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 text-sm text-[var(--sq-ink)] outline-none transition focus:border-[var(--sq-coral)] focus:ring-2 focus:ring-[var(--sq-coral)]/15 disabled:bg-[var(--sq-soft)] disabled:text-[var(--sq-muted)]";

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
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const selectedAlertId = getSelectedItemId(
    searchParams.get("id"),
    enrichedAlerts.map((alert) => alert.id),
  );
  const selectedAlert = enrichedAlerts.find((alert) => alert.id === selectedAlertId) ?? null;

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

  function selectAlert(alertId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", alertId);
    router.push(`${ROUTES.APP_ALERTS}?${params.toString()}`, { scroll: false });
  }

  function closeInspector() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    const query = params.toString();
    router.push(query ? `${ROUTES.APP_ALERTS}?${query}` : ROUTES.APP_ALERTS, { scroll: false });
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
        eyebrow="Seguimiento"
        title="Alertas"
        description="Revisa experiencias pendientes, documenta el seguimiento y cierra cada caso."
        actions={
          <Button
            type="button"
            onClick={() => void loadAlerts()}
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

      <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] p-1" aria-label="Estado de las alertas">
        {([
          ["pending", "Pendientes"],
          ["attended", "Atendidas"],
          ["all", "Todas"],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" onClick={() => updateFilters({ status: value })} aria-pressed={filters.status === value} className={cn("min-h-10 whitespace-nowrap rounded-lg px-4 text-sm font-semibold text-[var(--sq-muted)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sq-coral)]", filters.status === value && "bg-[var(--sq-aubergine)] text-white")}>
            {label}
          </button>
        ))}
      </div>

      <FilterBar
        className="[&>div:first-child]:lg:grid-cols-4 xl:[&>div:first-child]:grid-cols-6"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {data.lastUpdatedAt ? (
              <p className="text-xs text-[var(--sq-muted)]">
                Actualizado {formatDateTime(data.lastUpdatedAt.toISOString())}
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
        <div className="rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-4 py-3 text-sm text-[var(--sq-ink)]">
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
          <div className="grid overflow-hidden rounded-2xl border border-[var(--sq-line)] bg-[var(--sq-surface)] sm:grid-cols-3">
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
              helper="Dentro de la vista actual"
              variant="info"
              icon={<Store className="size-5" aria-hidden="true" />}
            />
          </div>

          <SectionCard
            title="Alertas"
            description="Los datos de contacto solo aparecen cuando existe consentimiento."
            contentClassName="p-0"
          >
            <DataTable
              columns={[
                { key: "fecha", header: "Fecha" },
                { key: "contexto", header: "Sucursal y origen" },
                { key: "experiencia", header: "Experiencia" },
                { key: "comentario", header: "Comentario" },
                { key: "estado", header: "Estado" },
                { key: "atendida", header: "Seguimiento" },
              ]}
              rows={enrichedAlerts.map((alert) => ({
                id: alert.id,
                selected: alert.id === selectedAlertId,
                onSelect: () => selectAlert(alert.id),
                mobileSummary: (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--sq-ink)]">{getBranchName(data.branches, alert.branch_id)}</p><p className="mt-1 text-xs text-[var(--sq-muted)]">{getZoneName(data.zones, alert.zone_id)} · {formatSource(alert.source)} · {formatDateTime(alert.created_at)}</p></div>
                      <RatingScore value={alert.general_experience as 1 | 2 | 3} />
                    </div>
                    <p className="line-clamp-2 text-sm leading-6 text-[var(--sq-ink)]">{summarizeComment(alert.response?.comment, 150)}</p>
                    {alert.status === "attended" ? <StatusBadge status="attended" /> : <StatusBadge status="pending" />}
                  </div>
                ),
                cells: {
                  fecha: formatDateTime(alert.created_at),
                  contexto: <div><p className="font-medium text-[var(--sq-ink)]">{getBranchName(data.branches, alert.branch_id)}</p><p className="text-xs text-[var(--sq-muted)]">{getZoneName(data.zones, alert.zone_id)} · {formatSource(alert.source)}</p></div>,
                  experiencia: <RatingScore value={alert.general_experience as 1 | 2 | 3} />,
                  comentario: <span className="block max-w-72 whitespace-normal text-[var(--sq-ink)]">{summarizeComment(alert.response?.comment)}</span>,
                  estado: alert.status === "attended" ? <StatusBadge status="attended" /> : <StatusBadge status="pending" />,
                  atendida: alert.status === "attended" ? <span className="block min-w-40 whitespace-normal text-xs leading-5">{getAttendedByLabel(alert)}<br /><span className="text-[var(--sq-muted)]">{formatDateTime(alert.attended_at)}</span></span> : "Pendiente de atención",
                },
              }))}
              emptyState={<EmptyState title="No hay alertas" description="Las alertas aparecerán aquí cuando coincidan con los filtros." className="rounded-none border-0" />}
              className="rounded-none border-0"
            />
          </SectionCard>

        </>
      ) : null}

      <ResponsiveInspector
        open={Boolean(selectedAlert)}
        onOpenChange={(open) => { if (!open) closeInspector(); }}
        title="Seguimiento de alerta"
        description={selectedAlert ? formatDateTime(selectedAlert.created_at) : undefined}
        footer={selectedAlert ? (
          <div className="space-y-3">
            {selectedAlert.status === "pending" ? (
              <>
                <label className="block"><span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--sq-muted)]">Nota interna opcional</span><textarea value={notesByAlertId[selectedAlert.id] ?? ""} maxLength={500} rows={3} disabled={Boolean(updatingAlertId)} onChange={(event) => setNotesByAlertId((current) => ({ ...current, [selectedAlert.id]: event.target.value }))} placeholder="Registra el seguimiento realizado" className="mt-2 w-full resize-none rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] p-3 text-sm text-[var(--sq-ink)] outline-none placeholder:text-[var(--sq-muted)] focus:border-[var(--sq-coral)] focus:ring-2 focus:ring-[var(--sq-coral)]/15" /></label>
                <Button type="button" onClick={() => void markAlertAttended(selectedAlert.id)} disabled={Boolean(updatingAlertId)} className="w-full bg-[var(--sq-coral)] px-4 text-white hover:bg-[#e94b3a]">{updatingAlertId === selectedAlert.id ? "Actualizando..." : "Marcar atendida"}</Button>
              </>
            ) : null}
            <Link href={`${ROUTES.APP_ALERT_DETAIL}?id=${selectedAlert.id}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-4 text-sm font-semibold text-[var(--sq-ink)] transition hover:bg-[var(--sq-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sq-coral)]"><Eye className="size-4" aria-hidden="true" />Abrir detalle completo</Link>
          </div>
        ) : null}
      >
        {selectedAlert ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold text-[var(--sq-muted)]">Experiencia</p><div className="mt-2"><RatingScore value={selectedAlert.general_experience as 1 | 2 | 3} /></div></div>{selectedAlert.status === "attended" ? <StatusBadge status="attended" /> : <StatusBadge status="pending" />}</div>
            <section className="border-y border-[var(--sq-line)] py-5"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-[var(--sq-muted)]">Comentario</p><p className="mt-3 text-sm leading-7 text-[var(--sq-ink)]">{selectedAlert.response?.comment?.trim() || "Esta alerta no incluye comentario."}</p></section>
            <dl className="space-y-4">
              <AlertInspectorRow label="Sucursal" value={getBranchName(data.branches, selectedAlert.branch_id)} />
              <AlertInspectorRow label="Zona" value={getZoneName(data.zones, selectedAlert.zone_id)} />
              <AlertInspectorRow label="Origen" value={formatSource(selectedAlert.source)} />
              <AlertInspectorRow label="Teléfono" value={formatPhone(selectedAlert.response) || "No disponible"} />
              {selectedAlert.internal_note ? <AlertInspectorRow label="Nota interna" value={selectedAlert.internal_note} /> : null}
              {selectedAlert.status === "attended" ? <><AlertInspectorRow label="Atendida por" value={getAttendedByLabel(selectedAlert)} /><AlertInspectorRow label="Fecha de atención" value={formatDateTime(selectedAlert.attended_at)} /></> : null}
            </dl>
          </div>
        ) : null}
      </ResponsiveInspector>
    </div>
  );
}



function AlertInspectorRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 text-sm"><dt className="text-[var(--sq-muted)]">{label}</dt><dd className="max-w-[65%] text-right font-semibold text-[var(--sq-ink)]">{value}</dd></div>;
}
