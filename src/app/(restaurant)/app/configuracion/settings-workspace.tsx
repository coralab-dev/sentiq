"use client";

import { Building2, CircleHelp, MapPinned, MonitorSmartphone, QrCode, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { isSettingsRouteActive, settingsNavigationGroups } from "./settings-navigation";

const icons = {
  "/app/configuracion/cuenta": Building2,
  "/app/configuracion/preguntas": CircleHelp,
  "/app/configuracion/qr": QrCode,
  "/app/configuracion/dispositivos": MonitorSmartphone,
  "/app/configuracion/zonas": MapPinned,
  "/app/configuracion/usuarios": Users,
  "/app/configuracion/meseros": UserRound,
} as const;

export function SettingsWorkspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeItem = settingsNavigationGroups.flatMap((group) => group.items).find((item) => isSettingsRouteActive(pathname, item.href));

  return (
    <div className="mx-auto grid w-full max-w-[96rem] gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:gap-8">
      <aside className="min-w-0">
        <div className="lg:sticky lg:top-28">
          <label className="block lg:hidden"><span className="mb-2 block text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-[var(--sq-muted)]">Sección de configuración</span><select value={activeItem?.href ?? ""} onChange={(event) => { if (event.target.value) router.push(event.target.value); }} className="h-11 w-full rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 text-sm font-semibold text-[var(--sq-ink)] outline-none focus:border-[var(--sq-coral)] focus:ring-2 focus:ring-[var(--sq-coral)]/15"><option value="">Resumen de configuración</option>{settingsNavigationGroups.map((group) => <optgroup key={group.label} label={group.label}>{group.items.map((item) => <option key={item.href} value={item.href}>{item.label}</option>)}</optgroup>)}</select></label>
          <nav aria-label="Configuración del restaurante" className="hidden space-y-6 lg:block">
            {settingsNavigationGroups.map((group) => <div key={group.label}><p className="px-3 text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--sq-muted)]">{group.label}</p><div className="mt-2 space-y-1">{group.items.map((item) => { const Icon = icons[item.href as keyof typeof icons]; const active = isSettingsRouteActive(pathname, item.href); return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[var(--sq-muted)] transition hover:bg-[var(--sq-surface)] hover:text-[var(--sq-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sq-coral)]", active && "bg-[var(--sq-surface)] text-[var(--sq-ink)] shadow-[inset_2px_0_0_var(--sq-coral)]")}><Icon className="size-4" aria-hidden="true" />{item.label}</Link>; })}</div></div>)}
          </nav>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
