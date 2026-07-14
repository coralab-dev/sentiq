"use client";

import {
  BarChart3,
  Bell,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { LoadingState, RoleBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import {
  getCurrentSessionProfile,
  getNavigationForRole,
  getUnauthorizedRedirect,
  type AuthSessionState,
} from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/domain";

type AppShellProps = {
  children: ReactNode;
  variant: "restaurant" | "platform";
};

type NavigationItem = {
  label: string;
  href: string;
};

const navigationIcons: Record<string, typeof LayoutDashboard> = {
  [ROUTES.APP_DASHBOARD]: LayoutDashboard,
  [ROUTES.APP_RESPONSES]: MessageSquareText,
  [ROUTES.APP_ALERTS]: Bell,
  [ROUTES.APP_EXPORT]: Download,
  [ROUTES.APP_SETTINGS]: Settings,
};

function isActiveNavigationItem(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getShellTitle(pathname: string): string {
  const titles = [
    [ROUTES.PLATFORM_ADMIN_RESTAURANT_NEW, "Nuevo restaurante"],
    [ROUTES.PLATFORM_ADMIN_RESTAURANTS, "Restaurantes"],
    [ROUTES.APP_DASHBOARD, "Resumen"],
    [ROUTES.APP_RESPONSES, "Respuestas"],
    [ROUTES.APP_ALERTS, "Alertas"],
    [ROUTES.APP_EXPORT, "Exportar"],
    [ROUTES.APP_SETTINGS_ACCOUNT, "Cuenta"],
    [ROUTES.APP_SETTINGS_WAITERS, "Meseros"],
    [ROUTES.APP_SETTINGS_QR, "Códigos QR"],
    [ROUTES.APP_SETTINGS_DEVICES, "Dispositivos"],
    [ROUTES.APP_SETTINGS_QUESTIONS, "Encuesta"],
    [ROUTES.APP_SETTINGS_USERS, "Usuarios"],
    [ROUTES.APP_SETTINGS_ZONES, "Zonas"],
    [ROUTES.APP_SETTINGS, "Configuración"],
    [ROUTES.APP_NO_ACCESS, "Sin acceso"],
  ] as const;

  return (
    titles.find(([href]) => isActiveNavigationItem(pathname, href))?.[1] ??
    "Panel restaurante"
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href={ROUTES.APP_DASHBOARD}
      className="inline-flex min-h-11 items-center rounded-md font-semibold tracking-[-0.05em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5947]"
      aria-label="Ir al resumen de SentiQ"
    >
      {compact ? (
        <span className="text-2xl text-white">Q<span className="text-[#ff5947]">.</span></span>
      ) : (
        <span className="text-3xl text-white">Senti<span className="text-[#ff5947]">Q</span></span>
      )}
    </Link>
  );
}

function AppNavigation({
  role,
  variant,
  compact = false,
  onNavigate,
  items,
}: {
  role: UserRole;
  variant: "restaurant" | "platform";
  compact?: boolean;
  onNavigate?: () => void;
  items?: readonly NavigationItem[];
}) {
  const pathname = usePathname();
  const navigation = items ?? getNavigationForRole(role);

  return (
    <nav aria-label="Navegación del panel" className="flex flex-col gap-1.5">
      {navigation.map((item) => {
        const Icon = navigationIcons[item.href] ?? BarChart3;
        const isActive = isActiveNavigationItem(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            title={compact ? item.label : undefined}
            className={cn(
              "inline-flex min-h-11 items-center gap-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2",
              variant === "platform"
                ? "rounded-md px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-slate-500"
                : "relative rounded-md px-3 text-white/68 hover:bg-white/8 hover:text-white focus-visible:ring-[#ff5947]",
              compact && "justify-center px-0",
              variant === "platform" && isActive &&
                "bg-slate-950 text-white hover:bg-slate-950 hover:text-white",
              variant === "restaurant" && isActive &&
                "bg-white/10 text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-[#ff5947]",
            )}
          >
            <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
            {!compact ? item.label : <span className="sr-only">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function UserSummary({
  sessionState,
  inverse = false,
}: {
  sessionState: AuthSessionState;
  inverse?: boolean;
}) {
  const profile = sessionState.profile;
  const role = sessionState.role;
  const displayName = profile?.full_name || profile?.email || "Usuario";
  const email = profile?.email || sessionState.user?.email;

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn("truncate text-sm font-semibold", inverse ? "text-white" : "text-slate-950")}>
          {displayName}
        </p>
        {!inverse && role ? <RoleBadge role={role} /> : null}
      </div>
      {email ? (
        <p className={cn("truncate text-xs", inverse ? "text-white/48" : "text-slate-500")}>{email}</p>
      ) : null}
    </div>
  );
}

export function AppShell({ children, variant }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [sessionState, setSessionState] = useState<AuthSessionState | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function validateAccess() {
      setIsRedirecting(false);
      const nextSessionState = await getCurrentSessionProfile();

      if (!isMounted) return;

      const redirectTo = getUnauthorizedRedirect(
        nextSessionState.isActiveProfile ? nextSessionState.role : null,
        pathname,
      );

      if (redirectTo && redirectTo !== pathname) {
        setIsRedirecting(true);
        router.replace(redirectTo);
        return;
      }

      setSessionState(nextSessionState);
    }

    void validateAccess();
    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.replace(ROUTES.LOGIN);
  }

  if (!sessionState || isRedirecting) {
    return (
      <LoadingState
        title={isRedirecting ? "Redirigiendo" : "Validando sesión"}
        description={isRedirecting ? "Abriendo la sección correspondiente." : "Preparando tu espacio de trabajo."}
        className="min-h-screen rounded-none border-0 shadow-none"
      />
    );
  }

  if (!sessionState.isActiveProfile || !sessionState.role) {
    return (
      <LoadingState
        title="Sin acceso"
        description="No encontramos un perfil activo para esta sesión."
        className="min-h-screen rounded-none border-0 shadow-none"
      />
    );
  }

  if (variant === "platform") {
    return (
      <PlatformShell
        sessionState={sessionState}
        role={sessionState.role}
        pathname={pathname}
        isMobileMenuOpen={isMobileMenuOpen}
        isLoggingOut={isLoggingOut}
        onToggleMenu={() => setIsMobileMenuOpen((open) => !open)}
        onCloseMenu={() => setIsMobileMenuOpen(false)}
        onLogout={() => void handleLogout()}
      >
        {children}
      </PlatformShell>
    );
  }

  const navigation = getNavigationForRole(sessionState.role);
  const primaryMobileNavigation = navigation.filter((item) =>
    [ROUTES.APP_DASHBOARD, ROUTES.APP_RESPONSES, ROUTES.APP_ALERTS].includes(
      item.href as typeof ROUTES.APP_DASHBOARD,
    ),
  );
  const secondaryMobileNavigation = navigation.filter(
    (item) => !primaryMobileNavigation.includes(item),
  );

  return (
    <div className="restaurant-app min-h-screen bg-[var(--sq-canvas)] text-[var(--sq-ink)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col bg-[var(--sq-aubergine)] md:flex lg:w-[248px]">
        <div className="flex min-h-20 items-center justify-center border-b border-white/10 px-3 lg:justify-start lg:px-6">
          <span className="lg:hidden"><Brand compact /></span>
          <span className="hidden lg:inline"><Brand /></span>
        </div>
        <div className="flex-1 px-3 py-6">
          <div className="lg:hidden"><AppNavigation role={sessionState.role} variant="restaurant" compact /></div>
          <div className="hidden lg:block">
            <AppNavigation role={sessionState.role} variant="restaurant" />
          </div>
        </div>
        <div className="border-t border-white/10 p-3 lg:p-5">
          <div className="hidden lg:block"><UserSummary sessionState={sessionState} inverse /></div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mx-auto mt-0 min-h-11 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            aria-label="Cerrar sesión"
          >
            <LogOut aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="mt-4 hidden min-h-11 w-full justify-start text-white/60 hover:bg-white/10 hover:text-white lg:flex"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
          >
            <LogOut aria-hidden="true" />
            {isLoggingOut ? "Saliendo..." : "Cerrar sesión"}
          </Button>
        </div>
      </aside>

      <div className="min-w-0 md:pl-20 lg:pl-[248px]">
        <main className="min-w-0 px-4 py-5 pb-28 sm:px-6 sm:py-6 md:pb-8 lg:px-8 lg:py-8 xl:px-10">{children}</main>
      </div>

      {isMobileMenuOpen ? (
        <div id="restaurant-mobile-more" role="dialog" aria-modal="true" aria-label="Más opciones" className="fixed inset-x-3 bottom-20 z-50 rounded-2xl border border-[var(--sq-line)] bg-[var(--sq-surface)] p-4 shadow-2xl md:hidden">
          <UserSummary sessionState={sessionState} />
          <div className="mt-4 border-t border-[var(--sq-line)] pt-4">
            <AppNavigation role={sessionState.role} variant="platform" items={secondaryMobileNavigation} onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
          <Button type="button" variant="ghost" className="mt-3 min-h-11 w-full justify-start" onClick={() => void handleLogout()} disabled={isLoggingOut}>
            <LogOut aria-hidden="true" />{isLoggingOut ? "Saliendo..." : "Cerrar sesión"}
          </Button>
        </div>
      ) : null}

      <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--sq-line)] bg-[var(--sq-surface)]/96 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden">
        {primaryMobileNavigation.map((item) => {
          const Icon = navigationIcons[item.href] ?? LayoutDashboard;
          const active = isActiveNavigationItem(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[0.6875rem] font-semibold text-[var(--sq-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sq-coral)]", active && "text-[var(--sq-aubergine)]")}>
              <Icon className={cn("size-5", active && "text-[var(--sq-coral)]")} aria-hidden="true" />{item.label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setIsMobileMenuOpen((open) => !open)} aria-expanded={isMobileMenuOpen} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[0.6875rem] font-semibold text-[var(--sq-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sq-coral)]">
          <MoreHorizontal className="size-5" aria-hidden="true" />Más
        </button>
      </nav>
    </div>
  );
}

function PlatformShell({
  children,
  sessionState,
  role,
  pathname,
  isMobileMenuOpen,
  isLoggingOut,
  onToggleMenu,
  onCloseMenu,
  onLogout,
}: {
  children: ReactNode;
  sessionState: AuthSessionState;
  role: UserRole;
  pathname: string;
  isMobileMenuOpen: boolean;
  isLoggingOut: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-slate-200 px-5 py-5"><p className="text-base font-semibold">SentiQ</p><p className="text-xs text-slate-500">Panel de plataforma</p></div>
        <div className="flex-1 px-3 py-4"><AppNavigation role={role} variant="platform" /></div>
        <div className="border-t border-slate-200 p-4">
          <UserSummary sessionState={sessionState} />
          <Button type="button" variant="outline" className="mt-4 w-full justify-start" onClick={onLogout} disabled={isLoggingOut}><LogOut aria-hidden="true" />{isLoggingOut ? "Saliendo..." : "Cerrar sesión"}</Button>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0"><p className="text-xs font-medium uppercase text-slate-500">Panel de plataforma</p><h1 className="truncate text-lg font-semibold">{getShellTitle(pathname)}</h1></div>
            <div className="hidden min-w-0 items-center gap-3 md:flex"><UserSummary sessionState={sessionState} /><Button type="button" variant="outline" onClick={onLogout} disabled={isLoggingOut}><LogOut aria-hidden="true" />{isLoggingOut ? "Saliendo..." : "Salir"}</Button></div>
            <Button type="button" variant="outline" size="icon" className="md:hidden" onClick={onToggleMenu} aria-expanded={isMobileMenuOpen} aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}>{isMobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</Button>
          </div>
          {isMobileMenuOpen ? <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden"><AppNavigation role={role} variant="platform" onNavigate={onCloseMenu} /><div className="mt-4 border-t border-slate-200 pt-4"><UserSummary sessionState={sessionState} /><Button type="button" variant="outline" className="mt-4 w-full justify-start" onClick={onLogout} disabled={isLoggingOut}><LogOut aria-hidden="true" />{isLoggingOut ? "Saliendo..." : "Cerrar sesión"}</Button></div></div> : null}
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
