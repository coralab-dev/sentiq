"use client";

import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable, PageHeader, SectionCard } from "@/components/panel";
import { EmptyState, LoadingState, StatusBadge } from "@/components/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isValidRestaurantId, loadRestaurantDetailData, type RestaurantDetailData } from "./restaurant-detail-data";

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });
const labels: Record<string, string> = { active: "Activo", inactive: "Inactivo", suspended: "Suspendido", invited: "Invitado", demo: "Demo", pilot: "Piloto", paused: "Pausado", cancelled: "Cancelado" };

export function RestaurantDetailClient() {
  const restaurantId = useSearchParams().get("id");
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [data, setData] = useState<RestaurantDetailData | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "not_found" | "invalid_id" | "error">(() => isValidRestaurantId(restaurantId) ? "loading" : "invalid_id");
  const load = useCallback(async () => {
    if (!isValidRestaurantId(restaurantId)) { setStatus("invalid_id"); return; }
    setStatus("loading");
    try { const result = await loadRestaurantDetailData(supabase, restaurantId); setData(result); setStatus(result ? "success" : "not_found"); }
    catch { setStatus("error"); }
  }, [restaurantId, supabase]);
  useEffect(() => { void load(); }, [load]);

  if (status === "loading") return <LoadingState title="Cargando detalle" description="Consultando cuenta, sucursales y actividad agregada." />;
  if (status === "invalid_id") return <State title="Identificador inválido" description="Abre el detalle desde el listado de restaurantes." />;
  if (status === "not_found") return <State title="Restaurante no encontrado" description="El restaurante no existe o no tienes permiso para consultarlo." />;
  if (status === "error") return <State title="No se pudo cargar el restaurante" description="Verifica tu conexión e intenta nuevamente." retry={() => void load()} />;
  if (!data) return null;

  const { restaurant, account, branches, administrators, aggregates } = data;
  return <div className="space-y-6">
    <PageHeader eyebrow="Administración de plataforma" title="Detalle de restaurante" description={`${restaurant.name} · ${restaurant.slug}`} actions={<BackLink />} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Summary title="Estado cuenta"><AccountBadge status={account?.accountStatus ?? null} /></Summary><Summary title="Plan" value={account?.planCode ?? "Sin plan"} /><Summary title="Sucursales activas" value={`${aggregates.activeBranchCount}/${aggregates.branchCount}`} /><Summary title="Usuarios activos" value={`${aggregates.activeUserCount}/${aggregates.userCount}`} /><Summary title="Última actividad" value={formatDateTime(data.lastActivityAt)} compact /></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Datos generales"><DefinitionList items={[["Nombre", restaurant.name], ["Slug", restaurant.slug], ["Contacto administrativo", restaurant.contactEmail ?? "Sin email"], ["Estado", <RestaurantBadge key="restaurant-status" status={restaurant.status} />], ["Fecha de alta", formatDate(restaurant.createdAt)], ["Última actualización", formatDateTime(restaurant.updatedAt)]]} /></SectionCard>
      <SectionCard title="Cuenta / plan"><DefinitionList items={[["Plan", account?.planCode ?? "Sin plan"], ["Estado de cuenta", <AccountBadge key="account-status" status={account?.accountStatus ?? null} />], ["Fecha de inicio", formatDate(account?.startedAt ?? null)], ["Fecha de cancelación", formatDate(account?.cancelledAt ?? null)]]} /></SectionCard>
    </div>
    <SectionCard title="Sucursales" description="Información operativa sin teléfonos internos." contentClassName="p-0"><DataTable columns={[{ key: "name", header: "Nombre" }, { key: "slug", header: "Slug" }, { key: "status", header: "Estado" }, { key: "created", header: "Fecha de alta" }]} rows={branches.map((branch) => ({ id: branch.id, cells: { name: branch.name, slug: branch.slug, status: <RestaurantBadge status={branch.status} />, created: formatDate(branch.createdAt) } }))} emptyState={<EmptyState title="Sin sucursales" description="Este restaurante no tiene sucursales visibles." />} /></SectionCard>
    <SectionCard title="Administrador principal" description="Solo perfiles con rol restaurant_admin." contentClassName="p-0"><DataTable columns={[{ key: "name", header: "Nombre" }, { key: "email", header: "Email" }, { key: "status", header: "Estado" }, { key: "created", header: "Fecha de alta" }]} rows={administrators.map((admin) => ({ id: admin.id, cells: { name: admin.fullName, email: admin.email, status: <UserBadge status={admin.status} />, created: formatDate(admin.createdAt) } }))} emptyState={<EmptyState title="Sin administrador" description="No hay un restaurant_admin visible para este restaurante." />} /></SectionCard>
    <SectionCard title="Actividad agregada" description="Conteos operativos seguros; no incluye respuestas, comentarios ni teléfonos."><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Dispositivos" value={aggregates.deviceCount} /><Metric label="Dispositivos activos" value={aggregates.activeDeviceCount} /><Metric label="Survey links activos" value={aggregates.activeSurveyLinkCount} /><Metric label="Usuarios invitados" value={aggregates.invitedUserCount} /></div></SectionCard>
  </div>;
}

function State({ title, description, retry }: { title: string; description: string; retry?: () => void }) { return <EmptyState title={title} description={description} icon={<AlertTriangle className="size-6" />} action={<div className="flex flex-wrap justify-center gap-2">{retry ? <Button onClick={retry}><RefreshCw />Reintentar</Button> : null}<BackLink /></div>} />; }
function BackLink() { return <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.PLATFORM_ADMIN_RESTAURANTS}><ArrowLeft />Volver a restaurantes</Link>; }
function Summary({ title, value, compact, children }: { title: string; value?: string; compact?: boolean; children?: React.ReactNode }) { return <SectionCard title={title}><div className={compact ? "text-sm font-semibold text-slate-950" : "text-2xl font-semibold text-slate-950"}>{children ?? value}</div></SectionCard>; }
function DefinitionList({ items }: { items: Array<[string, React.ReactNode]> }) { return <dl className="space-y-3">{items.map(([label, value]) => <div key={label} className="grid gap-1 sm:grid-cols-[10rem_1fr]"><dt className="text-sm text-slate-500">{label}</dt><dd className="text-sm font-medium text-slate-900">{value}</dd></div>)}</dl>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p></div>; }
function RestaurantBadge({ status }: { status: string }) { return <StatusBadge status={status === "active" ? "active" : status === "suspended" ? "error" : "inactive"} label={labels[status] ?? status} />; }
function AccountBadge({ status }: { status: string | null }) { if (!status) return <StatusBadge status="neutral" label="Sin cuenta" />; return <StatusBadge status={status === "active" ? "active" : status === "demo" || status === "pilot" ? "pending" : status === "paused" ? "paused" : "inactive"} label={labels[status] ?? status} />; }
function UserBadge({ status }: { status: string }) { return <StatusBadge status={status === "active" ? "active" : status === "invited" ? "pending" : "inactive"} label={labels[status] ?? status} />; }
function formatDate(value: string | null) { return value ? dateFormatter.format(new Date(value)) : "Sin fecha"; }
function formatDateTime(value: string | null) { return value ? dateTimeFormatter.format(new Date(value)) : "Sin actividad"; }
