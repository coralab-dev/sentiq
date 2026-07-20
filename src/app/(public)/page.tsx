import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Download,
  MapPin,
  MessageSquareText,
  MonitorSmartphone,
  QrCode,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Store,
  Users,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

const responseRows = [
  {
    title: "Servicio atento",
    detail: "Comentario recibido desde el comedor",
    status: "Revisada",
    tone: "bg-[#eef5b5] text-[#3f4d00]",
  },
  {
    title: "Tiempo de espera",
    detail: "Experiencia marcada para seguimiento",
    status: "Pendiente",
    tone: "bg-[#ffe0d7] text-[#8f2f24]",
  },
  {
    title: "Visita sin comentario",
    detail: "Respuesta recibida desde QR",
    status: "Nueva",
    tone: "bg-[#eee7f0] text-[#38203e]",
  },
];

const settings = [
  { icon: MessageSquareText, label: "Encuesta y textos" },
  { icon: Store, label: "Sucursales" },
  { icon: MapPin, label: "Zonas" },
  { icon: MonitorSmartphone, label: "Dispositivos" },
  { icon: Users, label: "Usuarios" },
];

const sectionPadding = "px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28";
const container = "mx-auto w-full max-w-7xl";

export default function PublicHomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbf7ef] text-[#24102d]">
      <Header />

      <section className="relative isolate min-h-[calc(100svh-5rem)] overflow-hidden bg-[#fbf7ef]">
        <Image
          src="/images/landing/hero-restaurant-editorial.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[68%_center]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-[#fbf7ef]/76 sm:bg-[linear-gradient(90deg,rgba(251,247,239,.99)_0%,rgba(251,247,239,.97)_43%,rgba(251,247,239,.72)_58%,rgba(251,247,239,.08)_86%)]" aria-hidden="true" />
        <div className={`${container} flex min-h-[calc(100svh-5rem)] items-center px-5 py-14 sm:px-8 lg:px-12`}>
          <div className="max-w-4xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
            <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-[#24102d] sm:text-7xl lg:text-[6.4rem]">
              Escucha mejor.
              <span className="block">Decide más rápido<span className="text-[#ff5947]">.</span></span>
            </h1>
            <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-[#5f5660] sm:text-xl">
              Recibe opiniones por QR o dispositivo, identifica experiencias que
              necesitan atención y da seguimiento desde un solo lugar.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <LoginButton className="w-full sm:w-auto" />
              <Link
                href="#como-funciona"
                className="group inline-flex min-h-12 w-full items-center justify-center gap-2 border border-[#38203e]/15 bg-[#fbf7ef]/75 px-5 font-semibold text-[#38203e] backdrop-blur-sm transition hover:border-[#38203e]/35 hover:bg-[#fbf7ef] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff5947]/30 sm:w-auto"
              >
                Ver cómo funciona
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-2 border-t border-[#38203e]/15 pt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#766b75]" aria-label="Funciones principales">
              <span>QR y dispositivo</span><span>Respuestas</span><span>Seguimiento</span>
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionPadding} bg-[#fbf7ef]`}>
        <div className={container}>
          <div className="mb-12 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#ff5947]">El panel</p>
            <h2 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">El servicio, en una sola vista.</h2>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section id="como-funciona" className={`${sectionPadding} scroll-mt-20 border-y border-[#38203e]/10 bg-[#fffdf8]`}>
        <div className={container}>
          <SectionHeading
            eyebrow="Captura"
            title="Recoge feedback donde sucede"
            body="Cada restaurante puede compartir su encuesta mediante un código QR o dejarla disponible en un dispositivo del local."
          />
          <div className="mt-14 grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="order-2 lg:order-1"><SurveyPreview /></div>
            <div className="order-1 max-w-xl lg:order-2">
              <FeatureIcon icon={QrCode} />
              <h3 className="mt-7 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Una invitación simple para cada visita
              </h3>
              <p className="mt-5 text-lg leading-8 text-[#695b68]">
                Configura las preguntas y los textos que verá el cliente. SentiQ
                registra la respuesta en la sucursal correspondiente y, cuando aplica, en la zona configurada.
              </p>
              <ul className="mt-7 space-y-4 text-[#4f4150]">
                <FeatureCheck>Acceso público mediante QR</FeatureCheck>
                <FeatureCheck>Encuesta disponible en dispositivo</FeatureCheck>
                <FeatureCheck>Teléfono opcional y con consentimiento</FeatureCheck>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionPadding} bg-[#f5eddf]`}>
        <div className={container}>
          <SectionHeading
            eyebrow="Respuestas"
            title="Toda respuesta, en contexto"
            body="Consulta el feedback visible para tu usuario y acota la vista por fecha, sucursal y estado operativo."
          />
          <div className="mt-14 grid items-center gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div className="max-w-xl">
              <FeatureIcon icon={MessageSquareText} />
              <h3 className="mt-7 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Comentarios claros para el equipo
              </h3>
              <p className="mt-5 text-lg leading-8 text-[#695b68]">
                Revisa comentarios recientes y abre el detalle de cada respuesta
                sin exponer datos de contacto cuando no existe consentimiento.
              </p>
            </div>
            <ResponsesPreview />
          </div>
        </div>
      </section>

      <section className={`${sectionPadding} bg-[#fffdf8]`}>
        <div className={container}>
          <SectionHeading
            eyebrow="Alertas"
            title="Detecta y da seguimiento"
            body="Las experiencias que requieren atención se organizan en una vista operativa para que el equipo pueda revisarlas y actualizar su estado."
          />
          <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
            <div className="order-2 lg:order-1">
              <AlertPreview />
            </div>
            <div className="order-1 max-w-xl lg:order-2">
              <FeatureIcon icon={ClipboardCheck} />
              <h3 className="mt-7 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Del pendiente al seguimiento completo
              </h3>
              <p className="mt-5 text-lg leading-8 text-[#695b68]">
                Consulta la alerta asociada a una respuesta, registra el avance y
                mantén visible qué necesita atención dentro del restaurante.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionPadding} bg-[#2b1235] text-white`}>
        <div className={container}>
          <SectionHeading
            dark
            eyebrow="Configuración"
            title="SentiQ se adapta a tu operación"
            body="Administra las opciones disponibles para el restaurante desde un panel con acceso controlado."
          />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {settings.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.label}
                  className="group rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-6 transition hover:-translate-y-1 hover:bg-white/[0.09]"
                >
                  <div className={`grid size-12 place-items-center rounded-2xl ${index === 0 ? "bg-[#ff5947] text-white" : "bg-[#d7e75a] text-[#2b1235]"}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-8 text-lg font-semibold">{item.label}</h3>
                  <ArrowRight className="mt-5 size-4 text-white/45 transition group-hover:translate-x-1 group-hover:text-white" aria-hidden="true" />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={`${sectionPadding} bg-[#fbf7ef]`}>
        <div className={`${container} overflow-hidden rounded-[2rem] border border-[#38203e]/10 bg-[#eaf1a5]`}>
          <div className="grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:p-14">
            <div className="grid size-16 place-items-center rounded-2xl bg-[#2b1235] text-white">
              <ShieldCheck className="size-8" aria-hidden="true" />
            </div>
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#536000]">Privacidad</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Feedback con consentimiento y acceso controlado
              </h2>
              <p className="mt-4 leading-7 text-[#485000]">
                El teléfono es opcional, requiere autorización explícita y solo
                puede utilizarse para dar seguimiento a la experiencia reportada.
              </p>
            </div>
            <Link
              href="/privacidad"
              className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-xl border border-[#2b1235]/15 bg-white/60 px-5 font-semibold text-[#2b1235] transition hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#2b1235]/20"
            >
              Leer aviso
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#fbf7ef] px-3 pb-3 sm:px-6 sm:pb-6">
        <div className="mx-auto max-w-[94rem] overflow-hidden rounded-[2rem] bg-[#ff5947] px-6 py-16 text-center text-white sm:px-10 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/75">Panel para restaurantes</p>
          <h2 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
            Convierte el feedback en seguimiento diario.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/85">
            Accede a tus respuestas, alertas y herramientas de configuración.
          </p>
          <LoginButton className="mt-9 bg-[#2b1235] hover:bg-[#3c1949]" />
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#38203e]/10 bg-[#fbf7ef]/90 backdrop-blur">
      <div className={`${container} flex min-h-20 items-center justify-between gap-4 px-5 sm:px-8 lg:px-12`}>
        <Link
          href="/"
          className="text-3xl font-semibold tracking-[-0.045em] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff5947]/25"
        >
          Senti<span className="text-[#ff5947]">Q</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold" aria-label="Navegación principal">
          <Link
            href="#como-funciona"
            className="hidden min-h-11 items-center px-3 text-[#5f5260] transition hover:text-[#24102d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff5947]/25 sm:inline-flex"
          >
            Cómo funciona
          </Link>
          <Link
            href="/privacidad"
            className="hidden min-h-11 items-center px-3 text-[#5f5260] transition hover:text-[#24102d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff5947]/25 md:inline-flex"
          >
            Privacidad
          </Link>
          <Link
            href="/login"
            className={buttonVariants({
              size: "lg",
              className: "min-h-11 rounded-xl bg-[#2b1235] px-5 text-white hover:bg-[#3c1949] focus-visible:ring-[#ff5947]/30",
            })}
          >
            Iniciar sesión
          </Link>
        </nav>
      </div>
    </header>
  );
}

function LoginButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/login"
      className={buttonVariants({
        size: "lg",
        className: `min-h-12 rounded-xl bg-[#ff5947] px-6 text-base text-white shadow-[0_14px_32px_-18px_rgba(255,89,71,0.85)] hover:bg-[#ed4938] focus-visible:ring-[#ff5947]/30 ${className}`,
      })}
    >
      Iniciar sesión
      <ArrowRight className="size-5" aria-hidden="true" />
    </Link>
  );
}

function SectionHeading({ eyebrow, title, body, dark = false }: { eyebrow: string; title: string; body: string; dark?: boolean }) {
  return (
    <div className="max-w-3xl">
      <p className={`text-sm font-bold uppercase tracking-[0.18em] ${dark ? "text-[#d7e75a]" : "text-[#ff5947]"}`}>{eyebrow}</p>
      <h2 className={`mt-4 text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-6xl ${dark ? "text-white" : "text-[#24102d]"}`}>{title}</h2>
      <p className={`mt-6 max-w-2xl text-lg leading-8 ${dark ? "text-white/65" : "text-[#695b68]"}`}>{body}</p>
    </div>
  );
}

function FeatureIcon({ icon: Icon }: { icon: typeof QrCode }) {
  return <div className="grid size-14 place-items-center rounded-2xl bg-[#ff5947] text-white"><Icon className="size-6" aria-hidden="true" /></div>;
}

function FeatureCheck({ children }: { children: React.ReactNode }) {
  return <li className="flex items-start gap-3"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#d7e75a] text-[#364000]"><Check className="size-4" aria-hidden="true" /></span><span>{children}</span></li>;
}

function DashboardPreview() {
  return (
    <div className="overflow-hidden border border-[#38203e]/15 bg-[#fffdf8] shadow-[0_30px_70px_-55px_rgba(43,18,53,0.55)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
      <div className="flex min-h-16 items-center justify-between border-b border-[#38203e]/10 px-5 sm:px-7">
        <div className="flex items-center gap-4"><span className="grid size-8 place-items-center bg-[#2b1235] text-sm font-bold text-white">Q</span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#827581]">Espacio de trabajo</p><p className="font-semibold text-[#24102d]">Sucursal Centro</p></div></div>
        <div className="hidden items-center gap-2 sm:flex"><PreviewButton icon={CalendarDays}>Últimos 30 días</PreviewButton><PreviewButton icon={Building2}>Todas las zonas</PreviewButton></div>
      </div>
      <div className="grid lg:grid-cols-[12rem_1fr]">
        <aside className="hidden border-r border-[#38203e]/10 bg-[#f3eee4] px-3 py-5 lg:block">
          {[
            [Store, "Resumen"], [MessageSquareText, "Respuestas"], [AlertCircle, "Alertas"], [Download, "Exportar"], [Settings2, "Configuración"],
          ].map(([Icon, label], index) => {
            const MenuIcon = Icon as typeof Store;
            return <div key={label as string} className={`mb-1 flex items-center gap-3 px-3 py-3 text-sm font-medium ${index === 1 ? "border-l-2 border-[#ff5947] bg-white text-[#24102d]" : "text-[#756875]"}`}><MenuIcon className="size-4" aria-hidden="true" />{label as string}</div>;
          })}
        </aside>
        <div className="grid xl:grid-cols-[1fr_19rem]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#38203e]/10 pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ff5947]">Actividad reciente</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Respuestas</h3></div><span className="text-sm text-[#796d78]">Ordenadas por fecha</span></div>
            <div className="divide-y divide-[#38203e]/10">
              {responseRows.map((row, index) => <div key={row.title} className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5 ${index === 1 ? "-mx-3 border-l-2 border-[#ff5947] bg-[#fff6f2] px-3" : ""}`}><span className="font-mono text-xs text-[#9a8f99]">0{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{row.title}</p><p className="mt-1 truncate text-xs text-[#7a6d79]">{row.detail}</p></div><span className={`hidden px-2.5 py-1 text-xs font-semibold sm:inline ${row.tone}`}>{row.status}</span></div>)}
            </div>
          </div>
          <aside className="border-t border-[#38203e]/10 bg-[#f3eee4] p-5 sm:p-7 xl:border-l xl:border-t-0">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#847783]">Detalle seleccionado</p>
            <div className="mt-6 flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center bg-[#ff5947] text-white"><AlertCircle className="size-4" aria-hidden="true" /></span><div><p className="font-semibold">Tiempo de espera</p><p className="mt-1 text-sm text-[#796d78]">Comedor · Hoy</p></div></div>
            <p className="mt-7 border-y border-[#38203e]/10 py-5 text-sm leading-6 text-[#554955]">“El servicio fue amable, pero esperamos más de lo previsto.”</p>
            <dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-[#817480]">Estado</dt><dd className="font-semibold text-[#9c3b30]">Pendiente</dd></div><div className="flex justify-between gap-3"><dt className="text-[#817480]">Origen</dt><dd className="font-semibold">Código QR</dd></div></dl>
            <div className="mt-7 flex min-h-10 items-center justify-center bg-[#2b1235] px-4 text-sm font-semibold text-white">Abrir seguimiento</div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function PreviewButton({ icon: Icon, children }: { icon: typeof CalendarDays; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 rounded-lg border border-[#38203e]/10 bg-white px-3 py-2 text-xs font-medium text-[#5f5260]"><Icon className="size-3.5" aria-hidden="true" />{children}<ChevronDown className="size-3" aria-hidden="true" /></span>;
}

function SurveyPreview() {
  return (
    <div className="relative min-h-[34rem] overflow-hidden border-y border-[#38203e]/15 bg-[#f3eee4] p-5 sm:p-8">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(43,18,53,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(43,18,53,.08)_1px,transparent_1px)] [background-size:40px_40px]" aria-hidden="true" />
      <div className="relative flex items-center justify-between border-b border-[#38203e]/15 pb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#766976]"><span>Captura en mesa</span><span>Sucursal Centro · Comedor</span></div>
      <div className="relative mt-10 grid grid-cols-1 items-end gap-6 sm:grid-cols-[0.78fr_1.22fr] sm:gap-7">
        <div className="mb-8 border border-[#38203e]/15 bg-[#fffdf8] p-4 shadow-[10px_12px_0_0_#ff5947] sm:p-6">
          <p className="text-2xl font-semibold tracking-[-0.04em]">Comparte tu visita.</p>
          <div className="mx-auto my-8 grid aspect-square w-24 place-items-center border-8 border-[#2b1235] bg-white text-[#2b1235] sm:w-32"><QrCode className="size-14 sm:size-20" aria-hidden="true" /></div>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#776b77]">Escanea para responder</p>
        </div>
        <div className="border-[7px] border-[#2b1235] bg-[#fffdf8] p-4 shadow-[0_28px_45px_-35px_rgba(43,18,53,.7)] sm:p-6">
          <div className="flex items-center justify-between border-b border-[#38203e]/10 pb-4"><div><p className="text-xs font-bold text-[#ff5947]">SentiQ</p><p className="mt-1 text-sm font-semibold">Encuesta del restaurante</p></div><Smartphone className="size-4 text-[#766976]" aria-hidden="true" /></div>
          <p className="mt-6 text-sm font-semibold">¿Cómo estuvo el servicio?</p>
          <div className="mt-4 grid grid-cols-5 gap-1.5">{[1,2,3,4,5].map((value) => <span key={value} className={`grid aspect-square place-items-center border text-xs font-semibold ${value === 4 ? "border-[#ff5947] bg-[#ffebe5] text-[#9c3b30]" : "border-[#38203e]/10 text-[#766976]"}`}>{value}</span>)}</div>
          <div className="mt-5 h-14 border border-[#38203e]/10 bg-white p-2 text-[10px] text-[#9b909a]">Comentario opcional</div>
          <div className="mt-4 flex min-h-9 items-center justify-center bg-[#2b1235] text-xs font-semibold text-white">Continuar</div>
        </div>
      </div>
    </div>
  );
}

function ResponsesPreview() {
  return (
    <div className="rounded-[2rem] border border-[#38203e]/10 bg-[#fffdf8] p-4 shadow-[0_25px_55px_-40px_rgba(43,18,53,0.5)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xl font-semibold">Respuestas</p><p className="mt-1 text-sm text-[#7a6d79]">Listado de feedback visible</p></div><span className="inline-flex items-center gap-2 rounded-xl border border-[#38203e]/10 bg-white px-3 py-2 text-sm font-medium"><SlidersHorizontal className="size-4" aria-hidden="true" />Filtros</span></div>
      <div className="mt-5 flex flex-wrap gap-2"><FilterChip icon={CalendarDays}>Fecha</FilterChip><FilterChip icon={Building2}>Sucursal</FilterChip><FilterChip icon={ClipboardCheck}>Estado</FilterChip></div>
      <div className="mt-5 space-y-3">{responseRows.map((row) => <article key={row.title} className="flex items-center gap-3 rounded-2xl border border-[#38203e]/10 bg-white p-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f5eddf] text-[#2b1235]"><MessageSquareText className="size-5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="truncate font-semibold">{row.title}</p><p className="mt-1 truncate text-sm text-[#7a6d79]">{row.detail}</p></div><span className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline ${row.tone}`}>{row.status}</span></article>)}</div>
    </div>
  );
}

function FilterChip({ icon: Icon, children }: { icon: typeof CalendarDays; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 rounded-full bg-[#f5eddf] px-3 py-2 text-xs font-semibold text-[#625363]"><Icon className="size-3.5" aria-hidden="true" />{children}<ChevronDown className="size-3" aria-hidden="true" /></span>;
}

function AlertPreview() {
  return (
    <div className="rounded-[2rem] border border-[#38203e]/10 bg-[#f5eddf] p-5 sm:p-8">
      <div className="rounded-[1.5rem] border border-[#ff5947]/20 bg-[#fffdf8] p-5 shadow-[0_20px_50px_-38px_rgba(43,18,53,0.55)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-[#ffe0d7] text-[#ff5947]"><AlertCircle className="size-6" aria-hidden="true" /></span><div><p className="font-semibold">Alerta de experiencia</p><p className="mt-1 text-sm text-[#7a6d79]">Sucursal Centro · Comedor</p></div></div><span className="rounded-full bg-[#ffe0d7] px-3 py-1.5 text-xs font-bold text-[#9c3b30]">Pendiente</span></div>
        <p className="mt-7 rounded-2xl bg-[#fbf7ef] p-5 leading-7 text-[#554755]">“El servicio fue amable, pero esperamos más de lo previsto.”</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#38203e]/10 p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#8a7d89]">Estado</p><p className="mt-2 flex items-center gap-2 font-semibold"><Clock3 className="size-4 text-[#ff5947]" aria-hidden="true" />Requiere seguimiento</p></div><div className="rounded-xl border border-[#38203e]/10 p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#8a7d89]">Acción disponible</p><p className="mt-2 flex items-center gap-2 font-semibold"><ClipboardCheck className="size-4 text-[#697700]" aria-hidden="true" />Actualizar estado</p></div></div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-[#fbf7ef] px-5 py-9 sm:px-8 lg:px-12">
      <div className={`${container} flex flex-col gap-5 text-sm text-[#6d5f6d] sm:flex-row sm:items-center sm:justify-between`}>
        <p className="text-xl font-semibold tracking-[-0.035em] text-[#24102d]">Senti<span className="text-[#ff5947]">Q</span></p>
        <div className="flex flex-wrap items-center gap-5"><Link href="/privacidad" className="font-medium hover:text-[#24102d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff5947]/25">Aviso de privacidad</Link><span>Piloto controlado</span></div>
      </div>
    </footer>
  );
}
