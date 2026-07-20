"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarDays,
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
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import {
  canShowPhone,
  clampRating,
  formatDateTime,
  formatSource,
  isValidUuid,
  loadResponseDetail,
  type ResponseDetail,
} from "./response-detail-data";

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
    return <StatusBadge status="attended" />;
  }

  return <StatusBadge status="pending" />;
}

export function ResponseDetailClient() {
  const searchParams = useSearchParams();
  const responseId = searchParams.get("id");
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [detail, setDetail] = useState<ResponseDetail | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!isValidUuid(responseId)) {
      setDetail(null);
      setStatus(responseId ? "error" : "idle");
      return;
    }

    setStatus("loading");
    setIsRefreshing(true);

    try {
      const nextDetail = await loadResponseDetail(supabase, responseId);
      setDetail(nextDetail);
      setStatus(nextDetail ? "success" : "not_found");
    } catch {
      setDetail(null);
      setStatus("error");
    } finally {
      setIsRefreshing(false);
    }
  }, [responseId, supabase]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (!responseId) {
    return (
      <EmptyState
        title="Falta el ID de la respuesta"
        description="Abre el detalle desde el listado o agrega el parametro id a la URL."
        icon={<MessageSquareText className="size-6" aria-hidden="true" />}
        action={
          <Link
            href={ROUTES.APP_RESPONSES}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a respuestas
          </Link>
        }
      />
    );
  }

  if (!isValidUuid(responseId)) {
    return (
      <EmptyState
        title="ID de respuesta invalido"
        description="El identificador recibido no tiene el formato esperado."
        icon={<AlertTriangle className="size-6" aria-hidden="true" />}
        action={
          <Link
            href={ROUTES.APP_RESPONSES}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a respuestas
          </Link>
        }
      />
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <LoadingState
        title="Cargando detalle"
        description="Estamos consultando la respuesta visible para tu usuario."
      />
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        title="No se pudo cargar la respuesta"
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
        title="Respuesta no disponible"
        description="No encontramos esta respuesta o ya no tienes acceso a ella."
        icon={<Store className="size-6" aria-hidden="true" />}
        action={
          <Link
            href={ROUTES.APP_RESPONSES}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[var(--sq-aubergine)] px-4 text-sm font-semibold text-white transition hover:bg-[#3c1949]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a respuestas
          </Link>
        }
      />
    );
  }

  const { response, alert, branch, zone } = detail;
  const phoneAllowed = canShowPhone(response);
  const phoneValue = phoneAllowed ? response.customer_phone : "No disponible";
  const comment = response.comment?.trim();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Respuestas"
        title="Detalle de respuesta"
        description="Revisa la experiencia completa y el contexto en el que se recibió."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={ROUTES.APP_RESPONSES}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-4 text-sm font-semibold text-[var(--sq-ink)] transition hover:bg-[var(--sq-soft)]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Volver a respuestas
            </Link>
            <Button
              type="button"
              onClick={() => void loadDetail()}
              disabled={isRefreshing}
              className="bg-[var(--sq-aubergine)] text-white hover:bg-[#3c1949]"
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

      <SectionCard title="Informacion general">
        <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <DetailItem
            label="Fecha"
            value={formatDateTime(response.created_at)}
          />
          <DetailItem
            label="Sucursal"
            value={branch?.name ?? "Sucursal no disponible"}
          />
          <DetailItem label="Zona" value={zone?.name ?? "No disponible"} />
          <DetailItem
            label="Origen"
            value={
              <span className="inline-flex items-center gap-1.5">
                <QrCode className="size-4 text-slate-500" aria-hidden="true" />
                {formatSource(response.source)}
              </span>
            }
          />
        </dl>
      </SectionCard>

      <div className="overflow-hidden rounded-2xl border border-[var(--sq-line)] bg-[var(--sq-surface)] sm:grid sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Experiencia general"
          value={<RatingScore value={clampRating(response.general_experience)} />}
          helper="Calificación de 1 a 5"
          variant={response.general_experience <= 2 ? "danger" : "success"}
          icon={<CalendarDays className="size-5" aria-hidden="true" />}
        />
        <MetricCard
          label="Atención"
          value={<RatingScore value={clampRating(response.service_attention)} />}
          helper="Calificación de 1 a 5"
          variant="info"
          icon={<Bell className="size-5" aria-hidden="true" />}
        />
        <MetricCard
          label="Alimentos/bebidas"
          value={<RatingScore value={clampRating(response.food_quality)} />}
          helper="Calificación de 1 a 5"
          variant="success"
          icon={<Store className="size-5" aria-hidden="true" />}
        />
        <MetricCard
          label="Rapidez"
          value={<RatingScore value={clampRating(response.service_speed)} />}
          helper="Calificación de 1 a 5"
          variant="neutral"
          icon={<RefreshCw className="size-5" aria-hidden="true" />}
        />
      </div>

      <SectionCard title="Comentario">
        {comment ? (
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {comment}
          </p>
        ) : (
          <EmptyState
            title="Sin comentario"
            description="Esta respuesta no incluye comentario abierto."
            className="border-0 p-0"
          />
        )}
      </SectionCard>

      <SectionCard
        title="Seguimiento"
        actions={
          alert ? (
            <Link
              href={`${ROUTES.APP_ALERT_DETAIL}?id=${alert.id}`}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Bell className="size-4" aria-hidden="true" />
              Ver alerta
            </Link>
          ) : null
        }
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailItem
          label="Teléfono"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-4 text-slate-500" aria-hidden="true" />
                  {phoneValue}
                </span>
              }
            />
            <DetailItem
              label="Consentimiento"
              value={response.consent_to_contact ? "Aceptado" : "No aceptado"}
            />
            <DetailItem
              label="Alerta"
              value={
                response.has_alert ? (
                  <StatusBadge status="pending" label="Con alerta" />
                ) : (
                  <StatusBadge status="completed" label="Sin alerta" />
                )
              }
            />
            <DetailItem
              label="Texto de consentimiento"
              value={response.consent_text_snapshot ?? "No disponible"}
            />
          </dl>

          <div className="rounded-lg border border-slate-200 p-4">
            {alert ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="ID de alerta" value={alert.id} />
                <DetailItem
                  label="Estado"
                  value={getAlertStatusBadge(alert.status)}
                />
                <DetailItem
                  label="Creada"
                  value={formatDateTime(alert.created_at)}
                />
                <DetailItem
                  label="Actualizada"
                  value={formatDateTime(alert.updated_at)}
                />
                <DetailItem
                  label="Atendida"
                  value={formatDateTime(alert.attended_at)}
                />
                <DetailItem
                  label="Nota interna"
                  value={alert.internal_note?.trim() || "No disponible"}
                />
              </dl>
            ) : (
              <EmptyState
                title="Sin alerta asociada"
                description="Esta respuesta no tiene alerta visible."
                className="border-0 p-0"
              />
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
