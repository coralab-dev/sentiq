"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MessageSquareText,
  Phone,
  QrCode,
  RefreshCw,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MetricCard, PageHeader, RatingScore, SectionCard } from "@/components/panel";
import { EmptyState, LoadingState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import type { UpdateAlertStatusResponse } from "@/types/edge-functions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import {
  canShowPhone,
  clampRating,
  formatDateTime,
  formatSource,
  getAttendedByLabel,
  isValidUuid,
  loadAlertDetail,
  type AlertDetail,
} from "./alert-detail-data";

type LoadStatus = "idle" | "loading" | "success" | "not_found" | "error";

type DetailItemProps = {
  label: string;
  value: React.ReactNode;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </dt>
      <dd className="text-sm font-medium text-slate-950">{value}</dd>
    </div>
  );
}

function getAlertStatusBadge(status: string) {
  if (status === "attended") {
    return <StatusBadge status="attended" label="Atendida" />;
  }

  return <StatusBadge status="pending" label="Pendiente" />;
}

export function AlertDetailClient() {
  const searchParams = useSearchParams();
  const alertId = searchParams.get("id");
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [detail, setDetail] = useState<AlertDetail | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!isValidUuid(alertId)) {
      setDetail(null);
      setStatus(alertId ? "error" : "idle");
      return;
    }

    setStatus("loading");
    setIsRefreshing(true);

    try {
      const nextDetail = await loadAlertDetail(supabase, alertId);
      setDetail(nextDetail);
      setStatus(nextDetail ? "success" : "not_found");
    } catch {
      setDetail(null);
      setStatus("error");
    } finally {
      setIsRefreshing(false);
    }
  }, [alertId, supabase]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  async function markAttended() {
    if (!isValidUuid(alertId)) {
      return;
    }

    setActionMessage(null);
    setActionError(null);
    setIsSubmitting(true);

    try {
      const { data: result, error } =
        await supabase.functions.invoke<UpdateAlertStatusResponse>(
          "update_alert_status",
          {
            body: {
              alert_id: alertId,
              status: "attended",
              internal_note: note.trim() || null,
            },
          },
        );

      if (error || result?.ok !== true || result.status !== "attended") {
        throw error ?? new Error("Unexpected response");
      }

      setActionMessage("Alerta marcada como atendida.");
      setNote("");
      await loadDetail();
    } catch {
      setActionError("No pudimos actualizar la alerta. Verifica permisos e intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!alertId) {
    return (
      <EmptyState
        title="Falta el ID de la alerta"
        description="Abre el detalle desde el listado o agrega el parametro id a la URL."
        icon={<Bell className="size-6" aria-hidden="true" />}
        action={
          <Link
            href={ROUTES.APP_ALERTS}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a alertas
          </Link>
        }
      />
    );
  }

  if (!isValidUuid(alertId)) {
    return (
      <EmptyState
        title="ID de alerta invalido"
        description="El identificador recibido no tiene el formato esperado."
        icon={<AlertTriangle className="size-6" aria-hidden="true" />}
        action={
          <Link
            href={ROUTES.APP_ALERTS}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a alertas
          </Link>
        }
      />
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <LoadingState
        title="Cargando alerta"
        description="Estamos consultando la alerta visible para tu usuario."
      />
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        title="No se pudo cargar la alerta"
        description="Intenta actualizar en unos momentos."
        icon={<AlertTriangle className="size-6" aria-hidden="true" />}
        action={
          <Button type="button" onClick={() => void loadDetail()}>
            Reintentar
          </Button>
        }
      />
    );
  }

  if (status === "not_found" || !detail) {
    return (
      <EmptyState
        title="Alerta no disponible"
        description="La alerta no existe o no esta dentro del alcance visible por tu usuario."
        icon={<Store className="size-6" aria-hidden="true" />}
        action={
          <Link
            href={ROUTES.APP_ALERTS}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a alertas
          </Link>
        }
      />
    );
  }

  const { alert, response, branch, zone, device } = detail;
  const isPending = alert.status === "pending";
  const comment = response?.comment?.trim();
  const phoneAllowed = canShowPhone(response);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalle de alerta"
        description="Informacion visible segun RLS y permisos de tu sesion."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={ROUTES.APP_ALERTS}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Volver a alertas
            </Link>
            <Button
              type="button"
              onClick={() => void loadDetail()}
              disabled={isRefreshing || isSubmitting}
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

      {actionMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {actionMessage}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {actionError}
        </div>
      ) : null}

      <SectionCard title="Resumen de alerta">
        <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <DetailItem label="Estado" value={getAlertStatusBadge(alert.status)} />
          <DetailItem label="Fecha creacion" value={formatDateTime(alert.created_at)} />
          <DetailItem label="Sucursal" value={branch?.name ?? "Sucursal no disponible"} />
          <DetailItem label="Zona" value={zone?.name ?? "No disponible"} />
          <DetailItem
            label="Origen"
            value={
              <span className="inline-flex items-center gap-1.5">
                <QrCode className="size-4 text-slate-500" aria-hidden="true" />
                {formatSource(alert.source)}
              </span>
            }
          />
          {device ? <DetailItem label="Dispositivo" value={device.name} /> : null}
          <DetailItem
            label="Experiencia general"
            value={<RatingScore value={clampRating(alert.general_experience)} />}
          />
        </dl>
      </SectionCard>

      <SectionCard
        title="Respuesta relacionada"
        actions={
          response ? (
            <Link
              href={`${ROUTES.APP_RESPONSE_DETAIL}?id=${response.id}`}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <MessageSquareText className="size-4" aria-hidden="true" />
              Ver respuesta
            </Link>
          ) : null
        }
      >
        {response ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Experiencia general"
                value={<RatingScore value={clampRating(response.general_experience)} />}
                helper="Calificacion de 1 a 5"
                variant={response.general_experience <= 2 ? "danger" : "success"}
                icon={<CalendarDays className="size-5" aria-hidden="true" />}
              />
              <MetricCard
                label="Atencion"
                value={<RatingScore value={clampRating(response.service_attention)} />}
                helper="Calificacion de 1 a 5"
                variant="info"
                icon={<Bell className="size-5" aria-hidden="true" />}
              />
              <MetricCard
                label="Alimentos/bebidas"
                value={<RatingScore value={clampRating(response.food_quality)} />}
                helper="Calificacion de 1 a 5"
                variant="success"
                icon={<Store className="size-5" aria-hidden="true" />}
              />
              <MetricCard
                label="Rapidez"
                value={<RatingScore value={clampRating(response.service_speed)} />}
                helper="Calificacion de 1 a 5"
                variant="neutral"
                icon={<RefreshCw className="size-5" aria-hidden="true" />}
              />
            </div>

            <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <DetailItem label="Fecha respuesta" value={formatDateTime(response.created_at)} />
              <DetailItem label="Origen respuesta" value={formatSource(response.source)} />
              <DetailItem
                label="Telefono"
                value={
                  phoneAllowed ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-4 text-slate-500" aria-hidden="true" />
                      {response.customer_phone}
                    </span>
                  ) : (
                    "No disponible"
                  )
                }
              />
              <DetailItem
                label="Texto de consentimiento"
                value={response.consent_text_snapshot ?? "No disponible"}
              />
            </dl>

            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                Comentario
              </h3>
              {comment ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {comment}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Sin comentario.</p>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            title="Respuesta no disponible"
            description="La respuesta asociada no esta visible para tu usuario."
            className="border-0 p-0"
          />
        )}
      </SectionCard>

      <SectionCard title="Seguimiento">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailItem
              label="Nota interna"
              value={alert.internal_note?.trim() || "No disponible"}
            />
            <DetailItem label="Atendida por" value={getAttendedByLabel(detail)} />
            <DetailItem label="Atendida en" value={formatDateTime(alert.attended_at)} />
            <DetailItem label="Actualizada" value={formatDateTime(alert.updated_at)} />
          </dl>

          {isPending ? (
            <div className="rounded-lg border border-slate-200 p-4">
              <label
                htmlFor="alert-internal-note"
                className="text-xs font-semibold uppercase tracking-normal text-slate-500"
              >
                Nota opcional
              </label>
              <textarea
                id="alert-internal-note"
                value={note}
                maxLength={500}
                rows={4}
                disabled={isSubmitting}
                onChange={(event) => setNote(event.target.value)}
                className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:bg-slate-50 disabled:text-slate-400"
                placeholder="Agrega una nota interna"
              />
              <Button
                type="button"
                onClick={() => void markAttended()}
                disabled={isSubmitting}
                className="mt-3 w-full bg-teal-700 text-white hover:bg-teal-800"
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {isSubmitting ? "Actualizando" : "Marcar atendida"}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <ClipboardList className="size-4 text-slate-500" aria-hidden="true" />
                Seguimiento cerrado
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Esta alerta ya fue atendida. La nota interna se muestra solo en modo lectura.
              </p>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
