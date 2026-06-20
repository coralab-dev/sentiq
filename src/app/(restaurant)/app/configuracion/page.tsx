import {
  ArrowRight,
  CircleHelp,
  MapPinned,
  MonitorSmartphone,
  QrCode,
  Users,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/panel";
import { StatusBadge } from "@/components/shared";
import { ROUTES } from "@/config/routes";

const settingsSections = [
  {
    title: "QR por sucursal",
    description: "Consulta y regenera el enlace QR publico de cada sucursal.",
    href: ROUTES.APP_SETTINGS_QR,
    icon: QrCode,
    available: true,
  },
  {
    title: "Dispositivos",
    description: "Administra los dispositivos usados para capturar feedback.",
    href: ROUTES.APP_SETTINGS_DEVICES,
    icon: MonitorSmartphone,
    available: true,
  },
  {
    title: "Preguntas",
    description: "Configura las preguntas visibles en la encuesta.",
    href: ROUTES.APP_SETTINGS_QUESTIONS,
    icon: CircleHelp,
    available: true,
  },
  {
    title: "Usuarios y gerentes",
    description: "Gestiona usuarios y el alcance asignado a gerentes.",
    href: ROUTES.APP_SETTINGS_USERS,
    icon: Users,
    available: false,
  },
  {
    title: "Zonas",
    description: "Organiza las zonas operativas de cada sucursal.",
    href: ROUTES.APP_SETTINGS_ZONES,
    icon: MapPinned,
    available: false,
  },
] as const;

export default function RestaurantSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuracion"
        description="Administra las opciones operativas disponibles para tu restaurante."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;

          return (
            <Link
              key={section.href}
              href={section.href}
              className="group flex min-h-48 flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-11 place-items-center rounded-lg bg-teal-50 text-teal-700">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {section.available ? (
                  <StatusBadge status="active" label="Disponible" />
                ) : (
                  <StatusBadge status="pending" label="Pendiente" />
                )}
              </div>

              <div className="mt-5 flex-1">
                <h2 className="font-semibold text-slate-950">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {section.description}
                </p>
              </div>

              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
                Abrir configuracion
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
