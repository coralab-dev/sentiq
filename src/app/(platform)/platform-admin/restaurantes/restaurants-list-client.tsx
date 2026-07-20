"use client";

import { AlertTriangle, Eye, Plus, RefreshCw, Store } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable, PageHeader, SectionCard } from "@/components/panel";
import { EmptyState, LoadingState, StatusBadge } from "@/components/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { loadRestaurantsListData, getRestaurantsSummary, type RestaurantListItem } from "./restaurants-list-data";

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });
const statusLabels: Record<string, string> = { active: "Activo", inactive: "Inactivo", suspended: "Suspendido", demo: "Demo", pilot: "Piloto", paused: "Pausado", cancelled: "Cancelado" };

export function RestaurantsListClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<RestaurantListItem[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const load = useCallback(async () => { setStatus("loading"); try { setItems(await loadRestaurantsListData(supabase)); setStatus("success"); } catch { setStatus("error"); } }, [supabase]);
  useEffect(() => { void load(); }, [load]);
  if (status === "loading") return <LoadingState title="Cargando restaurantes" description="Consultando cuentas, sucursales y usuarios." />;
  if (status === "error") return <EmptyState title="No se pudieron cargar los restaurantes" description="Verifica tu conexión e intenta nuevamente." icon={<AlertTriangle className="size-6" />} action={<Button onClick={() => void load()}><RefreshCw />Reintentar</Button>} />;
  const summary = getRestaurantsSummary(items);
  return <div className="space-y-6"><PageHeader eyebrow="Administracion de plataforma" title="Restaurantes" description="Consulta el estado operativo de los restaurantes clientes sin exponer datos sensibles." actions={<Link className={buttonVariants()} href={ROUTES.PLATFORM_ADMIN_RESTAURANT_NEW}><Plus />Nuevo restaurante</Link>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Summary title="Total restaurantes" value={summary.total} /><Summary title="Activos" value={summary.active} /><Summary title="Demo / piloto" value={summary.demoPilot} /><Summary title="Inactivos / suspendidos" value={summary.inactiveSuspended} /></div>
    <DataTable columns={[{ key: "restaurant", header: "Restaurante" }, { key: "contact", header: "Contacto administrativo" }, { key: "plan", header: "Plan" }, { key: "account", header: "Cuenta" }, { key: "status", header: "Restaurante" }, { key: "branches", header: "Sucursales" }, { key: "users", header: "Usuarios" }, { key: "responses", header: "Respuestas" }, { key: "alerts", header: "Alertas" }, { key: "created", header: "Fecha de alta" }, { key: "activity", header: "Última actividad" }]} rows={items.map((item) => ({ id: item.id, cells: { restaurant: <div><p className="font-medium text-slate-950">{item.name}</p><p className="text-xs text-slate-500">{item.slug}</p></div>, contact: item.contactEmail ?? "Sin email", plan: item.planCode ?? "Sin plan", account: <AccountBadge status={item.accountStatus} />, status: <RestaurantBadge status={item.restaurantStatus} />, branches: `${item.activeBranchCount}/${item.branchCount} activas`, users: `${item.activeUserCount}/${item.userCount} activos`, responses: item.activityAvailable ? item.responseCount : "No disponible", alerts: item.activityAvailable ? `${item.alertCount} (${item.pendingAlertCount} pendientes)` : "No disponible", created: formatDate(item.createdAt), activity: formatDateTime(item.lastActivityAt) }, actions: <div className="flex flex-wrap gap-2"><Link className={buttonVariants({ variant: "ghost", size: "sm" })} href={`${ROUTES.PLATFORM_ADMIN_RESTAURANT_DETAIL}?id=${encodeURIComponent(item.id)}`}><Eye />Ver detalle</Link><Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`${ROUTES.PLATFORM_ADMIN_RESTAURANT_DETAIL}?id=${encodeURIComponent(item.id)}`}>Editar plan</Link></div> }))} emptyState={<EmptyState title="Aún no hay restaurantes" description="Crea el primer restaurante cliente para comenzar." icon={<Store className="size-6" />} action={<Link className={buttonVariants()} href={ROUTES.PLATFORM_ADMIN_RESTAURANT_NEW}><Plus />Nuevo restaurante</Link>} />} actionsHeader="Acciones" />
  </div>;
}
function Summary({ title, value }: { title: string; value: number }) { return <SectionCard title={title}><p className="text-3xl font-semibold text-slate-950">{value}</p></SectionCard>; }
function RestaurantBadge({ status }: { status: string }) { const variant = status === "active" ? "active" : status === "suspended" ? "error" : "inactive"; return <StatusBadge status={variant} label={statusLabels[status] ?? status} />; }
function AccountBadge({ status }: { status: string | null }) { if (!status) return <StatusBadge status="neutral" label="Sin cuenta" />; const variant = status === "active" ? "active" : status === "demo" || status === "pilot" ? "pending" : status === "paused" ? "paused" : "inactive"; return <StatusBadge status={variant} label={statusLabels[status] ?? status} />; }
function formatDate(value: string | null) { return value ? dateFormatter.format(new Date(value)) : "Sin fecha"; }
function formatDateTime(value: string | null) { return value ? dateTimeFormatter.format(new Date(value)) : "Sin actividad"; }
