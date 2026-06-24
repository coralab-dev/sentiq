import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Home,
  MessageSquareText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

const featureItems = [
  {
    icon: MessageSquareText,
    title: "Captura simple",
    body: "Feedback claro desde cada visita.",
  },
  {
    icon: TrendingUp,
    title: "Señales operativas",
    body: "Identifica patrones y oportunidades.",
  },
  {
    icon: CheckCircle2,
    title: "Acciones con foco",
    body: "Sigue lo importante y mide lo que mejora.",
  },
];

const navItems = [
  { icon: Home, label: "Resumen", active: true },
  { icon: MessageSquareText, label: "Opiniones" },
  { icon: TrendingUp, label: "Señales" },
  { icon: CheckCircle2, label: "Acciones" },
  { icon: BarChart3, label: "Exportación" },
];

const summaryItems = [
  {
    label: "Opiniones",
    helper: "Nuevas hoy",
    icon: MessageSquareText,
    tone: "teal",
  },
  {
    label: "Señales",
    helper: "A revisar",
    icon: TrendingUp,
    tone: "sky",
  },
  {
    label: "Acciones",
    helper: "En progreso",
    icon: CheckCircle2,
    tone: "emerald",
  },
];

const recentItems = [
  {
    icon: MessageSquareText,
    title: "Servicio atento y amable",
    meta: "Hoy · Comedor",
    tone: "bg-teal-400/15 text-teal-300",
  },
  {
    icon: TrendingUp,
    title: "Tiempo de espera elevado",
    meta: "Hoy · Comedor",
    tone: "bg-sky-400/15 text-sky-300",
  },
  {
    icon: CheckCircle2,
    title: "Seguimiento completado",
    meta: "Hoy · Barra",
    tone: "bg-emerald-400/15 text-emerald-300",
  },
];

const flowItems = [
  {
    icon: MessageSquareText,
    title: "Se recibe la opinión",
    body: "Cliente comparte su experiencia.",
  },
  {
    icon: TrendingUp,
    title: "Se detecta la señal",
    body: "El sistema identifica lo importante.",
  },
  {
    icon: CheckCircle2,
    title: "Se toma acción",
    body: "El equipo responde y da seguimiento.",
  },
  {
    icon: BarChart3,
    title: "Se mide el impacto",
    body: "Verificamos la mejora.",
  },
];

function getToneClass(tone: string) {
  if (tone === "sky") {
    return "bg-sky-400/15 text-sky-300";
  }

  if (tone === "emerald") {
    return "bg-emerald-400/15 text-emerald-300";
  }

  return "bg-teal-400/15 text-teal-300";
}

function getRecentMeta(title: string) {
  return title === "Seguimiento completado" ? "Hoy · Barra" : "Hoy · Comedor";
}

export default function PublicHomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <section className="relative isolate min-h-screen">
        <div className="absolute inset-0 -z-10 bg-slate-50 lg:bg-[linear-gradient(90deg,#f8fafc_0%,#f8fafc_47%,#0f172a_47%,#0f172a_100%)]" />
        <div className="absolute left-0 top-0 -z-10 h-full w-full bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,245,249,0.78))] lg:w-[47%]" />
        <div className="absolute right-0 top-[100px] -z-10 hidden h-[calc(100%-100px)] w-[53%] bg-[radial-gradient(circle_at_42%_12%,rgba(14,165,233,0.22),transparent_28%),radial-gradient(circle_at_78%_78%,rgba(20,184,166,0.24),transparent_32%),linear-gradient(135deg,#0f172a,#082f49_52%,#134e4a)] lg:block" />

        <header className="flex min-h-[88px] flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:h-[100px] sm:px-10 sm:py-0 lg:px-[92px]">
          <Link href="/" className="text-2xl font-semibold tracking-normal sm:text-3xl">
            SentiQ
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium sm:gap-4">
            <Link
              className={buttonVariants({
                variant: "ghost",
                className: "px-2 text-slate-800 hover:bg-slate-100 sm:px-2.5",
              })}
              href="/privacidad"
            >
              Aviso de privacidad
            </Link>
            <Link
              className={buttonVariants({
                size: "lg",
                className:
                  "h-10 bg-teal-700 px-4 text-white hover:bg-teal-800 focus-visible:ring-teal-600/25 sm:h-12 sm:px-8",
              })}
              href="/login"
            >
              Iniciar sesión
            </Link>
          </nav>
        </header>

        <div className="grid min-h-[calc(100vh-88px)] sm:min-h-[calc(100vh-100px)] lg:grid-cols-[47%_53%]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-[92px]">
            <div className="mb-9 flex items-center gap-4 text-lg font-medium text-teal-900">
              <span className="h-px w-16 bg-teal-800" />
              <span>Demo pública · Fase 2</span>
            </div>

            <h1 className="max-w-[620px] text-[46px] font-semibold leading-[1.04] tracking-normal text-slate-950 sm:text-[72px] xl:text-[80px]">
              Feedback para restaurantes
            </h1>

            <p className="mt-8 max-w-2xl text-2xl leading-9 text-slate-600">
              Convierte opiniones en seguimiento operativo.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                className={buttonVariants({
                  size: "lg",
                  className:
                    "h-12 bg-teal-700 px-6 text-base text-white hover:bg-teal-800 focus-visible:ring-teal-600/25 sm:h-14 sm:px-8",
                })}
                href="/login"
              >
                Iniciar sesión
                <ArrowRight className="size-5" />
              </Link>
              <Link
                className="inline-flex h-14 items-center gap-3 px-4 text-base font-medium text-teal-900 underline underline-offset-4 transition hover:text-teal-700"
                href="/privacidad"
              >
                Aviso de privacidad
                <ChevronRight className="size-5" />
              </Link>
            </div>

            <div className="mt-12 grid max-w-3xl gap-7 border-t border-slate-200 pt-8 sm:grid-cols-3">
              {featureItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    className={
                      index === 0
                        ? "space-y-5"
                        : "space-y-5 border-slate-200 sm:border-l sm:pl-8"
                    }
                    key={item.title}
                  >
                    <div className="grid size-14 place-items-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                      <Icon className="size-6" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-950">
                        {item.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative min-h-[620px] overflow-hidden px-6 py-10 sm:min-h-[calc(100vh-100px)] sm:px-10 lg:px-0">
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(15,23,42,0.24),rgba(15,23,42,0.74)),radial-gradient(ellipse_at_28%_30%,rgba(236,253,245,0.46),transparent_19%),radial-gradient(ellipse_at_21%_56%,rgba(15,118,110,0.42),transparent_16%),radial-gradient(ellipse_at_68%_16%,rgba(148,163,184,0.34),transparent_24%),linear-gradient(90deg,rgba(15,23,42,0.18)_1px,transparent_1px),linear-gradient(0deg,rgba(15,23,42,0.16)_1px,transparent_1px),linear-gradient(135deg,#e0f2fe_0%,#0f766e_31%,#0f172a_62%,#042f2e_100%)] bg-[length:auto,auto,auto,auto,56px_56px,56px_56px,auto]" />
            <div className="absolute bottom-0 right-0 h-[32%] w-full bg-[linear-gradient(8deg,rgba(15,23,42,0.92),rgba(15,118,110,0.58)_52%,transparent_53%),repeating-linear-gradient(92deg,rgba(255,255,255,0.14)_0_2px,transparent_2px_118px)]" />

            <div className="absolute left-[8%] top-[10%] h-[58%] w-[39%] overflow-hidden rounded-lg border border-white/45 bg-[linear-gradient(135deg,rgba(240,253,250,0.86),rgba(14,116,144,0.32)_42%,rgba(15,23,42,0.2)),radial-gradient(circle_at_66%_24%,rgba(255,255,255,0.72),transparent_14%),linear-gradient(90deg,rgba(15,23,42,0.24)_1px,transparent_1px),linear-gradient(0deg,rgba(15,23,42,0.18)_1px,transparent_1px)] bg-[length:auto,auto,44px_44px,44px_44px] shadow-2xl shadow-slate-950/30">
              <div className="absolute bottom-0 h-1/2 w-full bg-gradient-to-t from-slate-950/45 to-transparent" />
              <div className="absolute left-8 top-8 h-16 w-16 rounded-full border border-white/50 bg-white/30 backdrop-blur" />
              <div className="absolute bottom-10 left-8 h-2 w-28 bg-white/70" />
            </div>

            <div className="absolute right-0 top-[7%] w-[78%] max-w-[760px] overflow-hidden rounded-lg border border-white/15 bg-slate-950/94 text-white shadow-2xl shadow-slate-950/35 backdrop-blur">
              <div className="border-b border-white/10 px-7 py-5 text-2xl font-semibold">
                SentiQ
              </div>

              <div className="grid min-h-[430px] grid-cols-[172px_1fr]">
                <aside className="border-r border-white/10 p-5">
                  <div className="space-y-2">
                    {navItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          className={
                            item.active
                              ? "flex items-center gap-3 rounded-md bg-teal-700/35 px-3 py-2.5 text-sm text-white"
                              : "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-300"
                          }
                          key={item.label}
                        >
                          <Icon className="size-4" />
                          {item.label}
                        </div>
                      );
                    })}
                  </div>
                </aside>

                <div className="p-7">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">
                        Resumen operativo
                      </h2>
                      <p className="mt-2 text-sm text-slate-400">
                        Vista general de lo que está pasando.
                      </p>
                    </div>
                    <ShieldCheck className="size-5 text-sky-300" />
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {summaryItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                          key={item.label}
                        >
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {item.helper}
                          </p>
                          <div
                            className={`mt-6 grid size-10 place-items-center rounded-md ${getToneClass(item.tone)}`}
                          >
                            <Icon className="size-5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-semibold">Lo más reciente</p>
                    <div className="mt-4 divide-y divide-white/10">
                      {recentItems.map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            className="flex items-center gap-4 py-3"
                            key={item.title}
                          >
                            <div
                              className={`grid size-10 place-items-center rounded-md ${item.tone}`}
                            >
                              <Icon className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">
                                {item.title}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {getRecentMeta(item.title)}
                              </p>
                            </div>
                            <ChevronRight className="size-4 text-slate-500" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-[16%] left-[8%] w-[330px] rounded-lg border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl shadow-slate-950/25">
              <p className="text-lg font-semibold">Flujo de feedback</p>
              <div className="mt-6 space-y-5">
                {flowItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      className="grid grid-cols-[40px_1fr] gap-3"
                      key={item.title}
                    >
                      <div className="grid size-9 place-items-center rounded-full bg-teal-700 text-white ring-4 ring-teal-50">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
