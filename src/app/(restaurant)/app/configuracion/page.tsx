import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PageHeader, SectionCard } from "@/components/panel";

import { settingsNavigationGroups } from "./settings-navigation";

export default function RestaurantSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administración" title="Configuración" description="Organiza el restaurante, los puntos de captura y el acceso del equipo desde un solo lugar." />
      <div className="space-y-5">
        {settingsNavigationGroups.map((group) => (
          <SectionCard key={group.label} title={group.label} contentClassName="p-0">
            <div className="divide-y divide-[var(--sq-line)]">
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className="group flex min-h-20 items-center justify-between gap-4 px-5 py-4 transition hover:bg-[var(--sq-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--sq-coral)] sm:px-6">
                  <span className="min-w-0"><span className="block font-semibold text-[var(--sq-ink)]">{item.label}</span><span className="mt-1 block text-sm text-[var(--sq-muted)]">{item.description}</span></span>
                  <ArrowRight className="size-4 shrink-0 text-[var(--sq-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--sq-coral)]" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
