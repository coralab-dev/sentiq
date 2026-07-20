"use client";

import { AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader, SectionCard } from "@/components/panel";
import { EmptyState, LoadingState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import {
  loadRestaurantAccountSettingsData,
  type RestaurantAccountSettingsData,
} from "./account-settings-data";

type LoadStatus = "loading" | "success" | "error";

const labels: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  suspended: "Suspendido",
  paused: "Pausado",
  cancelled: "Cancelado",
  demo: "Demo",
  pilot: "Piloto",
};

export function AccountSettingsClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [data, setData] = useState<RestaurantAccountSettingsData | null>(null);

  const loadData = useCallback(async () => {
    setStatus("loading");

    try {
      const nextData = await loadRestaurantAccountSettingsData(supabase);
      setData(nextData);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (status === "loading") {
    return (
      <LoadingState
        title="Cargando cuenta"
        description="Consultando datos básicos, plan y actividad agregada."
      />
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        title="No se pudo cargar la cuenta"
        description="Verifica tu conexión e intenta nuevamente."
        icon={<AlertTriangle className="size-6" aria-hidden="true" />}
        action={
          <Button onClick={() => void loadData()}>
            <RefreshCw aria-hidden="true" />
            Reintentar
          </Button>
        }
      />
    );
  }

  if (!data || data.status === "missing_profile" || !data.restaurant) {
    return (
      <EmptyState
        title="Cuenta no disponible"
        description="No encontramos un restaurante asociado a tu perfil activo."
        icon={<ShieldCheck className="size-6" aria-hidden="true" />}
      />
    );
  }

  const account = data.account;
  const aggregates = data.aggregates;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Restaurante"
        title="Cuenta"
        description="Consulta el estado de la cuenta y el contexto operativo del restaurante."
      />

      <div className="grid overflow-hidden rounded-2xl border border-[var(--sq-line)] bg-[var(--sq-surface)] sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Plan actual" value={account?.planCode ?? "Sin cuenta registrada"} />
        <SummaryCard title="Estado de cuenta">
          <AccountBadge status={account?.accountStatus ?? null} />
        </SummaryCard>
        <SummaryCard title="Estado restaurante">
          <RestaurantBadge status={data.restaurant.status} />
        </SummaryCard>
        <SummaryCard
          title="Sucursales activas"
          value={`${aggregates.activeBranches}/${aggregates.totalBranches}`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Datos generales"
          description="Información principal del restaurante."
        >
          <DefinitionList
            items={[
              ["Nombre", data.restaurant.name],
              ["Slug", data.restaurant.slug],
              ["Fecha de alta", formatDate(data.restaurant.createdAt)],
              ["Última actualización", formatDateTime(data.restaurant.updatedAt)],
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Cuenta / plan"
          description="El plan y estado se administran desde SentiQ."
        >
          <DefinitionList
            items={[
              ["Plan", account?.planCode ?? "Sin cuenta registrada"],
              ["Estado de cuenta", <AccountBadge key="account-status" status={account?.accountStatus ?? null} />],
              ["Fecha inicio", formatDate(account?.startedAt ?? null)],
              ["Fecha de cancelación", formatDate(account?.cancelledAt ?? null)],
            ]}
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Uso operativo agregado"
        description="Actividad disponible para esta cuenta, sin contenido de respuestas ni datos de contacto."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Sucursales totales" value={aggregates.totalBranches} />
          <Metric label="Sucursales activas" value={aggregates.activeBranches} />
          <Metric label="Usuarios activos" value={aggregates.activeUsers} />
          <Metric label="Usuarios invitados" value={aggregates.invitedUsers} />
          <Metric label="Dispositivos activos" value={aggregates.activeDevices} />
          <Metric label="QR / links activos" value={aggregates.activeSurveyLinks} />
          <Metric
            label="Última actividad"
            value={formatDateTime(aggregates.lastOperationalActivityAt)}
            wide
          />
        </div>
      </SectionCard>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  children,
}: {
  title: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-l border-[var(--sq-line)] p-5 first:border-l-0">
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.09em] text-[var(--sq-muted)]">{title}</p>
      <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--sq-ink)]">{children ?? value}</div>
    </div>
  );
}

function DefinitionList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-[var(--sq-line)]">
      {items.map(([label, value]) => (
        <div key={label} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-2">
          <dt className="text-sm font-medium text-[var(--sq-muted)]">{label}</dt>
          <dd className="text-sm font-semibold text-[var(--sq-ink)]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Metric({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: number | string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <p className="text-sm font-medium text-[var(--sq-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--sq-ink)]">{value}</p>
    </div>
  );
}

function RestaurantBadge({ status }: { status: string }) {
  const variant = status === "active" ? "active" : status === "suspended" ? "error" : "inactive";
  return <StatusBadge status={variant} label={labels[status] ?? status} />;
}

function AccountBadge({ status }: { status: string | null }) {
  if (!status) {
    return <StatusBadge status="neutral" label="Sin cuenta" />;
  }

  const variant =
    status === "active"
      ? "active"
      : status === "demo" || status === "pilot"
        ? "pending"
        : status === "paused"
          ? "paused"
          : "inactive";

  return <StatusBadge status={variant} label={labels[status] ?? status} />;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "No disponible";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "No disponible";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
