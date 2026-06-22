"use client";

import {
  Bell,
  BarChart3,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
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
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/domain";

type AppShellProps = {
  children: ReactNode;
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
  if (isActiveNavigationItem(pathname, ROUTES.PLATFORM_ADMIN_RESTAURANT_NEW)) {
    return "Nuevo restaurante";
  }

  if (isActiveNavigationItem(pathname, ROUTES.PLATFORM_ADMIN_RESTAURANTS)) {
    return "Restaurantes";
  }
  if (isActiveNavigationItem(pathname, ROUTES.APP_DASHBOARD)) {
    return "Dashboard";
  }

  if (isActiveNavigationItem(pathname, ROUTES.APP_RESPONSES)) {
    return "Respuestas";
  }

  if (isActiveNavigationItem(pathname, ROUTES.APP_ALERTS)) {
    return "Alertas";
  }

  if (isActiveNavigationItem(pathname, ROUTES.APP_EXPORT)) {
    return "Exportar";
  }

  if (isActiveNavigationItem(pathname, ROUTES.APP_SETTINGS)) {
    return "Configuracion";
  }

  if (isActiveNavigationItem(pathname, ROUTES.APP_NO_ACCESS)) {
    return "Sin acceso";
  }

  return "Panel restaurante";
}

function AppNavigation({
  role,
  onNavigate,
}: {
  role: UserRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const navigation = useMemo(() => getNavigationForRole(role), [role]);

  return (
    <nav aria-label="Navegacion del panel" className="flex flex-col gap-1">
      {navigation.map((item) => {
        const Icon = navigationIcons[item.href] ?? BarChart3;
        const isActive = isActiveNavigationItem(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
              isActive && "bg-slate-950 text-white hover:bg-slate-950 hover:text-white",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserSummary({ sessionState }: { sessionState: AuthSessionState }) {
  const profile = sessionState.profile;
  const role = sessionState.role;
  const displayName = profile?.full_name || profile?.email || "Usuario";
  const email = profile?.email || sessionState.user?.email;

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="truncate text-sm font-semibold text-slate-950">
          {displayName}
        </p>
        {role ? <RoleBadge role={role} /> : null}
      </div>
      {email ? (
        <p className="truncate text-xs text-slate-500">{email}</p>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [sessionState, setSessionState] = useState<AuthSessionState | null>(
    null,
  );
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function validateAccess() {
      setIsRedirecting(false);
      const nextSessionState = await getCurrentSessionProfile();

      if (!isMounted) {
        return;
      }

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

    validateAccess();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  async function handleLogout() {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.replace(ROUTES.LOGIN);
  }

  if (!sessionState || isRedirecting) {
    return (
      <LoadingState
        title={isRedirecting ? "Redirigiendo" : "Validando sesion"}
        description={
          isRedirecting
            ? "Te estamos llevando a la seccion correspondiente."
            : "Estamos revisando tu sesion y permisos."
        }
        className="min-h-screen rounded-none border-0 shadow-none"
      />
    );
  }

  if (!sessionState.isActiveProfile || !sessionState.role) {
    return (
      <LoadingState
        title="Sin acceso"
        description="No encontramos un perfil activo para esta sesion."
        className="min-h-screen rounded-none border-0 shadow-none"
      />
    );
  }

  const shellTitle = getShellTitle(pathname);
  const shellLabel = sessionState.role === "platform_admin" ? "Panel de plataforma" : "Panel restaurante";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-base font-semibold">SentiQ</p>
          <p className="text-xs text-slate-500">{shellLabel}</p>
        </div>
        <div className="flex-1 px-3 py-4">
          <AppNavigation role={sessionState.role} />
        </div>
        <div className="border-t border-slate-200 p-4">
          <UserSummary sessionState={sessionState} />
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full justify-start"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut aria-hidden="true" />
            {isLoggingOut ? "Saliendo..." : "Cerrar sesion"}
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-normal text-slate-500">
                {shellLabel}
              </p>
              <h1 className="truncate text-lg font-semibold tracking-normal">
                {shellTitle}
              </h1>
            </div>

            <div className="hidden min-w-0 items-center gap-3 md:flex">
              <UserSummary sessionState={sessionState} />
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut aria-hidden="true" />
                {isLoggingOut ? "Saliendo..." : "Salir"}
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
            >
              {isMobileMenuOpen ? (
                <X aria-hidden="true" />
              ) : (
                <Menu aria-hidden="true" />
              )}
            </Button>
          </div>

          {isMobileMenuOpen ? (
            <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
              <AppNavigation
                role={sessionState.role}
                onNavigate={() => setIsMobileMenuOpen(false)}
              />
              <div className="mt-4 border-t border-slate-200 pt-4">
                <UserSummary sessionState={sessionState} />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full justify-start"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut aria-hidden="true" />
                  {isLoggingOut ? "Saliendo..." : "Cerrar sesion"}
                </Button>
              </div>
            </div>
          ) : null}
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
